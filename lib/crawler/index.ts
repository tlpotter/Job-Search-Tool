import * as fs from "fs";
import * as path from "path";
import { searchConfig } from "../config";
import { JobListing } from "./types";
import { adzunaSource } from "./sources/adzuna";
import { jsearchSource } from "./sources/jsearch";
import { remoteokSource } from "./sources/remoteok";
import { weworkremotelySource } from "./sources/weworkremotely";
import { greenhouseSource } from "./sources/greenhouse";
import { leverSource } from "./sources/lever";
import { jobicySource } from "./sources/jobicy";
import { ashbySource } from "./sources/ashby";
import { bamboohrSource } from "./sources/bamboohr";
import { workdaySource } from "./sources/workday";
// Removed (zero high-quality listings over months of running):
//   coroflot, dribbble, hn-hiring, remotive
// Other excluded:
//   indeed: blocked by CAPTCHA on RSS endpoint
//   the-muse: API returns 0 UX/Design results
//   builtin: client-rendered React app, no accessible API
//   workable: big tech companies don't use it, returns empty
//   icims: requires HTML scraping of JS-rendered pages, too fragile
import { dedup, saveListings } from "./dedup";
import { cleanupOldListings } from "./cleanup";
import { classifyListing } from "./classify";
import { estimateSalary } from "./salary-estimate";
import { lookupCompanyReputation, enrichWithReputation } from "./company-reputation";
import { scoreListing } from "./score";
import { aiRankListing } from "./ai-rank";
import { sendDigest } from "../email/send";

const sources = [
  adzunaSource,
  jsearchSource,
  remoteokSource,
  weworkremotelySource,
  greenhouseSource,
  leverSource,
  jobicySource,
  ashbySource,
  bamboohrSource,
  workdaySource,
];

async function fetchAllSources(): Promise<JobListing[]> {
  const results = await Promise.allSettled(
    sources.map((s) =>
      s.fetch(searchConfig).then((listings) => {
        console.log(`  ${s.name}: ${listings.length} listings`);
        return listings;
      }).catch((err) => {
        console.error(`  ${s.name}: failed -`, err.message);
        return [] as JobListing[];
      })
    )
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function runCrawler(): Promise<void> {
  console.log("=== Job Crawler Starting ===");
  console.log(`${new Date().toISOString()}\n`);

  // Step 1: Fetch
  console.log("Step 1: Fetching from sources...");
  const raw = await fetchAllSources();
  console.log(`  Total fetched: ${raw.length}\n`);

  // Step 2: Deduplicate
  console.log("Step 2: Deduplicating...");
  const newListings = await dedup(raw);
  console.log(`  New listings: ${newListings.length}\n`);

  if (newListings.length === 0) {
    console.log("No new listings — cleaning up + sending digest of existing top matches.");
    await cleanupOldListings(30);
    await sendDigest();
    return;
  }

  // Step 3: Classify
  console.log("Step 3: Classifying...");
  const classified = newListings.map(classifyListing);

  // Step 4: Estimate salary
  console.log("Step 4: Estimating salaries...");
  const withSalary = classified.map(estimateSalary);

  // Step 5: Score and filter
  console.log("Step 5: Scoring...");
  const scored = withSalary
    .map(scoreListing)
    .filter((l) => (l.relevanceScore ?? 0) >= searchConfig.minRelevanceScore);
  console.log(`  ${scored.length} listings above score threshold (${searchConfig.minRelevanceScore})\n`);

  // Step 5b: Save early — persist all listings before expensive API calls
  // If the process dies during reputation/AI ranking, data is safe and
  // the bulk ai-score-all.ts script can pick up AI scoring on next run.
  console.log("Saving to Supabase (early save)...");
  await saveListings(scored);
  console.log(`  Saved ${scored.length} listings\n`);

  // Step 6: Company reputation — only for listings scoring ≥60
  console.log("Step 6: Looking up company reputations...");
  const topScoringListings = scored.filter((l) => (l.relevanceScore ?? 0) >= 60);
  const companies = [...new Set(topScoringListings.map((j) => j.company))];
  console.log(`  ${companies.length} unique companies to look up (listings scoring ≥60)`);

  const reputations = new Map<string, Awaited<ReturnType<typeof lookupCompanyReputation>>>();
  let repDone = 0;
  const REP_CONCURRENCY = 5;
  for (let i = 0; i < companies.length; i += REP_CONCURRENCY) {
    const batch = companies.slice(i, i + REP_CONCURRENCY);
    await Promise.all(batch.map(async (company) => {
      reputations.set(company, await lookupCompanyReputation(company));
      repDone++;
      process.stdout.write(`\r  ${repDone}/${companies.length} companies looked up`);
    }));
  }
  console.log();

  const withReputation = scored.map((job) => {
    const rep = reputations.get(job.company);
    return rep ? enrichWithReputation(job, rep) : job;
  });

  // Step 7: AI rank top candidates
  console.log("Step 7: AI ranking top candidates...");
  const topCandidates = withReputation.filter((l) => (l.relevanceScore ?? 0) >= 60);
  console.log(`  ${topCandidates.length} listings to AI rank`);

  const profilePath = path.join(process.cwd(), "lib", "profile.md");
  const profile = fs.existsSync(profilePath)
    ? fs.readFileSync(profilePath, "utf-8")
    : "";

  const AI_CONCURRENCY = 5;
  let aiDone = 0;
  for (let i = 0; i < topCandidates.length; i += AI_CONCURRENCY) {
    const batch = topCandidates.slice(i, i + AI_CONCURRENCY);
    await Promise.all(batch.map(async (job) => {
      try {
        const aiResult = await aiRankListing(job, profile);
        job.aiFitScore = aiResult.fitScore;
        job.aiFitSummary = aiResult.summary;
        job.aiSkillGaps = aiResult.gaps;
        job.aiHighlights = aiResult.highlights;
        job.aiDescriptionSummary = aiResult.descriptionSummary;
      } catch (err) {
        console.error(`  AI rank failed for ${job.title} @ ${job.company}:`, err);
      }
      aiDone++;
      process.stdout.write(`\r  ${aiDone}/${topCandidates.length} AI ranked`);
    }));
  }
  console.log();

  // Final sort: keyword score + AI fit score
  withReputation.sort((a, b) => {
    const aTotal = (a.relevanceScore ?? 0) + (a.aiFitScore ?? 0) * 0.5;
    const bTotal = (b.relevanceScore ?? 0) + (b.aiFitScore ?? 0) * 0.5;
    return bTotal - aTotal;
  });

  // Save again with reputation + AI scores updated
  console.log("\nSaving to Supabase (final save with AI scores)...");
  await saveListings(withReputation);
  console.log(`  Updated ${withReputation.length} listings`);

  // Cleanup: delete unactioned listings older than 30 days
  console.log("\nCleaning up stale listings...");
  await cleanupOldListings(30);

  // Send email digest (pulls top unreviewed listings from DB)
  console.log("Sending email digest...");
  await sendDigest();

  console.log("\n=== Crawler Complete ===");
  console.log(`Processed ${withReputation.length} new listings.`);
}
