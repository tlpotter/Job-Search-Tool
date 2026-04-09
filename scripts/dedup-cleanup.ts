import { config } from "dotenv";
config({ path: ".env.local" });
import { supabase as s } from "../lib/supabase";

async function run() {
  // Fetch all listings ordered by score desc — keep highest scorer when duped
  // Fetch all listings in pages to bypass Supabase 1000-row default
  let allData: { id: string; title: string; company: string; relevance_score: number }[] = [];
  let page = 0;
  const PAGE = 1000;
  while (true) {
    const { data: pageData, error: pageError } = await s
      .from("listings")
      .select("id, title, company, relevance_score")
      .order("relevance_score", { ascending: false })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (pageError || !pageData || pageData.length === 0) break;
    allData = allData.concat(pageData);
    if (pageData.length < PAGE) break;
    page++;
  }
  const data = allData;
  const error = null;

  if (error || !data) { console.log("fetch error:", error); return; }
  console.log("Fetched:", data.length, "listings");

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const row of data) {
    const key =
      row.company.toLowerCase().replace(/[^a-z0-9]/g, "") +
      "|" +
      row.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) {
      toDelete.push(row.id);
    } else {
      seen.set(key, row.id);
    }
  }

  console.log("Duplicates found:", toDelete.length);

  if (toDelete.length === 0) { console.log("Nothing to delete."); return; }

  // Delete in batches of 100 — remove user_actions first due to FK constraint
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    await s.from("user_actions").delete().in("listing_id", batch);
    const { error: delError } = await s.from("listings").delete().in("id", batch);
    if (delError) { console.log("Delete error:", delError.message); return; }
    deleted += batch.length;
  }
  console.log("Deleted:", deleted, "duplicates");
}

run();
