import { Resend } from "resend";
import { JobListing } from "../crawler/types";
import { composeEmail } from "./compose";
import { searchConfig } from "../config";
import { supabase } from "../supabase";

const HIDDEN_STATUSES = new Set(["applied", "not_interested", "hidden", "passed"]);

async function fetchTopListingsFromDb(): Promise<JobListing[]> {
  // Pull top AI-scored listings, with their user_actions status
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, title, company, location, remote, url,
      salary, estimated_salary, salary_source, salary_below_floor,
      posted_date, relevance_score, ai_fit_score, ai_fit_summary,
      ai_skill_gaps, ai_highlights, ai_description_summary,
      source, role_type, company_size, has_equity, has_benefits_info,
      mentions_design_systems, mentions_ai, is_agency,
      company_rating, company_red_flags, company_growth_trend,
      company_reputation_available,
      user_actions (status)
    `)
    .not("ai_fit_score", "is", null)
    .gte("relevance_score", 60)
    .order("relevance_score", { ascending: false })
    .limit(100);

  if (error) throw new Error(`DB fetch failed: ${error.message}`);

  // Filter out jobs the user has already actioned
  const actionable = (data ?? []).filter((row) => {
    const status = (row.user_actions as { status?: string } | null)?.status;
    return !status || !HIDDEN_STATUSES.has(status);
  });

  // Map snake_case DB columns → camelCase JobListing
  return actionable.map((row) => ({
    id: row.id,
    source: row.source,
    title: row.title,
    company: row.company,
    location: row.location,
    remote: row.remote,
    url: row.url,
    salary: row.salary,
    estimatedSalary: row.estimated_salary,
    salarySource: row.salary_source,
    salaryBelowFloor: row.salary_below_floor,
    postedDate: row.posted_date,
    relevanceScore: row.relevance_score,
    aiFitScore: row.ai_fit_score,
    aiFitSummary: row.ai_fit_summary,
    aiSkillGaps: row.ai_skill_gaps,
    aiHighlights: row.ai_highlights,
    aiDescriptionSummary: row.ai_description_summary,
    roleType: row.role_type,
    companySize: row.company_size,
    hasEquity: row.has_equity,
    hasBenefitsInfo: row.has_benefits_info,
    mentionsDesignSystems: row.mentions_design_systems,
    mentionsAI: row.mentions_ai,
    isAgency: row.is_agency,
    companyRating: row.company_rating,
    companyRedFlags: row.company_red_flags,
    companyGrowthTrend: row.company_growth_trend,
    companyReputationAvailable: row.company_reputation_available,
    firstSeen: "",
  })) as JobListing[];
}

export async function sendDigest(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Resend: missing RESEND_API_KEY, skipping email");
    return;
  }

  if (!searchConfig.emailTo) {
    console.warn("Resend: missing EMAIL_TO env var, skipping email");
    return;
  }

  const listings = await fetchTopListingsFromDb();

  if (listings.length === 0) {
    console.log("No actionable AI-scored listings to email.");
    return;
  }

  console.log(`  Emailing ${listings.length} top listings (excluding applied/hidden/not-interested)`);

  const resend = new Resend(apiKey);
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const html = composeEmail(listings);

  const { error } = await resend.emails.send({
    from: "Job Crawler <onboarding@resend.dev>",
    to: searchConfig.emailTo,
    subject: `📬 ${listings.length} top UX jobs — ${today}`,
    html,
  });

  if (error) {
    throw new Error(`Resend email failed: ${JSON.stringify(error)}`);
  }

  console.log(`  Email sent to ${searchConfig.emailTo}`);
}
