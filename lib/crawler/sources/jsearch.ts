import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote: boolean;
  job_apply_link: string;
  job_description: string;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_salary_period?: string;
}

function formatSalary(
  min?: number,
  max?: number,
  period?: string
): string | undefined {
  if (!min && !max) return undefined;

  // Convert hourly/monthly to annual
  let annualMin = min;
  let annualMax = max;
  if (period === "HOUR") {
    annualMin = min ? min * 2080 : undefined;
    annualMax = max ? max * 2080 : undefined;
  } else if (period === "MONTH") {
    annualMin = min ? min * 12 : undefined;
    annualMax = max ? max * 12 : undefined;
  }

  if (annualMin && annualMax) {
    return `$${Math.round(annualMin / 1000)}K–$${Math.round(annualMax / 1000)}K`;
  }
  if (annualMin) return `$${Math.round(annualMin / 1000)}K+`;
  if (annualMax) return `Up to $${Math.round(annualMax / 1000)}K`;
  return undefined;
}

export const jsearchSource: JobSource = {
  name: "jsearch",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.warn("JSearch: missing RAPIDAPI_KEY, skipping");
      return [];
    }

    const queries = [
      "senior UX designer remote",
      "senior product designer remote",
      "staff UX designer remote",
      "staff product designer remote",
      "lead product designer remote",
      "lead UX designer remote",
      "UX design lead remote",
      "product design lead remote",
      "principal UX designer remote",
      "senior interaction designer remote",
      "senior experience designer remote",
      "design systems designer remote",
      "design technologist remote",
      "UX engineer remote",
    ];

    // INITIAL_PULL=true in env does a deeper catch-up pull (5 pages, month range)
    // Normal daily runs do 1 page, week range
    const isInitialPull = process.env.JSEARCH_INITIAL_PULL === "true";
    const numPages = isInitialPull ? "5" : "1";
    const datePosted = isInitialPull ? "month" : "week";

    const seen = new Set<string>();
    const results: JobListing[] = [];

    for (const query of queries) {
      try {
        const params = new URLSearchParams({
          query,
          page: "1",
          num_pages: numPages,
          date_posted: datePosted,
          remote_jobs_only: "true",
        });

        const res = await fetch(
          `https://jsearch.p.rapidapi.com/search?${params}`,
          {
            headers: {
              "X-RapidAPI-Key": apiKey,
              "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
          }
        );

        // Check quota headers — stop early if near the limit
        const remaining = parseInt(res.headers.get("X-RateLimit-Requests-Remaining") ?? "999");
        const limit = parseInt(res.headers.get("X-RateLimit-Requests-Limit") ?? "999");
        const usedPct = ((limit - remaining) / limit) * 100;
        if (usedPct >= 90) {
          console.warn(`  JSearch: quota at ${Math.round(usedPct)}% (${remaining} remaining) — stopping early`);
          break;
        }

        if (!res.ok) continue;

        const json = await res.json();
        const jobs: JSearchJob[] = json.data ?? [];

        for (const job of jobs) {
          const locationParts = [job.job_city, job.job_state, job.job_country]
            .filter(Boolean)
            .join(", ");

          const salary = formatSalary(
            job.job_min_salary,
            job.job_max_salary,
            job.job_salary_period
          );

          const listing: JobListing = {
            id: "",
            source: "jsearch",
            title: job.job_title,
            company: job.employer_name,
            location: locationParts || "Remote",
            remote: job.job_is_remote,
            url: job.job_apply_link,
            salary,
            postedDate: job.job_posted_at_datetime_utc?.split("T")[0],
            description: job.job_description,
            firstSeen: new Date().toISOString().split("T")[0],
          };

          listing.id = generateId(listing);

          if (!seen.has(listing.id)) {
            seen.add(listing.id);
            results.push(listing);
          }
        }
      } catch (err) {
        console.error(`JSearch fetch error for query "${query}":`, err);
      }
    }

    return results;
  },
};
