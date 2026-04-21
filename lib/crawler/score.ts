import { JobListing } from "./types";
import { searchConfig } from "../config";
import { parseSalaryMax } from "./salary-estimate";

export function scoreListing(job: JobListing): JobListing {
  const title = job.title.toLowerCase();
  const desc = ((job.description ?? "") + " " + title).toLowerCase();
  let score = 0;

  // CORE MATCH (title-based)
  const hasSeniority = searchConfig.seniorityTerms.some((t) => title.includes(t));
  if (hasSeniority) score += 30;

  const hasKeywordInTitle = searchConfig.keywords.some((k) => title.includes(k));
  if (hasKeywordInTitle) score += 20;

  // SENIORITY IN DESCRIPTION (catches roles with generic titles)
  if (!hasSeniority) {
    const descBody = (job.description ?? "").toLowerCase();
    const hasStaffPrincipalInDesc = /\bstaff\b/.test(descBody) || /\bprincipal\b/.test(descBody);
    if (hasStaffPrincipalInDesc) score += 20;

    const hasHighExp = /\b(8\+|8-10|10\+|10-\d+)\s*years?\b/.test(descBody);
    if (hasHighExp) score += 15;

    const hasMidExp = /\b(5\+|5-7|6\+|6-8|7\+)\s*years?\b/.test(descBody);
    if (hasMidExp) score += 8;

    const hasLeadInDesc = /\b(ic leader|design lead|lead designer)\b/.test(descBody);
    if (hasLeadInDesc) score += 12;
  }

  // JUNIOR / WRONG LEVEL PENALTY
  const hasJuniorSignal =
    /\b(1-3 years?|2\+ years?|entry.?level|junior)\b/.test(desc);
  if (hasJuniorSignal) score -= 25;

  // FIT SIGNALS
  const b2bTerms = ["enterprise", "b2b", "for businesses", "for companies", "for teams", "business customers", "smb", "mid-market", "fortune 500", "corporate clients", "saas", "software as a service", "internal tools", "internal tool", "business owners", "small business", "admin dashboard", "operations platform", "underwriting", "procurement", "erp", "crm platform", "hr platform", "payroll platform"];
  const isSaaS = desc.includes("saas") || desc.includes("software as a service");
  const isB2B = b2bTerms.some((t) => desc.includes(t));
  if (isSaaS) score += 24;
  else if (isB2B) score += 20;

  const aiInTitle = /\bai\b|artificial intelligence|machine learning|llm/.test(title);
  if (aiInTitle) score += 15;
  else if (job.mentionsAI) score += 10;

  if (desc.includes("figma")) score += 5;
  if (job.roleType === "ic") score += 5;

  // POSTING QUALITY SIGNALS (reduced — indicate well-formatted posting, not fit)
  if (job.hasBenefitsInfo) score += 5;
  if (job.hasEquity) score += 5;
  if (job.remote) score += 10;
  if (job.hasSalaryInfo) score += 4;

  // SALARY TIER BONUSES (listed salary only — don't reward estimates)
  if (job.salarySource === "listed" || job.hasSalaryInfo) {
    const salaryStr = job.salary ?? job.estimatedSalary;
    const salaryMax = parseSalaryMax(salaryStr);
    if (salaryMax >= 200_000) score += 12;
    else if (salaryMax >= 150_000) score += 6;
  }

  // RECENCY
  if ((job.daysOld ?? 999) <= 7) score += 2;

  // PHOENIX / LOCATION
  const loc = (job.location ?? "").toLowerCase();
  const phoenixUnambiguous = ["phoenix", "scottsdale", "tempe", "arizona", ", az", "(az)", " az "];
  const phoenixAmbiguous = ["mesa", "chandler", "gilbert", "glendale", "peoria", "surprise"];
  const isPhoenix = phoenixUnambiguous.some(t => loc.includes(t)) ||
    (phoenixAmbiguous.some(t => loc.includes(t)) && (loc.includes("az") || loc.includes("arizona")));
  const mentionsHybrid = desc.includes("hybrid") || loc.includes("hybrid");
  if (isPhoenix && mentionsHybrid) score += 12;
  else if (isPhoenix && !job.remote) score += 8;

  // Penalty: in-office out of state (can't relocate)
  if (!job.remote && !isPhoenix) score -= 50;

  // COMPANY REPUTATION
  if (job.companyRating !== undefined) {
    if (job.companyRating >= 4.0) score += 8;
    else if (job.companyRating < 3.0) score -= 10;
    else if (job.companyRating < 3.5) score -= 5;
  }
  if (job.companyGrowthTrend === "growing") score += 5;
  if ((job.companyWorkLifeBalance ?? 0) >= 4.0) score += 3;

  const redFlagCount = job.companyRedFlags?.length ?? 0;
  if (redFlagCount >= 2) score -= 15;
  else if (redFlagCount === 1) score -= 8;

  // PENALTIES
  // Hard exclusions — completely wrong profession (title-only)
  const wrongProfessionTerms = [
    "floral", "flower", "florist",
    "interior designer", "interior design",
    "fashion designer", "textile designer", "apparel designer",
    "jewelry designer", "landscape designer", "landscape architect",
    "furniture designer", "industrial designer",
    "architect", "architectural",
  ];
  const isWrongProfession = wrongProfessionTerms.some((t) => title.includes(t));
  if (isWrongProfession) score -= 50;

  // Excluded terms are title-only — description mentions are normal at Staff level
  const excludedTitleTerms = [
    "design systems designer", "design ops", "designops",
    "graphic designer", "visual designer", "ui developer",
    "brand designer", "motion designer", "game designer", "marketing designer",
    "learning", "instructional",
    ...searchConfig.excludeTerms,
  ];
  const hasExcludedTitle = excludedTitleTerms.some((t) => title.includes(t));
  if (hasExcludedTitle) score -= 20;

  if (job.salarySource === "listed" && job.salaryBelowFloor) score -= 15;
  if (job.salarySource === "estimated" && job.salaryBelowFloor) score -= 8;

  // Hard penalty for very low pay (below $100K)
  if (job.salarySource === "listed" || job.salarySource === "estimated") {
    const salaryStr = job.salary ?? job.estimatedSalary;
    const salaryMax = parseSalaryMax(salaryStr);
    if (salaryMax > 0 && salaryMax < 100_000) score -= 50;
  }

  if (job.isAgency) score -= 10;

  const age = job.daysOld ?? 0;
  if (age > 30) {
    job.relevanceScore = -100; // hard cutoff
    return job;
  }
  if (age > 21) score -= 5;

  job.relevanceScore = Math.max(0, score);
  return job;
}
