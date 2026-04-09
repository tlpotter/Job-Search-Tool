import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { getSupabase } from "../lib/supabase";
import { aiRankListing } from "../lib/crawler/ai-rank";
import { JobListing } from "../lib/crawler/types";

async function main() {
  const sb = getSupabase();
  const { data } = await sb.from("listings").select("*").gte("relevance_score", 60).limit(1).single();
  if (!data) { console.error("No listing found"); return; }

  console.log(`Testing: ${data.title} @ ${data.company}\n`);

  const profilePath = path.join(process.cwd(), "lib", "profile.md");
  const profile = fs.readFileSync(profilePath, "utf-8");

  const result = await aiRankListing(data as unknown as JobListing, profile);
  console.log("Result:", JSON.stringify(result, null, 2));
}

main();
