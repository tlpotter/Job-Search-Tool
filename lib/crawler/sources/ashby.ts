import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";
import { cleanDescription } from "../../utils/clean-description";

// Companies confirmed on Ashby with UX/design roles
const COMPANIES: { slug: string; name: string }[] = [
  // AI / ML
  { slug: "openai", name: "OpenAI" },
  { slug: "cohere", name: "Cohere" },
  { slug: "elevenlabs", name: "ElevenLabs" },
  { slug: "character", name: "Character.AI" },
  { slug: "perplexity", name: "Perplexity" },
  { slug: "mosaic", name: "MosaicML" },
  // Fintech / Payments
  { slug: "ramp", name: "Ramp" },
  { slug: "deel", name: "Deel" },
  { slug: "acorns", name: "Acorns" },
  // Productivity / Collaboration
  { slug: "notion", name: "Notion" },
  { slug: "linear", name: "Linear" },
  { slug: "mural", name: "MURAL" },
  { slug: "n8n", name: "n8n" },
  { slug: "sanity", name: "Sanity" },
  // Dev tools / Infrastructure
  { slug: "ashby", name: "Ashby" },
  { slug: "zapier", name: "Zapier" },
  { slug: "posthog", name: "PostHog" },
  { slug: "supabase", name: "Supabase" },
  { slug: "railway", name: "Railway" },
  { slug: "inngest", name: "Inngest" },
  { slug: "resend", name: "Resend" },
  // AI / ML — newer companies (verified slugs)
  { slug: "harvey", name: "Harvey" },
  { slug: "poolside", name: "Poolside" },
  { slug: "pika", name: "Pika" },
  { slug: "ideogram", name: "Ideogram" },
  { slug: "krea", name: "Krea" },
  { slug: "suno", name: "Suno" },
  { slug: "sierra", name: "Sierra" },
  { slug: "dust", name: "Dust" },
  { slug: "letta", name: "Letta" },
  { slug: "cursor", name: "Cursor" },
  // Fintech
  { slug: "mercury", name: "Mercury (Ashby)" },
  { slug: "baseten", name: "Baseten" },
];

const UX_PATTERNS = [
  /\bux\b/i, /\bui\b/i, /\buser experience\b/i, /\bproduct designer\b/i,
  /\binteraction designer\b/i, /\bexperience designer\b/i, /\bdesign systems\b/i,
  /\bdesign lead\b/i, /\bux engineer\b/i, /\bdesign technologist\b/i,
  /\bcontent designer\b/i, /\bproduct design\b/i, /\bvisual designer\b/i,
];

interface AshbyJob {
  id: string;
  title: string;
  jobUrl: string;
  isRemote: boolean;
  location?: { name?: string };
  publishedDate: string;
  department?: { name?: string };
  descriptionPlain?: string;
}

export const ashbySource: JobSource = {
  name: "ashby",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    for (const company of COMPANIES) {
      try {
        const res = await fetch(
          `https://api.ashbyhq.com/posting-api/job-board/${company.slug}`,
          { headers: { "User-Agent": "Mozilla/5.0 (compatible; job-crawler/1.0)" } }
        );
        if (!res.ok) continue;

        const json = await res.json();
        const jobs: AshbyJob[] = json.jobs ?? [];

        for (const job of jobs) {
          const isUXRole = UX_PATTERNS.some((re) => re.test(job.title));
          if (!isUXRole) continue;

          const location = job.location?.name ?? "";
          const isRemote = job.isRemote || location.toLowerCase().includes("remote") || location === "";

          const listing: JobListing = {
            id: "",
            source: "ashby",
            title: job.title,
            company: company.name,
            location: isRemote ? "Remote" : (location || "See listing"),
            remote: isRemote,
            url: job.jobUrl,
            postedDate: job.publishedDate?.split("T")[0],
            description: cleanDescription(job.descriptionPlain ?? ""),
            firstSeen: new Date().toISOString().split("T")[0],
          };

          listing.id = generateId(listing);
          if (!seen.has(listing.id)) {
            seen.add(listing.id);
            results.push(listing);
          }
        }
      } catch (err) {
        console.error(`Ashby fetch error for ${company.name}:`, err);
      }
    }

    return results;
  },
};
