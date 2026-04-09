export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { TrackerBoard, TrackerItem } from "@/components/tracker-board";

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
      <div className="navbar bg-base-100 border-b border-base-300 px-6 shrink-0">
        <div className="navbar-start">
          <span className="text-base font-semibold">UX Job Crawler</span>
          <span className="mx-3 text-base-content/20">·</span>
          <span className="text-sm text-base-content/50">Application Tracker</span>
        </div>
        <div className="navbar-end gap-2">
          <Link href="/" className="btn btn-ghost btn-sm text-base-content/60">Feed</Link>
          <Link href="/tracker" className="btn btn-ghost btn-sm font-medium">Tracker</Link>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <TrackerBoard initialItems={items} />
      </div>
    </div>
  );
}
