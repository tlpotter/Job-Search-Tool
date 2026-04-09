import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

export const builtinSource: JobSource = {
  name: "builtin",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    try {
      // Built In has a JSON API endpoint for job search
      const params = new URLSearchParams({
        category: "UX & Design",
        remote: "true",
        seniority: "Senior",
        page: "1",
        perPage: "50",
      });

      const res = await fetch(
        `https://builtin.com/api/jobs?${params}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) return [];

      const json = await res.json();
      const jobs = json.jobs ?? json.data ?? [];
      const results: JobListing[] = [];

      for (const job of jobs) {
        const title: string = job.title ?? job.name ?? "";
        const company: string = job.company?.name ?? job.companyName ?? "";
        const location: string = job.builtInRemote ? "Remote" : (job.city ?? "");
        const url: string = job.url ?? `https://builtin.com/job/${job.id ?? job.slug}`;

        if (!title || !company) continue;

        const listing: JobListing = {
          id: "",
          source: "builtin",
          title,
          company,
          location,
          remote: job.builtInRemote ?? location.toLowerCase().includes("remote"),
          url,
          postedDate: job.datePosted?.split("T")[0] ?? job.created_at?.split("T")[0],
          description: job.description ?? "",
          firstSeen: new Date().toISOString().split("T")[0],
        };

        listing.id = generateId(listing);
        results.push(listing);
      }

      return results;
    } catch (err) {
      console.error("Built In scraper error:", err);
      return [];
    }
  },
};
