import { supabase } from "../supabase";

/**
 * Delete unactioned listings older than `maxAgeDays`.
 *
 * "Unactioned" means there is no row in user_actions for the listing,
 * which preserves anything the user has touched (saved, applied,
 * interviewing, etc.) regardless of age.
 *
 * Loops batches to bypass Supabase's default 1000-row select limit so
 * the cleanup actually drains backlogs larger than 1000 in a single run.
 */
export async function cleanupOldListings(maxAgeDays: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  console.log(`Cleanup: deleting unactioned listings with first_seen < ${cutoffStr}`);

  // Collect listing IDs the user has touched — these are preserved.
  // user_actions is a small table (one row per touched listing), so this
  // single-page query is sufficient in practice. If it ever grows past
  // 1000 we'd paginate here too.
  const { data: actioned, error: actionedErr } = await supabase
    .from("user_actions")
    .select("listing_id");

  if (actionedErr) {
    console.error("Cleanup: failed to read user_actions:", actionedErr.message);
    return 0;
  }

  const preservedIds = (actioned ?? []).map((r) => r.listing_id);
  const preservedSet = new Set(preservedIds);
  console.log(`Cleanup: preserving ${preservedSet.size} actioned listings`);

  // Walk batches until no more candidates. Each delete shrinks the pool
  // so the same .lt() filter naturally surfaces the next batch.
  const PAGE = 1000;
  let totalDeleted = 0;
  let consecutiveNoOp = 0;

  for (let safety = 0; safety < 200; safety++) {
    const { data: candidates, error: candErr } = await supabase
      .from("listings")
      .select("id")
      .lt("first_seen", cutoffStr)
      .order("first_seen", { ascending: true })
      .limit(PAGE);

    if (candErr) {
      console.error("Cleanup: candidate read failed:", candErr.message);
      break;
    }
    if (!candidates || candidates.length === 0) break;

    const toDelete = candidates.map((r) => r.id).filter((id) => !preservedSet.has(id));

    if (toDelete.length === 0) {
      // This page was entirely actioned (rare). Stop — the rest may all be
      // preserved too, and we can't advance the cursor without more state.
      consecutiveNoOp++;
      if (consecutiveNoOp >= 2) break;
      continue;
    }

    // Delete this batch in chunks of 500 (safe URL-length window for IN clauses)
    const CHUNK = 500;
    for (let i = 0; i < toDelete.length; i += CHUNK) {
      const chunk = toDelete.slice(i, i + CHUNK);
      const { error: delErr, count } = await supabase
        .from("listings")
        .delete({ count: "exact" })
        .in("id", chunk);
      if (delErr) {
        console.error("Cleanup: delete failed:", delErr.message);
        console.log(`Cleanup: deleted ${totalDeleted} before failure`);
        return totalDeleted;
      }
      totalDeleted += count ?? chunk.length;
    }

    consecutiveNoOp = 0;
    if (candidates.length < PAGE) break;
  }

  console.log(`Cleanup: deleted ${totalDeleted} stale unactioned listings`);
  return totalDeleted;
}
