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
  const p = path.join(process.cwd(), "lib", "crawler", "sources", "data", "greenhouse_companies.json");
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

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  updated_at: string;
  content?: string;
  departments?: { name: string }[];
}

async function fetchCompany(
  company: CompanyEntry,
  health: SlugHealth
): Promise<JobListing[]> {
  let outcome: FetchOutcome;
  try {
    const res = await fetch(
      `https://api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`
    );
    if (res.status === 404) {
      outcome = "not_found";
    } else if (!res.ok) {
      outcome = "transient";
    } else {
      outcome = "success";
      const json = await res.json();
      const jobs: GreenhouseJob[] = json.jobs ?? [];
      const out: JobListing[] = [];

      for (const job of jobs) {
        if (!UX_PATTERNS.some((re) => re.test(job.title))) continue;

        const location = job.location?.name ?? "";
        const isRemote =
          location.toLowerCase().includes("remote") ||
          location.toLowerCase().includes("anywhere") ||
          location === "";
        if (!isUSOrRemote(location, isRemote)) continue;

        const listing: JobListing = {
          id: "",
          source: "greenhouse",
          title: job.title,
          company: company.name,
          location: location || "Remote",
          remote: isRemote,
          url: job.absolute_url,
          postedDate: job.updated_at?.split("T")[0],
          description: cleanDescription(job.content ?? ""),
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

export const greenhouseSource: JobSource = {
  name: "greenhouse",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const allCompanies = loadCompanies();
    const health = new SlugHealth("greenhouse");
    await health.load();

    const toAttempt = allCompanies.filter((c) => health.shouldAttempt(c.slug));
    const batches = await runConcurrent(toAttempt, 30, (c) => fetchCompany(c, health));

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
