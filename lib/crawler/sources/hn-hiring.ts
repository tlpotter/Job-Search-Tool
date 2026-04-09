import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";

const UX_PATTERNS = [
  /\bux\b/i, /\bui\b/i, /\buser experience\b/i, /\bproduct designer\b/i,
  /\binteraction designer\b/i, /\bexperience designer\b/i, /\bdesign systems\b/i,
  /\bdesign lead\b/i, /\bux engineer\b/i, /\bdesign technologist\b/i,
  /\bcontent designer\b/i, /\bproduct design\b/i, /\bvisual designer\b/i,
];

const HN_BASE = "https://hacker-news.firebaseio.com/v0";

async function getCurrentHiringThreadId(): Promise<number | null> {
  const res = await fetch(`${HN_BASE}/user/whoishiring.json`);
  if (!res.ok) return null;
  const user = await res.json();

  // Submitted items are newest first; find first "Who is Hiring?" (not "Who wants to be hired?")
  const ids: number[] = user.submitted ?? [];
  for (const id of ids.slice(0, 10)) {
    const itemRes = await fetch(`${HN_BASE}/item/${id}.json`);
    if (!itemRes.ok) continue;
    const item = await itemRes.json();
    if (item.title?.includes("Who is hiring?")) return id;
  }
  return null;
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function parseComment(text: string): { company: string; title: string; location: string; remote: boolean; description: string } | null {
  // Get the headline (before first <p> tag)
  const headline = text.split(/<p>/i)[0];

  // Strip anchor tags but keep text content
  const headlineClean = decodeHtml(
    headline.replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1").replace(/<[^>]+>/g, "").trim()
  );

  // HN format: "Company | URL (optional) | Role | Location | Type"
  // URL part starts with http, so we skip it
  const parts = headlineClean
    .split("|")
    .map(s => s.trim())
    .filter(s => s && !s.startsWith("http"));

  if (parts.length < 2) return null;

  const company = parts[0];
  const title = parts[1];
  const location = parts[2] ?? "";

  // Full plain text for description
  const fullClean = decodeHtml(
    text.replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  );

  const isRemote =
    fullClean.toLowerCase().includes("remote") ||
    location.toLowerCase().includes("remote") ||
    location.toLowerCase().includes("anywhere");

  return { company, title, location: location || "See listing", remote: isRemote, description: fullClean.slice(0, 1000) };
}

export const hnHiringSource: JobSource = {
  name: "hn-hiring",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    try {
      const threadId = await getCurrentHiringThreadId();
      if (!threadId) {
        console.error("HN Hiring: could not find thread");
        return [];
      }

      const threadRes = await fetch(`${HN_BASE}/item/${threadId}.json`);
      if (!threadRes.ok) return [];
      const thread = await threadRes.json();
      const kids: number[] = thread.kids ?? [];

      // Fetch all top-level comments (these are the job postings)
      // Batch in groups to avoid overwhelming the API
      const BATCH = 20;
      for (let i = 0; i < kids.length; i += BATCH) {
        const batch = kids.slice(i, i + BATCH);
        const comments = await Promise.all(
          batch.map(async (id) => {
            try {
              const r = await fetch(`${HN_BASE}/item/${id}.json`);
              if (!r.ok) return null;
              return r.json();
            } catch {
              return null;
            }
          })
        );

        for (const comment of comments) {
          if (!comment || comment.dead || comment.deleted || !comment.text) continue;

          // Check if text mentions UX/design
          const isUXRole = UX_PATTERNS.some((re) => re.test(comment.text));
          if (!isUXRole) continue;

          const parsed = parseComment(comment.text);
          if (!parsed) continue;

          const postedDate = comment.time
            ? new Date(comment.time * 1000).toISOString().split("T")[0]
            : undefined;

          const listing: JobListing = {
            id: "",
            source: "hn-hiring",
            title: parsed.title || "See listing",
            company: parsed.company || "Unknown",
            location: parsed.location,
            remote: parsed.remote,
            url: `https://news.ycombinator.com/item?id=${comment.id}`,
            postedDate,
            description: parsed.description,
            firstSeen: new Date().toISOString().split("T")[0],
          };

          listing.id = generateId(listing);
          if (!seen.has(listing.id)) {
            seen.add(listing.id);
            results.push(listing);
          }
        }
      }
    } catch (err) {
      console.error("HN Hiring fetch error:", err);
    }

    return results;
  },
};
