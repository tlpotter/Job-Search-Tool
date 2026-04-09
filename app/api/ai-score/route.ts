import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { aiRankListing } from "@/lib/crawler/ai-rank";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
  const { listingId } = await request.json();
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const { data: job, error: fetchError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (fetchError || !job) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  const profilePath = path.join(process.cwd(), "lib", "profile.md");
  const profile = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, "utf-8") : "";

  // Map DB row to the shape aiRankListing expects
  const listing = {
    id: job.id,
    title: job.title,
    company: job.company,
    description: job.description,
    salary: job.salary,
    estimatedSalary: job.estimated_salary,
    companyRating: job.company_rating,
    companyWorkLifeBalance: job.company_wlb,
    companyGrowthTrend: job.company_growth_trend,
    companyHeadcount: job.company_headcount,
    companyRedFlags: job.company_red_flags,
    companyReputationAvailable: job.company_reputation_available,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await aiRankListing(listing as any, profile);

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        ai_fit_score: result.fitScore,
        ai_fit_summary: result.summary,
        ai_skill_gaps: result.gaps,
        ai_highlights: result.highlights,
      })
      .eq("id", listingId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      fitScore: result.fitScore,
      summary: result.summary,
      gaps: result.gaps,
      highlights: result.highlights,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI scoring failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
