import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabase } from "../lib/supabase";

async function main() {
  const sb = getSupabase();

  const { data, error } = await sb
    .from("listings")
    .select("relevance_score, ai_fit_score")
    .limit(10000);

  if (error) { console.error(error); return; }

  const total = data.length;
  const tiers = [
    { label: "Score >= 80 (elite)", min: 80 },
    { label: "Score >= 70 (top match)", min: 70 },
    { label: "Score >= 60 (strong)", min: 60 },
    { label: "Score >= 50 (good)", min: 50 },
    { label: "Score >= 40 (decent)", min: 40 },
    { label: "Score < 40 (low)", min: 0, max: 40 },
  ];

  console.log(`\nTotal listings in DB: ${total}`);
  console.log(`Already AI scored: ${data.filter(d => d.ai_fit_score != null).length}\n`);

  for (const tier of tiers) {
    const count = data.filter(d => {
      const s = d.relevance_score ?? 0;
      return s >= tier.min && (tier.max === undefined || s < tier.max);
    }).length;
    const aiScored = data.filter(d => {
      const s = d.relevance_score ?? 0;
      return s >= tier.min && (tier.max === undefined || s < tier.max) && d.ai_fit_score != null;
    }).length;
    console.log(`${tier.label}: ${count} listings (${aiScored} AI scored)`);
  }
}

main();
