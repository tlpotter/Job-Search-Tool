import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

async function fetchFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0)" },
  });
  if (!res.ok) return "";
  return res.text();
}

function parseRSS(xml: string): { title: string; company: string; url: string; pubDate: string; description: string }[] {
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

    // WWR title format: "Company Name: Job Title"
    const colonIdx = title.indexOf(":");
    const company = colonIdx > -1 ? title.slice(0, colonIdx).trim() : "";
    const jobTitle = colonIdx > -1 ? title.slice(colonIdx + 1).trim() : title;

    if (!jobTitle || !url) continue;

    results.push({
      title: jobTitle,
      company,
      url,
      pubDate,
      description: desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
  }

  return results;
}

export const weworkremotelySource: JobSource = {
  name: "weworkremotely",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const feeds = [
      "https://weworkremotely.com/categories/remote-design-jobs.rss",
      "https://weworkremotely.com/categories/remote-product-jobs.rss",
    ];

    const seen = new Set<string>();
    const results: JobListing[] = [];

    for (const feedUrl of feeds) {
      try {
        const xml = await fetchFeed(feedUrl);
        if (!xml) continue;

        const items = parseRSS(xml);

        for (const item of items) {
          const postedDate = item.pubDate ? new Date(item.pubDate).toISOString().split("T")[0] : undefined;

          const listing: JobListing = {
            id: "",
            source: "weworkremotely",
            title: item.title,
            company: item.company,
            location: "Remote",
            remote: true,
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
        console.error(`WeWorkRemotely fetch error for ${feedUrl}:`, err);
      }
    }

    return results;
  },
};
