import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { getSupabase } from "../lib/supabase";
import { aiRankListing } from "../lib/crawler/ai-rank";
import { JobListing } from "../lib/crawler/types";

const SCORE_THRESHOLD = 60;
const CONCURRENCY = 3; // parallel requests to avoid rate limits

async function main() {
  const sb = getSupabase();

  const { data, error } = await sb
    .from("listings")
    .select("*")
    .gte("relevance_score", SCORE_THRESHOLD)
    .or("ai_fit_score.is.null,ai_fit_score.eq.50,ai_fit_score.eq.0,ai_description_summary.is.null")
    .limit(10000);

  if (error) { console.error(error); return; }

  console.log(`Found ${data.length} listings >= ${SCORE_THRESHOLD} needing AI scoring\n`);

  const profilePath = path.join(process.cwd(), "lib", "profile.md");
  const profile = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, "utf-8") : "";

  let done = 0;
  let failed = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < data.length; i += CONCURRENCY) {
    const batch = data.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (row) => {
      try {
        const listing = {
          id: row.id,
          title: row.title,
          company: row.company,
          description: row.description,
          salary: row.salary,
          estimatedSalary: row.estimated_salary,
          companyRating: row.company_rating,
          companyWorkLifeBalance: row.company_wlb,
          companyGrowthTrend: row.company_growth_trend,
          companyHeadcount: row.company_headcount,
          companyRedFlags: row.company_red_flags,
          companyReputationAvailable: row.company_reputation_available,
        } as JobListing;

        const result = await aiRankListing(listing, profile);

        await sb.from("listings").update({
          ai_fit_score: result.fitScore,
          ai_fit_summary: result.summary,
          ai_skill_gaps: result.gaps,
          ai_highlights: result.highlights,
          ai_description_summary: result.descriptionSummary ?? null,
        }).eq("id", row.id);

        done++;
        process.stdout.write(`\r  ${done}/${data.length} scored (${failed} failed)`);
      } catch (err) {
        failed++;
        console.error(`\n  Failed: ${row.title} @ ${row.company} —`, err instanceof Error ? err.message : err);
      }
    }));
  }

  console.log(`\n\nDone. ${done} scored, ${failed} failed.`);
}

main();
