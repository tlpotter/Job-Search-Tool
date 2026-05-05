import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabase } from "../lib/supabase";

async function main() {
  const sb = getSupabase();
  const { data } = await sb
    .from("listings")
    .select("description")
    .not("description", "is", null)
    .limit(500);

  if (!data) return;

  const sizes = data.map((r) => (r.description ?? "").length).sort((a, b) => a - b);
  const sum = sizes.reduce((a, b) => a + b, 0);
  const avg = sum / sizes.length;
  const median = sizes[Math.floor(sizes.length / 2)];
  const p95 = sizes[Math.floor(sizes.length * 0.95)];
  const max = sizes[sizes.length - 1];

  console.log(`Samples: ${sizes.length}`);
  console.log(`Avg:    ${(avg / 1024).toFixed(1)} KB`);
  console.log(`Median: ${(median / 1024).toFixed(1)} KB`);
  console.log(`P95:    ${(p95 / 1024).toFixed(1)} KB`);
  console.log(`Max:    ${(max / 1024).toFixed(1)} KB`);
  console.log(`\nFor a 20-listing page:`);
  console.log(`  Typical payload extra: ${((median * 20) / 1024).toFixed(0)} KB`);
  console.log(`  P95 payload extra:     ${((p95 * 20) / 1024).toFixed(0)} KB`);
}

main();
