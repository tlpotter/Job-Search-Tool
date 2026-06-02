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
  instance: string;
  site: string;
}

function loadCompanies(): CompanyEntry[] {
  const p = path.join(process.cwd(), "lib", "crawler", "sources", "data", "workday_companies.json");
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return [];
  }
}

// Workday slugs are composite — keep the same uniqueness in the health table
function healthKey(c: CompanyEntry): string {
  return `${c.slug}|${c.instance}|${c.site}`;
}

const UX_PATTERNS = [
  /\bux\b/i, /\bui\b/i, /\buser experience\b/i, /\bproduct designer\b/i,
  /\binteraction designer\b/i, /\bexperience designer\b/i, /\bdesign systems\b/i,
  /\bdesign lead\b/i, /\bux engineer\b/i, /\bdesign technologist\b/i,
  /\bcontent designer\b/i, /\bproduct design\b/i, /\bvisual designer\b/i,
];

interface WorkdayJob {
  title?: string;
  externalPath?: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
}

async function fetchCompany(
  company: CompanyEntry,
  health: SlugHealth
): Promise<JobListing[]> {
  const { slug, instance, site, name } = company;
  const base = `https://${slug}.${instance}.myworkdayjobs.com`;
  const apiUrl = `${base}/wday/cxs/${slug}/${site}/jobs`;
  const key = healthKey(company);
  let outcome: FetchOutcome;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0)",
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: "designer",
      }),
    });
    if (res.status === 404) {
      outcome = "not_found";
    } else if (!res.ok) {
      outcome = "transient";
    } else {
      outcome = "success";
      const json = await res.json();
      const jobs: WorkdayJob[] = json.jobPostings ?? [];

      const out: JobListing[] = [];
      for (const job of jobs) {
        const title = job.title ?? "";
        if (!UX_PATTERNS.some((re) => re.test(title))) continue;

        const location = job.locationsText ?? "";
        const remoteFlag = location.toLowerCase().includes("remote") || location === "";
        if (!isUSOrRemote(location, remoteFlag)) continue;

        const url = job.externalPath ? `${base}/en-US/${site}${job.externalPath}` : base;

        const listing: JobListing = {
          id: "",
          source: "workday",
          title,
          company: name,
          location: location || "Remote",
          remote: remoteFlag,
          url,
          postedDate: job.postedOn ? new Date(job.postedOn).toISOString().split("T")[0] : undefined,
          description: cleanDescription((job.bulletFields ?? []).join("\n")),
          firstSeen: new Date().toISOString().split("T")[0],
        };
        listing.id = generateId(listing);
        out.push(listing);
      }
      health.record(key, outcome);
      return out;
    }
  } catch {
    outcome = "transient";
  }
  health.record(key, outcome);
  return [];
}

export const workdaySource: JobSource = {
  name: "workday",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const allCompanies = loadCompanies();
    const health = new SlugHealth("workday");
    await health.load();

    const toAttempt = allCompanies.filter((c) => health.shouldAttempt(healthKey(c)));
    const batches = await runConcurrent(toAttempt, 15, (c) => fetchCompany(c, health));

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
