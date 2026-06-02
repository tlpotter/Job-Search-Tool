import Anthropic from "@anthropic-ai/sdk";
import { JobListing } from "./types";
import { parseSalaryMax } from "./salary-estimate";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface AIRankResult {
  fitScore: number;
  summary: string;
  gaps: string[];
  highlights: string[];
  descriptionSummary: string;
  // Sub-scores (0-100 each) that compose the weighted total
  scoreRole: number;
  scoreCompany: number;
  scoreComp: number;
  scoreIndustry: number;
  scoreGrowth: number;
}

// Weights applied to sub-scores to produce ai_fit_score.
// Research-informed (Person-Job ~50%, Person-Organization ~35%, comp ~15%).
export const AI_WEIGHTS = {
  role: 0.35,
  company: 0.25,
  comp: 0.15,
  industry: 0.15,
  growth: 0.10,
} as const;

/**
 * Deterministic compensation sub-score. Lives in code (not the LLM) so
 * weights and thresholds are auditable and easy to tune.
 *
 * Listed comp gets full credit; estimated comp gets discounted because of
 * uncertainty. Missing comp data scores neutral (50) so it neither helps
 * nor hurts the overall fit.
 */
export function computeCompScore(job: JobListing): number {
  const salaryStr = job.salary ?? job.estimatedSalary;
  const max = parseSalaryMax(salaryStr);
  if (max <= 0) return 50; // unknown comp — neutral

  const isListed = job.salarySource === "listed";

  if (isListed) {
    if (max >= 200_000) return 100;
    if (max >= 180_000) return 90;
    if (max >= 160_000) return 80;
    if (max >= 140_000) return 70;
    if (max >= 120_000) return 50;
    if (max >= 100_000) return 30;
    return 10;
  }

  // Estimated comp — discounted for uncertainty
  if (max >= 200_000) return 80;
  if (max >= 180_000) return 75;
  if (max >= 160_000) return 65;
  if (max >= 140_000) return 55;
  if (max >= 120_000) return 40;
  if (max >= 100_000) return 25;
  return 15;
}

function clampScore(n: unknown): number {
  const num = Number(n);
  if (!Number.isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

const SYSTEM_PROMPT = `You are a job-fit evaluator scoring listings against a candidate profile.

Respond with a single raw JSON object only — no markdown, no prose, no explanation. The JSON must have exactly these keys:
{
  "role": <int 0-100>,
  "company": <int 0-100>,
  "industry": <int 0-100>,
  "growth": <int 0-100>,
  "summary": "<1-2 sentences about fit>",
  "gaps": ["<string>"],
  "highlights": ["<string>"],
  "descriptionSummary": "<2-3 sentences about what this person will actually do day-to-day>"
}

Each sub-score is 0-100. Anchor points:

role (title + seniority + day-to-day work):
  90-100 = exact title match, right seniority, strong skill alignment
  70-89  = close title, right seniority, most skills match
  50-69  = adjacent role OR notable skill gaps
  <50    = wrong role, wrong seniority, or critical skill mismatches

company (culture, work-life balance, reputation):
  90-100 = Glassdoor >=4.3, strong WLB, no red flags
  70-89  = Glassdoor >=4.0, mostly positive signals
  50-69  = mid 3s rating OR mixed signals OR unknown
  <50    = below 3.5, multiple red flags, or known toxic culture
  If no reputation data is available, score 50.

industry (domain / product fit):
  90-100 = direct match to candidate's stated industry focus areas
  70-89  = adjacent industry (transferable experience)
  50-69  = unfamiliar but plausibly transferable
  <50    = mismatched industry (e.g., regulated finance for consumer designer)

growth (company trajectory, role stability):
  90-100 = hiring multiple designers, recent funding, expansion signals
  70-89  = hiring, no shrinkage signals
  50-69  = stable, no growth/decline signals (default if no info)
  <50    = layoffs, hiring freeze, restructuring, declining revenue

IMPORTANT: do NOT factor salary or compensation into any of these scores — comp is scored separately by a deterministic function.

For descriptionSummary: focus on what the person will actually do, what team they join, and what problems they'll solve — not boilerplate about company mission.`;

export async function aiRankListing(job: JobListing, profile: string): Promise<AIRankResult> {
  const companyContext = job.companyReputationAvailable
    ? `\n## Company Info
Rating: ${job.companyRating ?? "N/A"}/5.0
Work-Life Balance: ${job.companyWorkLifeBalance ?? "N/A"}/5.0
Growth Trend: ${job.companyGrowthTrend}
Headcount: ${job.companyHeadcount ?? "unknown"}
Red Flags: ${job.companyRedFlags?.length ? job.companyRedFlags.join(", ") : "none"}`
    : "";

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Candidate Profile\n${profile}\n\n## Job Listing\nTitle: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description ?? "No description available"}${companyContext}`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  let parsed: {
    role?: unknown; company?: unknown; industry?: unknown; growth?: unknown;
    summary?: unknown; gaps?: unknown; highlights?: unknown; descriptionSummary?: unknown;
  };
  try {
    if (!jsonMatch) throw new Error("No JSON object found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("AI rank parse failed. Raw response:", raw.slice(0, 200));
    parsed = {};
  }

  const scoreRole = clampScore(parsed.role);
  const scoreCompany = clampScore(parsed.company);
  const scoreIndustry = clampScore(parsed.industry);
  const scoreGrowth = clampScore(parsed.growth);
  const scoreComp = computeCompScore(job);

  const fitScore = Math.round(
    scoreRole * AI_WEIGHTS.role +
    scoreCompany * AI_WEIGHTS.company +
    scoreComp * AI_WEIGHTS.comp +
    scoreIndustry * AI_WEIGHTS.industry +
    scoreGrowth * AI_WEIGHTS.growth
  );

  return {
    fitScore,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.filter((g): g is string => typeof g === "string") : [],
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.filter((h): h is string => typeof h === "string") : [],
    descriptionSummary: typeof parsed.descriptionSummary === "string" ? parsed.descriptionSummary : "",
    scoreRole,
    scoreCompany,
    scoreComp,
    scoreIndustry,
    scoreGrowth,
  };
}
