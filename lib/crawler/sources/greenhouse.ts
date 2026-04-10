import { JobListing, JobSource } from "../types";
import { SearchConfig } from "../../config";
import { generateId } from "../dedup";
import { cleanDescription } from "../../utils/clean-description";

// Companies confirmed on Greenhouse with public job boards
const COMPANIES: { slug: string; name: string }[] = [
  // Design/Product tools
  { slug: "figma", name: "Figma" },
  { slug: "descript", name: "Descript" },
  { slug: "smartsheet", name: "Smartsheet" },
  { slug: "webflow", name: "Webflow" },
  { slug: "squarespace", name: "Squarespace" },
  { slug: "airtable", name: "Airtable" },
  { slug: "wrike", name: "Wrike" },
  { slug: "postman", name: "Postman" },
  // Consumer / Social
  { slug: "airbnb", name: "Airbnb" },
  { slug: "lyft", name: "Lyft" },
  { slug: "pinterest", name: "Pinterest" },
  { slug: "reddit", name: "Reddit" },
  { slug: "discord", name: "Discord" },
  { slug: "twitch", name: "Twitch" },
  { slug: "duolingo", name: "Duolingo" },
  { slug: "peloton", name: "Peloton" },
  { slug: "instacart", name: "Instacart" },
  { slug: "oura", name: "Oura" },
  { slug: "classpass", name: "ClassPass" },
  { slug: "skyscanner", name: "Skyscanner" },
  { slug: "opendoor", name: "Opendoor" },
  { slug: "orchard", name: "Orchard" },
  { slug: "mindbody", name: "Mindbody" },
  // Fintech
  { slug: "stripe", name: "Stripe" },
  { slug: "coinbase", name: "Coinbase" },
  { slug: "brex", name: "Brex" },
  { slug: "robinhood", name: "Robinhood" },
  { slug: "carta", name: "Carta" },
  { slug: "chime", name: "Chime" },
  { slug: "mercury", name: "Mercury" },
  { slug: "sofi", name: "SoFi" },
  { slug: "affirm", name: "Affirm" },
  { slug: "adyen", name: "Adyen" },
  { slug: "gemini", name: "Gemini" },
  { slug: "marqeta", name: "Marqeta" },
  { slug: "betterment", name: "Betterment" },
  { slug: "justworks", name: "Justworks" },
  // Marketing / Growth
  { slug: "klaviyo", name: "Klaviyo" },
  { slug: "mixpanel", name: "Mixpanel" },
  { slug: "amplitude", name: "Amplitude" },
  { slug: "pendo", name: "Pendo" },
  { slug: "hightouch", name: "Hightouch" },
  { slug: "launchdarkly", name: "LaunchDarkly" },
  { slug: "iterable", name: "Iterable" },
  { slug: "braze", name: "Braze" },
  { slug: "yotpo", name: "Yotpo" },
  { slug: "brandwatch", name: "Brandwatch" },
  // Infrastructure / Dev tools
  { slug: "cloudflare", name: "Cloudflare" },
  { slug: "fastly", name: "Fastly" },
  { slug: "datadog", name: "Datadog" },
  { slug: "elastic", name: "Elastic" },
  { slug: "mongodb", name: "MongoDB" },
  { slug: "databricks", name: "Databricks" },
  { slug: "okta", name: "Okta" },
  { slug: "vercel", name: "Vercel" },
  { slug: "netlify", name: "Netlify" },
  { slug: "planetscale", name: "PlanetScale" },
  { slug: "fivetran", name: "Fivetran" },
  { slug: "newrelic", name: "New Relic" },
  { slug: "sumologic", name: "Sumo Logic" },
  { slug: "pingidentity", name: "Ping Identity" },
  { slug: "jetbrains", name: "JetBrains" },
  { slug: "veracode", name: "Veracode" },
  // Enterprise SaaS
  { slug: "asana", name: "Asana" },
  { slug: "intercom", name: "Intercom" },
  { slug: "lattice", name: "Lattice" },
  { slug: "qualtrics", name: "Qualtrics" },
  { slug: "contentful", name: "Contentful" },
  { slug: "contentstack", name: "Contentstack" },
  { slug: "lokalise", name: "Lokalise" },
  { slug: "pandadoc", name: "PandaDoc" },
  { slug: "storyblok", name: "Storyblok" },
  { slug: "zuora", name: "Zuora" },
  { slug: "onetrust", name: "OneTrust" },
  { slug: "vonage", name: "Vonage" },
  { slug: "affinity", name: "Affinity" },
  { slug: "cultureamp", name: "Culture Amp" },
  { slug: "gusto", name: "Gusto" },
  // Platform / Communication
  { slug: "anthropic", name: "Anthropic" },
  { slug: "gitlab", name: "GitLab" },
  { slug: "twilio", name: "Twilio" },
  { slug: "dropbox", name: "Dropbox" },
  { slug: "samsara", name: "Samsara" },
  { slug: "pagerduty", name: "PagerDuty" },
  // Logistics / Operations
  { slug: "flexport", name: "Flexport" },
  { slug: "project44", name: "Project44" },
  { slug: "fourkites", name: "FourKites" },
  // AI / Data
  { slug: "scaleai", name: "Scale AI" },
  { slug: "labelbox", name: "Labelbox" },
  { slug: "heygen", name: "HeyGen" },
  { slug: "otter", name: "Otter.ai" },
  // Gaming
  { slug: "riotgames", name: "Riot Games" },
  { slug: "epicgames", name: "Epic Games" },
  { slug: "2k", name: "2K Games" },
  // Health
  { slug: "oscar", name: "Oscar Health" },
  { slug: "natera", name: "Natera" },
  // Travel / Real Estate
  { slug: "waymo", name: "Waymo" },
  { slug: "toast", name: "Toast" },
  // Edtech
  { slug: "udemy", name: "Udemy" },
  // Media / Publishing
  { slug: "ghost", name: "Ghost" },
  { slug: "medium", name: "Medium" },
  // Productivity / Collaboration
  { slug: "miro", name: "Miro" },
  { slug: "loom", name: "Loom" },
  { slug: "monday", name: "Monday.com" },
  { slug: "coda", name: "Coda" },
  { slug: "craft", name: "Craft" },
  { slug: "atlassian", name: "Atlassian" },
  // Design tools
  { slug: "canva", name: "Canva" },
  { slug: "invision", name: "InVision" },
  { slug: "zeplin", name: "Zeplin" },
  { slug: "abstract", name: "Abstract" },
  // Consumer / Lifestyle
  { slug: "doordash", name: "DoorDash" },
  { slug: "calm", name: "Calm" },
  { slug: "headspace", name: "Headspace" },
  { slug: "noom", name: "Noom" },
  { slug: "bumble", name: "Bumble" },
  { slug: "hims", name: "Hims & Hers" },
  { slug: "classpass", name: "ClassPass" },
  // E-commerce / Retail
  { slug: "etsy", name: "Etsy" },
  { slug: "wayfair", name: "Wayfair" },
  { slug: "poshmark", name: "Poshmark" },
  { slug: "faire", name: "Faire" },
  { slug: "attentive", name: "Attentive" },
  // Real estate
  { slug: "zillow", name: "Zillow" },
  { slug: "redfin", name: "Redfin" },
  { slug: "compass", name: "Compass" },
  { slug: "homesnap", name: "Homeward" },
  // HR / People
  { slug: "rippling", name: "Rippling" },
  { slug: "workday", name: "Workday" },
  { slug: "bamboohr", name: "BambooHR" },
  { slug: "lever", name: "Lever" },
  { slug: "greenhouse", name: "Greenhouse" },
  // Education
  { slug: "coursera", name: "Coursera" },
  { slug: "khanacademy", name: "Khan Academy" },
  { slug: "chegg", name: "Chegg" },
  { slug: "brainly", name: "Brainly" },
  // Security / Identity
  { slug: "auth0", name: "Auth0" },
  { slug: "crowdstrike", name: "CrowdStrike" },
  { slug: "sentinelone", name: "SentinelOne" },
  { slug: "lacework", name: "Lacework" },
  { slug: "orca", name: "Orca Security" },
  // Cloud / Infrastructure
  { slug: "hashicorp", name: "HashiCorp" },
  { slug: "confluent", name: "Confluent" },
  { slug: "snowflake", name: "Snowflake" },
  { slug: "cockroachdb", name: "CockroachDB" },
  { slug: "temporal", name: "Temporal" },
  { slug: "grafana", name: "Grafana Labs" },
  // Sales / CRM
  { slug: "gong", name: "Gong" },
  { slug: "outreach", name: "Outreach" },
  { slug: "salesloft", name: "Salesloft" },
  { slug: "clari", name: "Clari" },
  { slug: "chorus", name: "Chorus" },
  // Customer Success / Support
  { slug: "zendesk", name: "Zendesk" },
  { slug: "freshworks", name: "Freshworks" },
  { slug: "kustomer", name: "Kustomer" },
  // Communication
  { slug: "zoom", name: "Zoom" },
  { slug: "box", name: "Box" },
  { slug: "hubspot", name: "HubSpot" },
  { slug: "grammarly", name: "Grammarly" },
  // Additional AI / ML
  { slug: "runway", name: "Runway" },
  { slug: "glean", name: "Glean" },
  { slug: "writer", name: "Writer" },
  { slug: "adept", name: "Adept" },
  // Logistics / Delivery
  { slug: "shipbob", name: "ShipBob" },
  { slug: "route", name: "Route" },
  // Insurance / Legal
  { slug: "lemonade", name: "Lemonade" },
  { slug: "hippo", name: "Hippo" },
  // Phoenix metro companies
  { slug: "carvana", name: "Carvana" },
  { slug: "godaddy", name: "GoDaddy" },
  { slug: "axon", name: "Axon" },
  { slug: "cognite", name: "Cognite" },
  { slug: "karbon", name: "Karbon" },
  { slug: "phdata", name: "phData" },
  { slug: "offerpad", name: "Offerpad" },
  { slug: "paypal", name: "PayPal" },
  { slug: "starburstdata", name: "Starburst" },
  { slug: "veritasglobal", name: "Veritas" },
  // Verified new additions
  { slug: "thumbtack", name: "Thumbtack" },
  { slug: "honeybook", name: "HoneyBook" },
  { slug: "gofundme", name: "GoFundMe" },
  { slug: "similarweb", name: "Similarweb" },
  { slug: "commercetools", name: "Commercetools" },
  { slug: "celonis", name: "Celonis" },
  { slug: "upstart", name: "Upstart" },
  { slug: "angi", name: "Angi" },
  { slug: "hellofresh", name: "HelloFresh" },
  { slug: "block", name: "Block" },
  { slug: "hackerrank", name: "HackerRank" },
  { slug: "appliedintuition", name: "Applied Intuition" },
  { slug: "remote", name: "Remote.com" },
  { slug: "lucidmotors", name: "Lucid Motors" },
  { slug: "axios", name: "Axios" },
];

