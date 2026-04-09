import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { listingId, status, bookmarked, notes } = body;

  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const { error } = await supabase.from("user_actions").upsert(
    {
      listing_id: listingId,
      ...(status !== undefined && { status }),
      ...(bookmarked !== undefined && { bookmarked }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status_changed_at: new Date().toISOString() }),
    },
    { onConflict: "listing_id" }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
