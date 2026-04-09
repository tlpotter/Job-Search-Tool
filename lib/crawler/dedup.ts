import { createHash } from "crypto";
import { supabase } from "../supabase";
import { JobListing } from "./types";

export function generateId(job: Pick<JobListing, "company" | "title" | "url">): string {
  const raw = `${job.company.toLowerCase().trim()}|${job.title.toLowerCase().trim()}|${job.url.trim()}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function fuzzyKey(job: JobListing): string {
  // Normalize company + title to catch same job posted with different URLs
  const company = job.company.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const title = job.title.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  return `${company}|${title}`;
}

export async function dedup(listings: JobListing[]): Promise<JobListing[]> {
  if (listings.length === 0) return [];

  // 1. Fuzzy dedup in-memory: same company+title → keep first occurrence (usually has more data)
  const fuzzySeenLocal = new Map<string, boolean>();
  const dedupedLocally = listings.filter((l) => {
    const key = fuzzyKey(l);
    if (fuzzySeenLocal.has(key)) return false;
    fuzzySeenLocal.set(key, true);
    return true;
  });

  // 2. URL-based dedup against DB (exact id match)
  const ids = dedupedLocally.map((l) => l.id);
  const { data: existing } = await supabase
    .from("listings")
    .select("id")
    .in("id", ids);

  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id));

  // 3. Also fuzzy-check against DB titles to catch URL-variant duplicates already saved
  const titles = [...new Set(dedupedLocally.map((l) => l.title.toLowerCase().trim()))];
  const { data: existingByTitle } = await supabase
    .from("listings")
    .select("title, company")
    .in("title", titles.slice(0, 500)); // Supabase IN limit

  const existingFuzzyKeys = new Set(
    (existingByTitle ?? []).map((r: { title: string; company: string }) =>
      `${r.company.toLowerCase().replace(/[^a-z0-9]/g, "")}|${r.title.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    )
  );

  return dedupedLocally.filter(
    (l) => !existingIds.has(l.id) && !existingFuzzyKeys.has(fuzzyKey(l))
  );
}

export async function saveListings(listings: JobListing[]): Promise<void> {
  if (listings.length === 0) return;

  // Deduplicate by id in case multiple sources returned the same listing
  const seen = new Set<string>();
  const unique = listings.filter((l) => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });

  const rows = unique.map((job) => {
    const row: Record<string, unknown> = {
      id: job.id,
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.remote,
      url: job.url,
      salary: job.salary ?? null,
      posted_date: job.postedDate ?? null,
      description: job.description ?? null,
      relevance_score: job.relevanceScore ?? 0,
      first_seen: job.firstSeen,
      benefits: job.benefits ?? [],
      has_equity: job.hasEquity ?? false,
      company_size: job.companySize ?? "unknown",
      is_agency: job.isAgency ?? false,
      role_type: job.roleType ?? "unknown",
      mentions_ai: job.mentionsAI ?? false,
      mentions_design_systems: job.mentionsDesignSystems ?? false,
      has_salary_info: job.hasSalaryInfo ?? false,
      has_benefits_info: job.hasBenefitsInfo ?? false,
      days_old: job.daysOld ?? 0,
      estimated_salary: job.estimatedSalary ?? null,
      salary_source: job.salarySource ?? "unknown",
      salary_below_floor: job.salaryBelowFloor ?? false,
      company_rating: job.companyRating ?? null,
      company_wlb: job.companyWorkLifeBalance ?? null,
      company_growth_trend: job.companyGrowthTrend ?? "unknown",
      company_headcount: job.companyHeadcount ?? null,
      company_red_flags: job.companyRedFlags ?? [],
      company_reputation_source: job.companyReputationSource ?? null,
      company_reputation_available: job.companyReputationAvailable ?? false,
    };

    // Only include AI fields if they're actually set — never overwrite existing scores with null
    if (job.aiFitScore != null)           row.ai_fit_score = job.aiFitScore;
    if (job.aiFitSummary != null)         row.ai_fit_summary = job.aiFitSummary;
    if (job.aiSkillGaps != null)          row.ai_skill_gaps = job.aiSkillGaps;
    if (job.aiHighlights != null)         row.ai_highlights = job.aiHighlights;
    if (job.aiDescriptionSummary != null) row.ai_description_summary = job.aiDescriptionSummary;

    return row;
  });

  const { error } = await supabase.from("listings").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Failed to save listings: ${error.message}`);
}
