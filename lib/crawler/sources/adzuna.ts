import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area?: string[] };
  salary_min?: number;
  salary_max?: number;
  description: string;
  redirect_url: string;
  created: string;
  contract_type?: string;
  category?: { label: string };
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  if (min && max) return `$${Math.round(min / 1000)}K–$${Math.round(max / 1000)}K`;
  if (min) return `$${Math.round(min / 1000)}K+`;
  if (max) return `Up to $${Math.round(max / 1000)}K`;
  return undefined;
}

async function fetchAdzunaPage(
  query: string,
  page: number,
  appId: string,
  apiKey: string
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: apiKey,
    results_per_page: "50",
    what: query,
    sort_by: "date",
    max_days_old: "30",
  });

  const url = `https://api.adzuna.com/v1/api/jobs/us/search/${page}?${params}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return [];

  const json = await res.json();
  if (page === 1) {
    console.log(`    Adzuna "${query}": ${json.count ?? "?"} total available`);
  }
  return json.results ?? [];
}

export const adzunaSource: JobSource = {
  name: "adzuna",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;
    if (!appId || !apiKey) {
      console.warn("Adzuna: missing ADZUNA_APP_ID or ADZUNA_API_KEY, skipping");
      return [];
    }

    const queries = [
      "senior UX designer",
      "senior product designer",
      "staff UX designer",
      "staff product designer",
      "lead product designer",
      "lead UX designer",
      "UX design lead",
      "product design lead",
      "principal UX designer",
      "senior interaction designer",
      "senior experience designer",
      "senior UI UX designer",
      "design technologist",
      "design systems designer",
      "UX engineer",
    ];

    const MAX_PAGES = 20;
    const seen = new Set<string>();
    const results: JobListing[] = [];

    for (const query of queries) {
      for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const jobs = await fetchAdzunaPage(query, page, appId, apiKey);
        if (jobs.length === 0) break; // no more results for this query
        for (const job of jobs) {
          // Skip jobs missing required fields that would crash generateId
          if (!job.title || !job.company?.display_name || !job.redirect_url) continue;

          const location = job.location?.display_name ?? "";
          const isRemote =
            location.toLowerCase().includes("remote") ||
            (job.description ?? "").toLowerCase().includes("remote");

          const salary = formatSalary(job.salary_min, job.salary_max);

          const listing: JobListing = {
            id: "",
            source: "adzuna",
            title: job.title,
            company: job.company.display_name,
            location,
            remote: isRemote,
            url: job.redirect_url,
            salary,
            postedDate: job.created?.split("T")[0],
            description: job.description,
            firstSeen: new Date().toISOString().split("T")[0],
          };

          listing.id = generateId(listing);

          if (!seen.has(listing.id)) {
            seen.add(listing.id);
            results.push(listing);
          }
        }
      } catch (err) {
        console.error(`Adzuna fetch error for query "${query}" page ${page}:`, err);
        break;
      }
      }
    }

    return results;
  },
};
