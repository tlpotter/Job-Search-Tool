import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  publication_date: string;
  description: string;
  salary: string;
  job_type: string;
  tags: string[];
}

export const remotiveSource: JobSource = {
  name: "remotive",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    // "ux" is the active category; "design" and "product" included as fallback
    const categories = ["ux", "design", "product"];

    for (const category of categories) {
      try {
        const res = await fetch(`https://remotive.com/api/remote-jobs?category=${category}`);
        if (!res.ok) continue;

        const json = await res.json();
        const jobs: RemotiveJob[] = json.jobs ?? [];

        for (const job of jobs) {
          const description = job.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

          const listing: JobListing = {
            id: "",
            source: "remotive",
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location || "Remote",
            remote: true,
            url: job.url,
            salary: job.salary || undefined,
            postedDate: job.publication_date?.split("T")[0],
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
        console.error(`Remotive fetch error for category "${category}":`, err);
      }
    }

    return results;
  },
};
