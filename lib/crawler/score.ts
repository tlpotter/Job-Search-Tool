import { JobListing } from "./types";
import { searchConfig } from "../config";
import { parseSalaryMax } from "./salary-estimate";

export function scoreListing(job: JobListing): JobListing {
  const title = job.title.toLowerCase();
  const desc = ((job.description ?? "") + " " + title).toLowerCase();
  let score = 0;

  // CORE MATCH
  const hasSeniority = searchConfig.seniorityTerms.some((t) => title.includes(t));
  if (hasSeniority) score += 30;

  const hasKeywordInTitle = searchConfig.keywords.some((k) => title.includes(k));
  if (hasKeywordInTitle) score += 20;

  // HIGH-VALUE SIGNALS
  if (job.mentionsDesignSystems) score += 15;
  if (job.hasBenefitsInfo) score += 12;
  if (job.hasEquity) score += 10;
  if (job.remote) score += 10;
  if (job.hasSalaryInfo) score += 8;

  // SALARY TIER BONUSES (listed salary only — don't reward estimates)
  if (job.salarySource === "listed" || job.hasSalaryInfo) {
    const salaryStr = job.salary ?? job.estimatedSalary;
    const salaryMax = parseSalaryMax(salaryStr);
    if (salaryMax >= 200_000) score += 12;
    else if (salaryMax >= 150_000) score += 6;
  }

  // BONUS SIGNALS
  if (job.mentionsAI) score += 5;
  if (desc.includes("figma")) score += 5;
  if (job.roleType === "ic") score += 3;
  if ((job.daysOld ?? 999) <= 7) score += 2;

  // HYBRID IN PHOENIX METRO
  const phoenixTerms = ["phoenix", "scottsdale", "tempe", "mesa", "chandler", "gilbert", "glendale", "peoria", "surprise", "arizona", ", az", "(az)"];
  const isPhoenix = phoenixTerms.some(t => (job.location ?? "").toLowerCase().includes(t));
  const mentionsHybrid = desc.includes("hybrid") || (job.location ?? "").toLowerCase().includes("hybrid");
  if (isPhoenix && mentionsHybrid) score += 12;
  else if (isPhoenix && !job.remote) score += 8; // local in-person also valuable

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
  const hasExcluded = searchConfig.excludeTerms.some((t) => title.includes(t) || desc.includes(t));
  if (hasExcluded) score -= 20;

  if (job.salarySource === "listed" && job.salaryBelowFloor) score -= 15;
  if (job.salarySource === "estimated" && job.salaryBelowFloor) score -= 8;

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
