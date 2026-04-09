import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

interface RemoteOKJob {
  id: string;
  url: string;
  position: string;
  company: string;
  location: string;
  date: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  tags: string[];
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  if (min && max) return `$${Math.round(min / 1000)}K–$${Math.round(max / 1000)}K`;
  if (min) return `$${Math.round(min / 1000)}K+`;
  return undefined;
}

export const remoteokSource: JobSource = {
  name: "remoteok",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    const tagSets = ["ux", "design,senior", "product-design"];

    for (const tags of tagSets) {
      try {
        const res = await fetch(`https://remoteok.com/api?tags=${tags}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0)",
          },
        });
        if (!res.ok) continue;

        const json = await res.json();
        // First element is a legal notice object, skip it
        const jobs: RemoteOKJob[] = (json as RemoteOKJob[]).filter((j) => j.id && j.position);

        for (const job of jobs) {
          const description = (job.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          const salary = formatSalary(job.salary_min, job.salary_max);

          const listing: JobListing = {
            id: "",
            source: "remoteok",
            title: job.position,
            company: job.company,
            location: job.location || "Remote",
            remote: true,
            url: job.url.startsWith("http") ? job.url : `https://remoteok.com${job.url}`,
            salary,
            postedDate: job.date?.split("T")[0],
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
        console.error(`RemoteOK fetch error for tags "${tags}":`, err);
      }
    }

    return results;
  },
};