const UX_PATTERNS = [
  /\bux\b/i, /\bui\b/i, /\buser experience\b/i, /\bproduct designer\b/i,
  /\binteraction designer\b/i, /\bexperience designer\b/i, /\bdesign systems\b/i,
  /\bdesign lead\b/i, /\bux engineer\b/i, /\bdesign technologist\b/i,
  /\bcontent designer\b/i, /\bproduct design\b/i, /\bvisual designer\b/i,
];

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  updated_at: string;
  content?: string;
  departments?: { name: string }[];
}

export const greenhouseSource: JobSource = {
  name: "greenhouse",
  async fetch(_config: SearchConfig): Promise<JobListing[]> {
    const results: JobListing[] = [];
    const seen = new Set<string>();

    for (const company of COMPANIES) {
      try {
        const res = await fetch(
          `https://api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`
        );
        if (!res.ok) continue;

        const json = await res.json();
        const jobs: GreenhouseJob[] = json.jobs ?? [];

        for (const job of jobs) {
          const isUXRole = UX_PATTERNS.some((re) => re.test(job.title));
          if (!isUXRole) continue;

          const location = job.location?.name ?? "";
          const isRemote =
            location.toLowerCase().includes("remote") ||
            location.toLowerCase().includes("anywhere") ||
            location === "";

          const description = cleanDescription(job.content ?? "");

          const listing: JobListing = {
            id: "",
            source: "greenhouse",
            title: job.title,
            company: company.name,
            location: location || "Remote",
            remote: isRemote,
            url: job.absolute_url,
            postedDate: job.updated_at?.split("T")[0],
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
        console.error(`Greenhouse fetch error for ${company.name}:`, err);
      }
    }

    return results;
  },
};
