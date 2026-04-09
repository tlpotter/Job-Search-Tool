import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

const UX_PATTERNS = [
  /\bux\b/i, /\bui\b/i, /\buser experience\b/i, /\bproduct designer\b/i,
  /\binteraction designer\b/i, /\bexperience designer\b/i, /\bdesign systems\b/i,
  /\bdesign lead\b/i, /\bux engineer\b/i, /\bdesign technologist\b/i,
  /\bcontent designer\b/i, /\bproduct design\b/i, /\bvisual designer\b/i,
];

function parseRSS(xml: string): { title: string; url: string; pubDate: string; description: string }[] {
  const results = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];

    const title = block.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/)?.[1]?.trim() ??
                  block.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? "";
    const url = block.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() ??
                block.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1]?.trim() ?? "";
    const pubDate = block.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim() ?? "";
    const desc = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
                 block.match(/<description>([^<]*)<\/description>/)?.[1] ?? "";

    if (!title || !url) continue;
    results.push({ title, url, pubDate, description: desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
  }

  return results;
}

export const coroflotSource: JobSource = {
  name: "coroflot",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    try {
      const res = await fetch("https://www.coroflot.com/jobs/rss", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0)" },
      });
      if (!res.ok) return [];

      const xml = await res.text();
      const items = parseRSS(xml);

      for (const item of items) {
        const isUXRole = UX_PATTERNS.some((re) => re.test(item.title));
        if (!isUXRole) continue;

        // Coroflot title format: "Company is seeking a Job Title"
        // Try to extract company and job title
        let company = "";
        let title = item.title;
        const seekingMatch = item.title.match(/^(.+?)\s+is\s+seeking\s+(?:a\s+|an\s+)?(.+)$/i);
        if (seekingMatch) {
          company = seekingMatch[1].trim();
          title = seekingMatch[2].trim();
        }

        // Try to extract location from description
        const locationMatch = item.description.match(/\b([A-Z][a-z]+(?:,\s*[A-Z]{2})?)\b/);
        const location = locationMatch?.[1] ?? "See listing";
        const isRemote = item.description.toLowerCase().includes("remote") || item.title.toLowerCase().includes("remote");

        const postedDate = item.pubDate ? new Date(item.pubDate).toISOString().split("T")[0] : undefined;

        const listing: JobListing = {
          id: "",
          source: "coroflot",
          title,
          company,
          location: isRemote ? "Remote" : location,
          remote: isRemote,
          url: item.url,
          postedDate,
          description: item.description,
          firstSeen: new Date().toISOString().split("T")[0],
        };

        listing.id = generateId(listing);
        if (!seen.has(listing.id)) {
          seen.add(listing.id);
          results.push(listing);
        }
      }
    } catch (err) {
      console.error("Coroflot fetch error:", err);
    }

    return results;
  },
};
