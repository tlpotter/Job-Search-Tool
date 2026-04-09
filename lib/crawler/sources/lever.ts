import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";
import { cleanDescription } from "../../utils/clean-description";

// Companies confirmed on Lever with public job boards
const COMPANIES: { slug: string; name: string }[] = [
  // Fintech
  { slug: "plaid", name: "Plaid" },
  { slug: "neon", name: "Neon" },
  { slug: "wealthfront", name: "Wealthfront" },
  // Marketing / Analytics
  { slug: "activecampaign", name: "ActiveCampaign" },
  { slug: "omnisend", name: "Omnisend" },
  { slug: "contentsquare", name: "Contentsquare" },
  { slug: "quantcast", name: "Quantcast" },
  { slug: "logrocket", name: "LogRocket" },
  // CRM / Sales
  { slug: "pipedrive", name: "Pipedrive" },
  // Identity / Security
  { slug: "jumpcloud", name: "JumpCloud" },
  { slug: "walkme", name: "WalkMe" },
  // People / HR
  { slug: "15five", name: "15Five" },
  // Content
  { slug: "prismic", name: "Prismic" },
  // Health
  { slug: "ro", name: "Ro" },
  { slug: "filevine", name: "Filevine" },
  { slug: "trustarc", name: "TrustArc" },
  // Music/Entertainment
  { slug: "spotify", name: "Spotify" },
  // No-code/Low-code
  { slug: "glide", name: "Glide" },
  { slug: "thunkable", name: "Thunkable" },
  { slug: "mendix", name: "Mendix" },
  // Dev tools / Productivity
  { slug: "retool", name: "Retool" },
  { slug: "replit", name: "Replit" },
  { slug: "hex", name: "Hex" },
  { slug: "dbtlabs", name: "dbt Labs" },
  { slug: "prefect", name: "Prefect" },
  { slug: "airbyte", name: "Airbyte" },
  { slug: "metabase", name: "Metabase" },
  { slug: "thoughtspot", name: "ThoughtSpot" },
  { slug: "mode", name: "Mode Analytics" },
  // Design / Creative
  { slug: "figma", name: "Figma (Lever)" },
  { slug: "marvel", name: "Marvel" },
  // Customer / Support tools
  { slug: "front", name: "Front" },
  { slug: "gladly", name: "Gladly" },
  { slug: "helpscout", name: "Help Scout" },
  { slug: "dixa", name: "Dixa" },
  // Fintech / Payments
  { slug: "modern-treasury", name: "Modern Treasury" },
  { slug: "unit", name: "Unit" },
  { slug: "tiller", name: "Tiller" },
  { slug: "lili", name: "Lili" },
  // HR / Workforce
  { slug: "remote", name: "Remote" },
  { slug: "oyster", name: "Oyster HR" },
  { slug: "rippling", name: "Rippling (Lever)" },
  { slug: "humaans", name: "Humaans" },
  // Real estate / PropTech
  { slug: "flyhomes", name: "Flyhomes" },
  { slug: "arrived", name: "Arrived" },
  // Healthcare
  { slug: "wheel", name: "Wheel" },
  { slug: "medallion", name: "Medallion" },
  { slug: "ribbon", name: "Ribbon Health" },
  // AI / Data tools
  { slug: "labelstudio", name: "Label Studio" },
  { slug: "weights-biases", name: "Weights & Biases" },
  { slug: "scale", name: "Scale AI (Lever)" },
  // Communication / Collaboration
  { slug: "loom", name: "Loom (Lever)" },
  { slug: "grain", name: "Grain" },
  { slug: "fellow", name: "Fellow" },
  // E-commerce
  { slug: "gorgias", name: "Gorgias" },
  { slug: "okendo", name: "Okendo" },
  { slug: "rebuy", name: "Rebuy" },
  // Verified new additions
  { slug: "palantir", name: "Palantir" },
  { slug: "olo", name: "Olo" },
  { slug: "minted", name: "Minted" },
  { slug: "instrument", name: "Instrument" },
  { slug: "levelai", name: "Level AI" },
  { slug: "xsolla", name: "Xsolla" },
  { slug: "netomi", name: "Netomi" },
  { slug: "dlocal", name: "dLocal" },
  { slug: "remofirst", name: "RemoFirst" },
  { slug: "sonatype", name: "Sonatype" },
];

const UX_PATTERNS = [
  /\bux\b/i, /\bui\b/i, /\buser experience\b/i, /\bproduct designer\b/i,
  /\binteraction designer\b/i, /\bexperience designer\b/i, /\bdesign systems\b/i,
  /\bdesign lead\b/i, /\bux engineer\b/i, /\bdesign technologist\b/i,
  /\bcontent designer\b/i, /\bproduct design\b/i, /\bvisual designer\b/i,
];

interface LeverJob {
  id: string;
  text: string; // title
  hostedUrl: string;
  categories: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
  };
  descriptionPlain?: string;
  createdAt: number; // unix ms
}

export const leverSource: JobSource = {
  name: "lever",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    for (const company of COMPANIES) {
      try {
        const res = await fetch(
          `https://api.lever.co/v0/postings/${company.slug}?mode=json`
        );
        if (!res.ok) continue;

        const jobs: LeverJob[] = await res.json();
        if (!Array.isArray(jobs)) continue;

        for (const job of jobs) {
          const isUXRole = UX_PATTERNS.some((re) => re.test(job.text));
          if (!isUXRole) continue;

          const location = job.categories?.location ?? "";
          const isRemote =
            location.toLowerCase().includes("remote") ||
            location.toLowerCase().includes("anywhere") ||
            location === "";

          const listing: JobListing = {
            id: "",
            source: "lever",
            title: job.text,
            company: company.name,
            location: location || "Remote",
            remote: isRemote,
            url: job.hostedUrl,
            postedDate: job.createdAt
              ? new Date(job.createdAt).toISOString().split("T")[0]
              : undefined,
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
        console.error(`Lever fetch error for ${company.name}:`, err);
      }
    }

    return results;
  },
};
