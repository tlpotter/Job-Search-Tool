import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const minScore = parseInt(searchParams.get("minScore") ?? "0");
  const maxScore = parseInt(searchParams.get("maxScore") ?? "200");
  const minAiScore = searchParams.get("minAiScore") ? parseInt(searchParams.get("minAiScore")!) : null;
  const remote = searchParams.get("remote");
  const hasEquity = searchParams.get("hasEquity");
  const hasBenefits = searchParams.get("hasBenefits");
  const hasSalary = searchParams.get("hasSalary");
  const mentionsDesignSystems = searchParams.get("designSystems");
  const mentionsAI = searchParams.get("mentionsAI");
  const isAgency = searchParams.get("agency");
  const companySize = searchParams.get("companySize");
  const source = searchParams.get("source");
  const roleType = searchParams.get("roleType");
  const aiScoredOnly = searchParams.get("aiScoredOnly");
  const goodReputationOnly = searchParams.get("goodReputation");
  const postedWithin = searchParams.get("postedWithin") ? parseInt(searchParams.get("postedWithin")!) : null;
  const sortBy = searchParams.get("sortBy") ?? "relevance_score";
  const offset = parseInt(searchParams.get("offset") ?? "0");

  // Exclude description — only needed on detail page, too large for feed
  const SELECT_FIELDS = `
    id, title, company, location, remote, url,
    salary, estimated_salary, salary_source, salary_below_floor,
    posted_date, relevance_score, ai_fit_score, ai_fit_summary, ai_description_summary,
    source, role_type, company_size, has_equity, has_benefits_info,
    mentions_design_systems, mentions_ai, is_agency,
    company_rating, company_red_flags, company_growth_trend, company_reputation_available,
    user_actions (status, bookmarked, notes)
  `;

  let query = supabase
    .from("listings")
    .select(SELECT_FIELDS, { count: "exact" })
    .gte("relevance_score", minScore)
    .lte("relevance_score", maxScore)
    .range(offset, offset + PAGE_SIZE - 1);

  if (remote === "true") query = query.eq("remote", true);
  if (hasEquity === "true") query = query.eq("has_equity", true);
  if (hasBenefits === "true") query = query.eq("has_benefits_info", true);
  if (hasSalary === "true") query = query.eq("has_salary_info", true);
  if (mentionsDesignSystems === "true") query = query.eq("mentions_design_systems", true);
  if (mentionsAI === "true") query = query.eq("mentions_ai", true);
  if (isAgency === "false") query = query.eq("is_agency", false);
  if (companySize) query = query.eq("company_size", companySize);
  if (source) query = query.eq("source", source);
  if (roleType) query = query.eq("role_type", roleType);
  if (aiScoredOnly === "true") query = query.not("ai_fit_score", "is", null);
  if (minAiScore !== null) query = query.gte("ai_fit_score", minAiScore);
  if (goodReputationOnly === "true") {
    query = query.eq("company_reputation_available", true).gte("company_rating", 4.0);
  }
  if (postedWithin !== null) {
    const since = new Date();
    since.setDate(since.getDate() - postedWithin);
    query = query.gte("posted_date", since.toISOString().split("T")[0]);
  }

  if (sortBy === "ai_fit_score") {
    query = query.order("ai_fit_score", { ascending: false, nullsFirst: false });
  } else if (sortBy === "posted_date") {
    query = query.order("posted_date", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("relevance_score", { ascending: false });
  }

  const [{ data, count, error }, { count: dbTotal }] = await Promise.all([
    query,
    supabase.from("listings").select("*", { count: "exact", head: true }),
  ]);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: data ?? [], total: count ?? 0, dbTotal: dbTotal ?? 0, offset, pageSize: PAGE_SIZE });
}
