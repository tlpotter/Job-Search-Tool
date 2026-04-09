import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

const PAGES = 5; // Dribbble paginates with ?page=N

async function fetchDribbblePage(page: number): Promise<string> {
  const url = `https://dribbble.com/jobs?location=Anywhere&skills=ux-design&page=${page}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) return "";
  return res.text();
}

function parseJobs(html: string): { title: string; company: string; url: string; location: string }[] {
  const results = [];

  // Split on list items
  const itemPattern = /<li class="job-list-item[^"]*">([\s\S]*?)<\/li>/g;
  let match;

  while ((match = itemPattern.exec(html)) !== null) {
    const block = match[1];

    const urlMatch = block.match(/class="job-link"[^>]*href="([^"]+)"/);
    const titleMatch = block.match(/class="[^"]*job-board-job-title[^"]*">([^<]+)<\/h4>/);
    const companyMatch = block.match(/class="job-board-job-company">([^<]+)<\/span>/);
    const locationMatch = block.match(/class="location">\s*([\s\S]*?)\s*<\/span>/);

    if (!urlMatch || !titleMatch || !companyMatch) continue;

    results.push({
      url: `https://dribbble.com${urlMatch[1].split("?")[0]}`,
      title: titleMatch[1].trim(),
      company: companyMatch[1].trim(),
      location: locationMatch ? locationMatch[1].trim() : "Remote",
    });
  }

  return results;
}

export const dribbbleSource: JobSource = {
  name: "dribbble",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const seen = new Set<string>();
    const results: JobListing[] = [];

    for (let page = 1; page <= PAGES; page++) {
      try {
        const html = await fetchDribbblePage(page);
        if (!html) break;

        const jobs = parseJobs(html);
        if (jobs.length === 0) break;

        for (const job of jobs) {
          const isRemote =
            job.location.toLowerCase().includes("remote") ||
            job.location.toLowerCase().includes("anywhere");

          const listing: JobListing = {
            id: "",
            source: "dribbble",
            title: job.title,
            company: job.company,
            location: job.location,
            remote: isRemote,
            url: job.url,
            firstSeen: new Date().toISOString().split("T")[0],
          };

          listing.id = generateId(listing);

          if (!seen.has(listing.id)) {
            seen.add(listing.id);
            results.push(listing);
          }
        }
      } catch (err) {
        console.error(`Dribbble fetch error page ${page}:`, err);
        break;
      }
    }

    return results;
  },
};
