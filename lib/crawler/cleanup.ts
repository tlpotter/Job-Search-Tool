import { supabase } from "../supabase";

/**
 * Delete unactioned listings older than `maxAgeDays`.
 *
 * "Unactioned" means there is no row in user_actions for the listing,
 * which preserves anything the user has touched (saved, applied,
 * interviewing, etc.) regardless of age.
 */
export async function cleanupOldListings(maxAgeDays: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  console.log(`Cleanup: deleting unactioned listings with first_seen < ${cutoffStr}`);

  // Collect listing IDs the user has touched — these are preserved.
  const { data: actioned, error: actionedErr } = await supabase
    .from("user_actions")
    .select("listing_id");

  if (actionedErr) {
    console.error("Cleanup: failed to read user_actions:", actionedErr.message);
    return 0;
  }

  const preserved = new Set((actioned ?? []).map((r) => r.listing_id));

  // Find candidates: old listings
  const { data: candidates, error: candErr } = await supabase
    .from("listings")
    .select("id")
    .lt("first_seen", cutoffStr);

  if (candErr) {
    console.error("Cleanup: failed to read candidates:", candErr.message);
    return 0;
  }

  const toDelete = (candidates ?? [])
    .map((r) => r.id)
    .filter((id) => !preserved.has(id));

  if (toDelete.length === 0) {
    console.log("Cleanup: nothing to delete");
    return 0;
  }

  // Delete in chunks to keep the request size reasonable
  const CHUNK = 500;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += CHUNK) {
    const chunk = toDelete.slice(i, i + CHUNK);
    const { error: delErr, count } = await supabase
      .from("listings")
      .delete({ count: "exact" })
      .in("id", chunk);
    if (delErr) {
      console.error("Cleanup: delete failed:", delErr.message);
      break;
    }
    deleted += count ?? chunk.length;
  }

  console.log(`Cleanup: deleted ${deleted} stale unactioned listings`);
  return deleted;
}
