import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

// Indeed RSS — free, no API key required, ~10-15 results per query
// Covers jobs not listed on specialty boards
const QUERIES = [
  "ux+designer",
  "product+designer",
  "ui+designer",
  "design+systems+designer",
  "interaction+designer",
  "ux+researcher",
  "experience+designer",
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Indeed RSS title format: "Job Title - Company Name - City, ST"
function parseTitle(raw: string): { title: string; company: string; location: string } {
  const parts = raw.split(" - ").map((s) => s.trim());
  if (parts.length >= 3) {
    return { title: parts[0], company: parts[1], location: parts.slice(2).join(" - ") };
  }
  if (parts.length === 2) {
    return { title: parts[0], company: parts[1], location: "" };
  }
  return { title: raw, company: "Unknown", location: "" };
}

function parseDate(pubDate: string): string | undefined {
  try {
    return new Date(pubDate).toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

export const indeedSource: JobSource = {
  name: "indeed",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    for (const query of QUERIES) {
      try {
        // Remote-friendly search across all locations
        const url = `https://www.indeed.com/rss?q=${query}&sort=date&fromage=14`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0; RSS reader)",
            Accept: "application/rss+xml, application/xml, text/xml",
          },
        });
        if (!res.ok) continue;

        const xml = await res.text();

        // Extract <item> blocks
        const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

        for (const item of items) {
          const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
            item.match(/<title>(.*?)<\/title>/);
          const linkMatch = item.match(/<link>(.*?)<\/link>/) ??
            item.match(/<guid[^>]*>(.*?)<\/guid>/);
          const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
          const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ??
            item.match(/<description>([\s\S]*?)<\/description>/);

          if (!titleMatch || !linkMatch) continue;

          const rawTitle = titleMatch[1].trim();
          const link = linkMatch[1].trim();
          const { title, company, location } = parseTitle(rawTitle);
          const description = descMatch ? stripHtml(descMatch[1]) : "";

          // Skip if link already seen (dedup across queries)
          if (seen.has(link)) continue;
          seen.add(link);

          const isRemote =
            location.toLowerCase().includes("remote") ||
            description.toLowerCase().includes("remote");

          const listing: JobListing = {
            id: "",
            source: "indeed",
            title,
            company,
            location: location || (isRemote ? "Remote" : "Unknown"),
            remote: isRemote,
            url: link,
            postedDate: pubDateMatch ? parseDate(pubDateMatch[1]) : undefined,
            description,
            firstSeen: new Date().toISOString().split("T")[0],
          };

          listing.id = generateId(listing);
          results.push(listing);
        }
      } catch (err) {
        console.error(`Indeed RSS fetch error for query "${query}":`, err);
      }
    }

    return results;
  },
};
