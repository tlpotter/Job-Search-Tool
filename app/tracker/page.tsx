export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { TrackerBoard, TrackerItem } from "@/components/tracker-board";
import { AppHeader } from "@/components/app-header";

export default async function TrackerPage() {
  const { data: actions } = await supabase
    .from("user_actions")
    .select(`
      listing_id,
      status,
      status_changed_at,
      listings (id, title, company, relevance_score, ai_fit_score, url)
    `)
    .in("status", ["save_for_later", "applied", "interviewing", "offer", "not_interested"])
    .order("status_changed_at", { ascending: false });

  const items: TrackerItem[] = (actions ?? []).flatMap((a) => {
    const rawListings = a.listings;
    const listing = Array.isArray(rawListings)
      ? (rawListings[0] as TrackerItem["listing"] | undefined) ?? null
      : rawListings as TrackerItem["listing"] | null;
    if (!listing) return [];
    return [{ listing_id: a.listing_id, status: a.status, status_changed_at: a.status_changed_at, listing }];
  });

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <AppHeader />
      <div className="flex-1 px-6 py-6">
        <TrackerBoard initialItems={items} />
      </div>
    </div>
  );
}
