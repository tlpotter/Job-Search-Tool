/**
 * One-time bootstrap: seed lib/crawler/sources/data/*.json with the
 * hardcoded company arrays previously in ashby.ts, greenhouse.ts,
 * lever.ts. After this runs, sync-company-lists.ts merges in upstream.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "lib", "crawler", "sources", "data");

interface Entry {
  slug: string;
  name: string;
}

function save(file: string, data: Entry[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const sorted = [...data].sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(
    path.join(DATA_DIR, file),
    JSON.stringify(sorted, null, 2) + "\n",
    "utf-8"
  );
  console.log(`Wrote ${file}: ${sorted.length} entries`);
}

// === Ashby ===
const ashby: Entry[] = [
  { slug: "openai", name: "OpenAI" },
  { slug: "cohere", name: "Cohere" },
  { slug: "elevenlabs", name: "ElevenLabs" },
  { slug: "character", name: "Character.AI" },
  { slug: "perplexity", name: "Perplexity" },
  { slug: "mosaic", name: "MosaicML" },
  { slug: "ramp", name: "Ramp" },
  { slug: "deel", name: "Deel" },
  { slug: "acorns", name: "Acorns" },
  { slug: "notion", name: "Notion" },
  { slug: "linear", name: "Linear" },
  { slug: "mural", name: "MURAL" },
  { slug: "n8n", name: "n8n" },
  { slug: "sanity", name: "Sanity" },
  { slug: "ashby", name: "Ashby" },
  { slug: "zapier", name: "Zapier" },
  { slug: "posthog", name: "PostHog" },
  { slug: "supabase", name: "Supabase" },
  { slug: "railway", name: "Railway" },
  { slug: "inngest", name: "Inngest" },
  { slug: "resend", name: "Resend" },
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
  { slug: "mercury", name: "Mercury (Ashby)" },
  { slug: "baseten", name: "Baseten" },
];

// === Greenhouse ===
const greenhouse: Entry[] = [
  { slug: "figma", name: "Figma" }, { slug: "descript", name: "Descript" },
  { slug: "smartsheet", name: "Smartsheet" }, { slug: "webflow", name: "Webflow" },
  { slug: "squarespace", name: "Squarespace" }, { slug: "airtable", name: "Airtable" },
  { slug: "wrike", name: "Wrike" }, { slug: "postman", name: "Postman" },
  { slug: "airbnb", name: "Airbnb" }, { slug: "lyft", name: "Lyft" },
  { slug: "pinterest", name: "Pinterest" }, { slug: "reddit", name: "Reddit" },
  { slug: "discord", name: "Discord" }, { slug: "twitch", name: "Twitch" },
  { slug: "duolingo", name: "Duolingo" }, { slug: "peloton", name: "Peloton" },
  { slug: "instacart", name: "Instacart" }, { slug: "oura", name: "Oura" },
  { slug: "classpass", name: "ClassPass" }, { slug: "skyscanner", name: "Skyscanner" },
  { slug: "opendoor", name: "Opendoor" }, { slug: "orchard", name: "Orchard" },
  { slug: "mindbody", name: "Mindbody" }, { slug: "stripe", name: "Stripe" },
  { slug: "coinbase", name: "Coinbase" }, { slug: "brex", name: "Brex" },
  { slug: "robinhood", name: "Robinhood" }, { slug: "carta", name: "Carta" },
  { slug: "chime", name: "Chime" }, { slug: "mercury", name: "Mercury" },
  { slug: "sofi", name: "SoFi" }, { slug: "affirm", name: "Affirm" },
  { slug: "adyen", name: "Adyen" }, { slug: "gemini", name: "Gemini" },
  { slug: "marqeta", name: "Marqeta" }, { slug: "betterment", name: "Betterment" },
  { slug: "justworks", name: "Justworks" }, { slug: "klaviyo", name: "Klaviyo" },
  { slug: "mixpanel", name: "Mixpanel" }, { slug: "amplitude", name: "Amplitude" },
  { slug: "pendo", name: "Pendo" }, { slug: "hightouch", name: "Hightouch" },
  { slug: "launchdarkly", name: "LaunchDarkly" }, { slug: "iterable", name: "Iterable" },
  { slug: "braze", name: "Braze" }, { slug: "yotpo", name: "Yotpo" },
  { slug: "brandwatch", name: "Brandwatch" }, { slug: "cloudflare", name: "Cloudflare" },
  { slug: "fastly", name: "Fastly" }, { slug: "datadog", name: "Datadog" },
  { slug: "elastic", name: "Elastic" }, { slug: "mongodb", name: "MongoDB" },
  { slug: "databricks", name: "Databricks" }, { slug: "okta", name: "Okta" },
  { slug: "vercel", name: "Vercel" }, { slug: "netlify", name: "Netlify" },
  { slug: "planetscale", name: "PlanetScale" }, { slug: "fivetran", name: "Fivetran" },
  { slug: "newrelic", name: "New Relic" }, { slug: "sumologic", name: "Sumo Logic" },
  { slug: "pingidentity", name: "Ping Identity" }, { slug: "jetbrains", name: "JetBrains" },
  { slug: "veracode", name: "Veracode" }, { slug: "asana", name: "Asana" },
  { slug: "intercom", name: "Intercom" }, { slug: "lattice", name: "Lattice" },
  { slug: "qualtrics", name: "Qualtrics" }, { slug: "contentful", name: "Contentful" },
  { slug: "contentstack", name: "Contentstack" }, { slug: "lokalise", name: "Lokalise" },
  { slug: "pandadoc", name: "PandaDoc" }, { slug: "storyblok", name: "Storyblok" },
  { slug: "zuora", name: "Zuora" }, { slug: "onetrust", name: "OneTrust" },
  { slug: "vonage", name: "Vonage" }, { slug: "affinity", name: "Affinity" },
  { slug: "cultureamp", name: "Culture Amp" }, { slug: "gusto", name: "Gusto" },
  { slug: "anthropic", name: "Anthropic" }, { slug: "gitlab", name: "GitLab" },
  { slug: "twilio", name: "Twilio" }, { slug: "dropbox", name: "Dropbox" },
  { slug: "samsara", name: "Samsara" }, { slug: "pagerduty", name: "PagerDuty" },
  { slug: "flexport", name: "Flexport" }, { slug: "project44", name: "Project44" },
  { slug: "fourkites", name: "FourKites" }, { slug: "scaleai", name: "Scale AI" },
  { slug: "labelbox", name: "Labelbox" }, { slug: "heygen", name: "HeyGen" },
  { slug: "otter", name: "Otter.ai" }, { slug: "riotgames", name: "Riot Games" },
  { slug: "epicgames", name: "Epic Games" }, { slug: "2k", name: "2K Games" },
  { slug: "oscar", name: "Oscar Health" }, { slug: "natera", name: "Natera" },
  { slug: "waymo", name: "Waymo" }, { slug: "toast", name: "Toast" },
  { slug: "udemy", name: "Udemy" }, { slug: "ghost", name: "Ghost" },
  { slug: "medium", name: "Medium" }, { slug: "miro", name: "Miro" },
  { slug: "loom", name: "Loom" }, { slug: "monday", name: "Monday.com" },
  { slug: "coda", name: "Coda" }, { slug: "craft", name: "Craft" },
  { slug: "atlassian", name: "Atlassian" }, { slug: "canva", name: "Canva" },
  { slug: "invision", name: "InVision" }, { slug: "zeplin", name: "Zeplin" },
  { slug: "abstract", name: "Abstract" }, { slug: "doordash", name: "DoorDash" },
  { slug: "calm", name: "Calm" }, { slug: "headspace", name: "Headspace" },
  { slug: "noom", name: "Noom" }, { slug: "bumble", name: "Bumble" },
  { slug: "hims", name: "Hims & Hers" }, { slug: "etsy", name: "Etsy" },
  { slug: "wayfair", name: "Wayfair" }, { slug: "poshmark", name: "Poshmark" },
  { slug: "faire", name: "Faire" }, { slug: "attentive", name: "Attentive" },
  { slug: "zillow", name: "Zillow" }, { slug: "redfin", name: "Redfin" },
  { slug: "compass", name: "Compass" }, { slug: "homesnap", name: "Homeward" },
  { slug: "rippling", name: "Rippling" }, { slug: "workday", name: "Workday" },
  { slug: "bamboohr", name: "BambooHR" }, { slug: "lever", name: "Lever" },
  { slug: "greenhouse", name: "Greenhouse" }, { slug: "coursera", name: "Coursera" },
  { slug: "khanacademy", name: "Khan Academy" }, { slug: "chegg", name: "Chegg" },
  { slug: "brainly", name: "Brainly" }, { slug: "auth0", name: "Auth0" },
  { slug: "crowdstrike", name: "CrowdStrike" }, { slug: "sentinelone", name: "SentinelOne" },
  { slug: "lacework", name: "Lacework" }, { slug: "orca", name: "Orca Security" },
  { slug: "hashicorp", name: "HashiCorp" }, { slug: "confluent", name: "Confluent" },
  { slug: "snowflake", name: "Snowflake" }, { slug: "cockroachdb", name: "CockroachDB" },
  { slug: "temporal", name: "Temporal" }, { slug: "grafana", name: "Grafana Labs" },
  { slug: "gong", name: "Gong" }, { slug: "outreach", name: "Outreach" },
  { slug: "salesloft", name: "Salesloft" }, { slug: "clari", name: "Clari" },
  { slug: "chorus", name: "Chorus" }, { slug: "zendesk", name: "Zendesk" },
  { slug: "freshworks", name: "Freshworks" }, { slug: "kustomer", name: "Kustomer" },
  { slug: "zoom", name: "Zoom" }, { slug: "box", name: "Box" },
  { slug: "hubspot", name: "HubSpot" }, { slug: "grammarly", name: "Grammarly" },
  { slug: "runway", name: "Runway" }, { slug: "glean", name: "Glean" },
  { slug: "writer", name: "Writer" }, { slug: "adept", name: "Adept" },
  { slug: "shipbob", name: "ShipBob" }, { slug: "route", name: "Route" },
  { slug: "lemonade", name: "Lemonade" }, { slug: "hippo", name: "Hippo" },
  { slug: "carvana", name: "Carvana" }, { slug: "godaddy", name: "GoDaddy" },
  { slug: "axon", name: "Axon" }, { slug: "cognite", name: "Cognite" },
  { slug: "karbon", name: "Karbon" }, { slug: "phdata", name: "phData" },
  { slug: "offerpad", name: "Offerpad" }, { slug: "paypal", name: "PayPal" },
  { slug: "starburstdata", name: "Starburst" }, { slug: "veritasglobal", name: "Veritas" },
  { slug: "thumbtack", name: "Thumbtack" }, { slug: "honeybook", name: "HoneyBook" },
  { slug: "gofundme", name: "GoFundMe" }, { slug: "similarweb", name: "Similarweb" },
  { slug: "commercetools", name: "Commercetools" }, { slug: "celonis", name: "Celonis" },
  { slug: "upstart", name: "Upstart" }, { slug: "angi", name: "Angi" },
  { slug: "hellofresh", name: "HelloFresh" }, { slug: "block", name: "Block" },
  { slug: "hackerrank", name: "HackerRank" }, { slug: "appliedintuition", name: "Applied Intuition" },
  { slug: "remote", name: "Remote.com" }, { slug: "lucidmotors", name: "Lucid Motors" },
  { slug: "axios", name: "Axios" },
];

// === Lever ===
const lever: Entry[] = [
  { slug: "plaid", name: "Plaid" }, { slug: "neon", name: "Neon" },
  { slug: "wealthfront", name: "Wealthfront" }, { slug: "activecampaign", name: "ActiveCampaign" },
  { slug: "omnisend", name: "Omnisend" }, { slug: "contentsquare", name: "Contentsquare" },
  { slug: "quantcast", name: "Quantcast" }, { slug: "logrocket", name: "LogRocket" },
  { slug: "pipedrive", name: "Pipedrive" }, { slug: "jumpcloud", name: "JumpCloud" },
  { slug: "walkme", name: "WalkMe" }, { slug: "15five", name: "15Five" },
  { slug: "prismic", name: "Prismic" }, { slug: "ro", name: "Ro" },
  { slug: "filevine", name: "Filevine" }, { slug: "trustarc", name: "TrustArc" },
  { slug: "spotify", name: "Spotify" }, { slug: "glide", name: "Glide" },
  { slug: "thunkable", name: "Thunkable" }, { slug: "mendix", name: "Mendix" },
  { slug: "retool", name: "Retool" }, { slug: "replit", name: "Replit" },
  { slug: "hex", name: "Hex" }, { slug: "dbtlabs", name: "dbt Labs" },
  { slug: "prefect", name: "Prefect" }, { slug: "airbyte", name: "Airbyte" },
  { slug: "metabase", name: "Metabase" }, { slug: "thoughtspot", name: "ThoughtSpot" },
  { slug: "mode", name: "Mode Analytics" }, { slug: "figma", name: "Figma (Lever)" },
  { slug: "marvel", name: "Marvel" }, { slug: "front", name: "Front" },
  { slug: "gladly", name: "Gladly" }, { slug: "helpscout", name: "Help Scout" },
  { slug: "dixa", name: "Dixa" }, { slug: "modern-treasury", name: "Modern Treasury" },
  { slug: "unit", name: "Unit" }, { slug: "tiller", name: "Tiller" },
  { slug: "lili", name: "Lili" }, { slug: "remote", name: "Remote" },
  { slug: "oyster", name: "Oyster HR" }, { slug: "rippling", name: "Rippling (Lever)" },
  { slug: "humaans", name: "Humaans" }, { slug: "flyhomes", name: "Flyhomes" },
  { slug: "arrived", name: "Arrived" }, { slug: "wheel", name: "Wheel" },
  { slug: "medallion", name: "Medallion" }, { slug: "ribbon", name: "Ribbon Health" },
  { slug: "labelstudio", name: "Label Studio" }, { slug: "weights-biases", name: "Weights & Biases" },
  { slug: "scale", name: "Scale AI (Lever)" }, { slug: "loom", name: "Loom (Lever)" },
  { slug: "grain", name: "Grain" }, { slug: "fellow", name: "Fellow" },
  { slug: "gorgias", name: "Gorgias" }, { slug: "okendo", name: "Okendo" },
  { slug: "rebuy", name: "Rebuy" }, { slug: "keap", name: "Keap" },
  { slug: "insightdirect", name: "Insight" }, { slug: "weave", name: "Weave" },
  { slug: "varos", name: "Varos" }, { slug: "palantir", name: "Palantir" },
  { slug: "olo", name: "Olo" }, { slug: "minted", name: "Minted" },
  { slug: "instrument", name: "Instrument" }, { slug: "levelai", name: "Level AI" },
  { slug: "xsolla", name: "Xsolla" }, { slug: "netomi", name: "Netomi" },
  { slug: "dlocal", name: "dLocal" }, { slug: "remofirst", name: "RemoFirst" },
  { slug: "sonatype", name: "Sonatype" },
];

save("ashby_companies.json", ashby);
save("greenhouse_companies.json", greenhouse);
save("lever_companies.json", lever);
// BambooHR, iCIMS, Workday start empty — populated by sync from upstream
save("bamboohr_companies.json", []);
save("icims_companies.json", []);
fs.writeFileSync(
  path.join(DATA_DIR, "workday_companies.json"),
  "[]\n",
  "utf-8"
);
console.log("Wrote bamboohr_companies.json, icims_companies.json, workday_companies.json (empty)");
console.log("\nNext: run `npx tsx scripts/sync-company-lists.ts` to merge upstream data");
