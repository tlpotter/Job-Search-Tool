/**
 * dedup-existing.ts
 * Scans all listings in the DB, finds duplicates by fuzzy key (company+title),
 * and deletes the lower-quality copy — keeping the one with AI score, or the
 * higher relevance score if neither has AI.
 *
 * Run: npx tsx scripts/dedup-existing.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function fuzzyKey(company: string, title: string): string {
  return [company, title]
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join("|");
}

async function main() {
  console.log("Fetching all listings...");

  // Paginate through all listings
  const PAGE = 1000;
  let offset = 0;
  const all: Record<string, unknown>[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, title, company, relevance_score, ai_fit_score, first_seen")
      .range(offset, offset + PAGE - 1)
      .order("id");

    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`  Loaded ${all.length} listings`);

  // Group by fuzzy key
  const groups = new Map<string, typeof all>();
  for (const row of all) {
    const key = fuzzyKey(row.company as string, row.title as string);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // Find groups with duplicates
  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  console.log(`  Found ${dupGroups.length} duplicate groups\n`);

  if (dupGroups.length === 0) {
    console.log("No duplicates found.");
    return;
  }

  const toDelete: string[] = [];

  for (const group of dupGroups) {
    // Sort: prefer AI-scored first, then higher relevance score, then newer first_seen
    group.sort((a, b) => {
      const aAI = a.ai_fit_score != null ? 1 : 0;
      const bAI = b.ai_fit_score != null ? 1 : 0;
      if (bAI !== aAI) return bAI - aAI;
      return (b.relevance_score as number ?? 0) - (a.relevance_score as number ?? 0);
    });

    const [keep, ...dupes] = group;
    console.log(`  Keep:   [${keep.id}] ${keep.company} — ${keep.title} (score:${keep.relevance_score}, ai:${keep.ai_fit_score ?? "—"})`);
    for (const dupe of dupes) {
      console.log(`  Delete: [${dupe.id}] ${dupe.company} — ${dupe.title} (score:${dupe.relevance_score}, ai:${dupe.ai_fit_score ?? "—"})`);
      toDelete.push(dupe.id as string);
    }
    console.log();
  }

  console.log(`Deleting ${toDelete.length} duplicate listings in batches...`);

  const BATCH = 200;
  let deleted = 0;

  for (let i = 0; i < toDelete.length; i += BATCH) {
    const batch = toDelete.slice(i, i + BATCH);

    // Delete user_actions first (FK constraint)
    await supabase.from("user_actions").delete().in("listing_id", batch);

    const { error: delErr } = await supabase.from("listings").delete().in("id", batch);
    if (delErr) {
      console.error(`  Batch ${i}-${i + BATCH} failed:`, delErr.message);
    } else {
      deleted += batch.length;
      process.stdout.write(`\r  ${deleted}/${toDelete.length} deleted`);
    }
  }

  console.log(`\nDone. Removed ${deleted} duplicates.`);
}

main();
