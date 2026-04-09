import { config } from "dotenv";
config({ path: ".env.local" });
import { getSupabase } from "../lib/supabase";

async function main() {
  const sb = getSupabase();
  const { count: total } = await sb.from("listings").select("*", { count: "exact", head: true });
  const { count: aiScored } = await sb.from("listings").select("*", { count: "exact", head: true }).not("ai_fit_score", "is", null);
  const { count: above60 } = await sb.from("listings").select("*", { count: "exact", head: true }).gte("relevance_score", 60);
  const { count: above70 } = await sb.from("listings").select("*", { count: "exact", head: true }).gte("relevance_score", 70);
  const { count: above80 } = await sb.from("listings").select("*", { count: "exact", head: true }).gte("relevance_score", 80);
  const { count: needsScore } = await sb.from("listings").select("*", { count: "exact", head: true }).gte("relevance_score", 60).is("ai_fit_score", null);

  console.log(`Total listings:     ${total}`);
  console.log(`AI scored:          ${aiScored}`);
  console.log(`Score >= 80:        ${above80}`);
  console.log(`Score >= 70:        ${above70}`);
  console.log(`Score >= 60:        ${above60}`);
  console.log(`Needs AI scoring:   ${needsScore}`);
}

main();
