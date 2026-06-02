import * as fs from "fs";
import * as path from "path";
import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";
import { cleanDescription } from "../../utils/clean-description";
import { runConcurrent } from "../utils/concurrent";
import { isUSOrRemote } from "../utils/location-filter";
import { SlugHealth, type FetchOutcome } from "../utils/slug-health";

interface CompanyEntry {
  slug: string;
  name: string;
}

function loadCompanies(): CompanyEntry[] {
  const p = path.join(process.cwd(), "lib", "crawler", "sources", "data", "ashby_companies.json");
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return [];
  }
}

const UX_PATTERNS = [
  /\bux\b/i, /\bui\b/i, /\buser experience\b/i, /\bproduct designer\b/i,
  /\binteraction designer\b/i, /\bexperience designer\b/i, /\bdesign systems\b/i,
  /\bdesign lead\b/i, /\bux engineer\b/i, /\bdesign technologist\b/i,
  /\bcontent designer\b/i, /\bproduct design\b/i, /\bvisual designer\b/i,
];

interface AshbyJob {
  id: string;
  title: string;
  jobUrl: string;
  isRemote: boolean;
  location?: { name?: string };
  publishedDate: string;
  department?: { name?: string };
  descriptionPlain?: string;
}

async function fetchCompany(
  company: CompanyEntry,
  health: SlugHealth
): Promise<JobListing[]> {
  let outcome: FetchOutcome;
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${company.slug}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0)" } }
    );
    if (res.status === 404) {
      outcome = "not_found";
    } else if (!res.ok) {
      outcome = "transient";
    } else {
      outcome = "success";
      const json = await res.json();
      const jobs: AshbyJob[] = json.jobs ?? [];
      const out: JobListing[] = [];

      for (const job of jobs) {
        if (!UX_PATTERNS.some((re) => re.test(job.title))) continue;

        const location = job.location?.name ?? "";
        const isRemote = job.isRemote || location.toLowerCase().includes("remote") || location === "";
        if (!isUSOrRemote(location, isRemote)) continue;

        const listing: JobListing = {
          id: "",
          source: "ashby",
          title: job.title,
          company: company.name,
          location: isRemote ? "Remote" : (location || "See listing"),
          remote: isRemote,
          url: job.jobUrl,
          postedDate: job.publishedDate?.split("T")[0],
          description: cleanDescription(job.descriptionPlain ?? ""),
          firstSeen: new Date().toISOString().split("T")[0],
        };
        listing.id = generateId(listing);
        out.push(listing);
      }
      health.record(company.slug, outcome);
      return out;
    }
  } catch {
    outcome = "transient";
  }
  health.record(company.slug, outcome);
  return [];
}

export const ashbySource: JobSource = {
  name: "ashby",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const allCompanies = loadCompanies();
    const health = new SlugHealth("ashby");
    await health.load();

    const toAttempt = allCompanies.filter((c) => health.shouldAttempt(c.slug));
    const batches = await runConcurrent(toAttempt, 20, (c) => fetchCompany(c, health));

    const seen = new Set<string>();
    const results: JobListing[] = [];
    for (const batch of batches) {
      for (const listing of batch) {
        if (!seen.has(listing.id)) {
          seen.add(listing.id);
          results.push(listing);
        }
      }
    }

    await health.flush();
    console.log(`    ${health.summary(allCompanies.length, toAttempt.length, results.length)}`);
    return results;
  },
};
