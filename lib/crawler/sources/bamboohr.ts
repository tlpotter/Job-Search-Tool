import * as fs from "fs";
import * as path from "path";
import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";
import { cleanDescription } from "../../utils/clean-description";
import { runConcurrent } from "../utils/concurrent";
import { isUSOrRemote } from "../utils/location-filter";

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
  // Public embed feed location fields vary; try several
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

async function fetchCompany(company: CompanyEntry): Promise<JobListing[]> {
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
    if (!res.ok) return [];

    const json = await res.json();
    const jobs: BambooJob[] = json.result ?? json.jobs ?? [];
    if (!Array.isArray(jobs)) return [];

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
    return out;
  } catch {
    return [];
  }
}

export const bamboohrSource: JobSource = {
  name: "bamboohr",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const companies = loadCompanies();
    const batches = await runConcurrent(companies, 10, fetchCompany);

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
    return results;
  },
};
