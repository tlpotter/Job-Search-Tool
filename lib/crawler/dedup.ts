import { createHash } from "crypto";
import { supabase } from "../supabase";
import { JobListing } from "./types";

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    // Strip UTM and other tracking params that create false duplicates
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
     "ref", "source", "via", "referrer"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url.trim();
  }
}

export function generateId(job: Pick<JobListing, "company" | "title" | "url">): string {
  const raw = `${job.company.toLowerCase().trim()}|${job.title.toLowerCase().trim()}|${normalizeUrl(job.url)}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function fuzzyKey(job: JobListing): string {
  // Normalize company + title to catch same job posted with different URLs
  const company = job.company.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const title = job.title.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  return `${company}|${title}`;
}

const BLOCKED_DOMAINS = [
  "liveblog365.com",
  "remote.co",
];

export async function dedup(listings: JobListing[]): Promise<JobListing[]> {
  if (listings.length === 0) return [];

  // Filter out known scam/spam domains
  listings = listings.filter((l) => !BLOCKED_DOMAINS.some((d) => l.url.includes(d)));

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

  // 3. Fuzzy-check against DB by company name to catch URL-variant duplicates and
  //    jobs the user already actioned (not_interested, applied, etc.)
  const companies = [...new Set(dedupedLocally.map((l) => l.company.trim()))];
  const { data: existingByCompany } = await supabase
    .from("listings")
    .select("title, company, user_actions(status)")
    .in("company", companies.slice(0, 500));

  const ACTIONED_STATUSES = new Set(["applied", "not_interested", "hidden", "passed", "zombie_listing"]);

  const existingFuzzyKeys = new Set(
    (existingByCompany ?? []).map((r: { title: string; company: string }) =>
      `${r.company.toLowerCase().replace(/[^a-z0-9]/g, "")}|${r.title.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    )
  );

  // Also build a set of fuzzy keys for jobs the user has already actioned —
  // used to block re-saving similar jobs from different sources/URLs
  const actionedFuzzyKeys = new Set(
    (existingByCompany ?? [])
      .filter((r: { title: string; company: string; user_actions: { status?: string }[] }) => {
        const status = r.user_actions?.[0]?.status ?? "";
        return ACTIONED_STATUSES.has(status);
      })
      .map((r: { title: string; company: string }) =>
        `${r.company.toLowerCase().replace(/[^a-z0-9]/g, "")}|${r.title.toLowerCase().replace(/[^a-z0-9]/g, "")}`
      )
  );

  return dedupedLocally.filter(
    (l) => !existingIds.has(l.id) && !existingFuzzyKeys.has(fuzzyKey(l)) && !actionedFuzzyKeys.has(fuzzyKey(l))
  );
}

// Postgres text columns reject  (null bytes). Some job sources return
// descriptions with embedded null bytes or other invalid Unicode that crash
// the entire insert. Strip them before sending to Supabase.
function sanitizeText(s: string | null | undefined): string | null {
  if (s == null) return null;
  // Strip null bytes and C0 control chars except \t (\u0009), \n (\u000a), \r (\u000d).
  // Postgres text columns reject \u0000, and other control chars create
  // "unsupported Unicode escape sequence" errors on upsert.
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
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
      title: sanitizeText(job.title) ?? "",
      company: sanitizeText(job.company) ?? "",
      location: sanitizeText(job.location) ?? "",
      remote: job.remote,
      url: job.url,
      salary: sanitizeText(job.salary),
      posted_date: job.postedDate ?? null,
      description: sanitizeText(job.description),
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
    if (job.aiFitSummary != null)         row.ai_fit_summary = sanitizeText(job.aiFitSummary);
    if (job.aiSkillGaps != null)          row.ai_skill_gaps = job.aiSkillGaps.map((g) => sanitizeText(g) ?? "");
    if (job.aiHighlights != null)         row.ai_highlights = job.aiHighlights.map((h) => sanitizeText(h) ?? "");
    if (job.aiDescriptionSummary != null) row.ai_description_summary = sanitizeText(job.aiDescriptionSummary);

    return row;
  });

  const { error } = await supabase.from("listings").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Failed to save listings: ${error.message}`);
}
