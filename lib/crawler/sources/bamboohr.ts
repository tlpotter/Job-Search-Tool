import * as fs from "fs";
import * as path from "path";
import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";
import { runConcurrent } from "../utils/concurrent";
import { isUSOrRemote } from "../utils/location-filter";
import { SlugHealth, type FetchOutcome } from "../utils/slug-health";

interface CompanyEntry {
  slug: string;
  name: string;
}

function loadCompanies(): CompanyEntry[] {
  const p = path.join(process.cwd(), "lib", "crawler", "sources", "data", "bamboohr_companies.json");
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

interface BambooJob {
  id?: number | string;
  jobOpeningName?: string;
  location?: { city?: string; state?: string; addressLine1?: string };
  city?: string;
  state?: string;
  country?: string;
  departmentLabel?: string;
  employmentStatusLabel?: string;
  jobOpeningStatus?: string;
  isRemote?: boolean;
  datePosted?: string;
  jobOpeningShareUrl?: string;
}

function bambooLocation(j: BambooJob): string {
  const parts: string[] = [];
  if (j.location?.city) parts.push(j.location.city);
  if (j.location?.state) parts.push(j.location.state);
  if (j.city) parts.push(j.city);
  if (j.state) parts.push(j.state);
  if (j.country) parts.push(j.country);
  return [...new Set(parts.filter(Boolean))].join(", ");
}

async function fetchCompany(
  company: CompanyEntry,
  health: SlugHealth
): Promise<JobListing[]> {
  let outcome: FetchOutcome;
  try {
    const res = await fetch(
      `https://${company.slug}.bamboohr.com/careers/list?version=1.0.0`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0)",
        },
      }
    );
    if (res.status === 404) {
      outcome = "not_found";
    } else if (!res.ok) {
      outcome = "transient";
    } else {
      outcome = "success";
      const json = await res.json();
      const jobs: BambooJob[] = json.result ?? json.jobs ?? [];
      if (!Array.isArray(jobs)) {
        health.record(company.slug, "transient");
        return [];
      }

      const out: JobListing[] = [];
      for (const job of jobs) {
        const title = job.jobOpeningName ?? "";
        if (!UX_PATTERNS.some((re) => re.test(title))) continue;
        if (job.jobOpeningStatus && job.jobOpeningStatus !== "Open") continue;

        const location = bambooLocation(job);
        const remoteFlag =
          job.isRemote === true ||
          location.toLowerCase().includes("remote") ||
          location === "";
        if (!isUSOrRemote(location, remoteFlag)) continue;

        const url =
          job.jobOpeningShareUrl ??
          `https://${company.slug}.bamboohr.com/careers/${job.id ?? ""}`;

        const listing: JobListing = {
          id: "",
          source: "bamboohr",
          title,
          company: company.name,
          location: location || "Remote",
          remote: remoteFlag,
          url,
          postedDate: job.datePosted?.split("T")[0],
          description: "",
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

export const bamboohrSource: JobSource = {
  name: "bamboohr",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const allCompanies = loadCompanies();
    const health = new SlugHealth("bamboohr");
    await health.load();

    const toAttempt = allCompanies.filter((c) => health.shouldAttempt(c.slug));
    const batches = await runConcurrent(toAttempt, 10, (c) => fetchCompany(c, health));

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
