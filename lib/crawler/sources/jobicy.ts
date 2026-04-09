import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  pubDate: string;
  jobDescription: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryCurrency?: string;
}

function formatSalary(min?: number, max?: number, currency?: string): string | undefined {
  if (!min && !max) return undefined;
  const sym = currency === "USD" ? "$" : (currency ?? "$");
  if (min && max) return `${sym}${Math.round(min / 1000)}K–${sym}${Math.round(max / 1000)}K`;
  if (min) return `${sym}${Math.round(min / 1000)}K+`;
  return undefined;
}

export const jobicySource: JobSource = {
  name: "jobicy",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    // tag search works; industry param returns 400
    const tags = ["ux designer", "product designer", "ui designer", "design systems"];

    for (const tag of tags) {
      try {
        const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(tag)}`);
        if (!res.ok) continue;

        const json = await res.json();
        const jobs: JobicyJob[] = json.jobs ?? [];

        for (const job of jobs) {
          const description = (job.jobDescription ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          const salary = formatSalary(job.annualSalaryMin, job.annualSalaryMax, job.salaryCurrency);

          const listing: JobListing = {
            id: "",
            source: "jobicy",
            title: job.jobTitle,
            company: job.companyName,
            location: job.jobGeo || "Remote",
            remote: true,
            url: job.url,
            salary,
            postedDate: job.pubDate?.split(" ")[0],
            description,
            firstSeen: new Date().toISOString().split("T")[0],
          };

          listing.id = generateId(listing);
          if (!seen.has(listing.id)) {
            seen.add(listing.id);
            results.push(listing);
          }
        }
      } catch (err) {
        console.error(`Jobicy fetch error for industry "${industry}":`, err);
      }
    }

    return results;
  },
};
