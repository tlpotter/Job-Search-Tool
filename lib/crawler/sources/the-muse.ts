import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

interface MuseJob {
  id: number;
  name: string;
  company: { name: string };
  locations: { name: string }[];
  refs: { landing_page: string };
  contents: string;
  publication_date: string;
  levels: { name: string; short_name: string }[];
  categories: { name: string }[];
}

export const theMuseSource: JobSource = {
  name: "the-muse",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const categories = ["Design+%26+UX"];
    const levels = ["Senior+Level", "Management+%26+Executive"];
    const results: JobListing[] = [];
    const seen = new Set<string>();

    for (const category of categories) {
      for (const level of levels) {
        try {
          const url = `https://www.themuse.com/api/public/jobs?category=${category}&level=${level}&location=Flexible+%2F+Remote&page=0&descending=true`;
          const res = await fetch(url);
          if (!res.ok) continue;

          const json = await res.json();
          const jobs: MuseJob[] = json.results ?? [];

          for (const job of jobs) {
            const location = job.locations.map((l) => l.name).join(", ");
            const isRemote =
              location.toLowerCase().includes("remote") ||
              location.toLowerCase().includes("flexible");

            // Strip HTML from contents
            const description = job.contents.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

            const listing: JobListing = {
              id: "",
              source: "the-muse",
              title: job.name,
              company: job.company.name,
              location,
              remote: isRemote,
              url: job.refs.landing_page,
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
          console.error("The Muse fetch error:", err);
        }
      }
    }

    return results;
  },
};
