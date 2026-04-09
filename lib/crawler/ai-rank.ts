import Anthropic from "@anthropic-ai/sdk";
import { JobListing } from "./types";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

interface AIRankResult {
  fitScore: number;
  summary: string;
  gaps: string[];
  highlights: string[];
  descriptionSummary: string;
}

export async function aiRankListing(job: JobListing, profile: string): Promise<AIRankResult> {
  const companyContext = job.companyReputationAvailable
    ? `\n## Company Info
Rating: ${job.companyRating ?? "N/A"}/5.0
Work-Life Balance: ${job.companyWorkLifeBalance ?? "N/A"}/5.0
Growth Trend: ${job.companyGrowthTrend}
Headcount: ${job.companyHeadcount ?? "unknown"}
Red Flags: ${job.companyRedFlags?.length ? job.companyRedFlags.join(", ") : "none"}`
    : "";

  const salaryContext = job.salary
    ? `\nSalary: ${job.salary} (listed)`
    : job.estimatedSalary
      ? `\nSalary: ${job.estimatedSalary} (estimated)`
      : "";

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `You are a job fit evaluator. Respond with a single raw JSON object only — no markdown, no prose, no explanation. The JSON must have exactly these keys:
{"fitScore": <integer 0-100>, "summary": "<1-2 sentences about fit>", "gaps": ["<string>"], "highlights": ["<string>"], "descriptionSummary": "<2-3 sentences summarizing what this role actually does day-to-day>"}

Scoring guide: 90-100 = near-perfect match, 70-89 = strong match with minor gaps, 50-69 = partial match with notable gaps, below 50 = significant mismatches.
Factor in: role seniority fit, skill alignment, industry fit, salary vs candidate floor ($140K+), company health if data available.
For descriptionSummary: focus on what the person will actually do, what team they join, and what problems they'll solve — not boilerplate about company mission.`,
    messages: [
      {
        role: "user",
        content: `## Candidate Profile\n${profile}\n\n## Job Listing\nTitle: ${job.title}\nCompany: ${job.company}${salaryContext}\nDescription: ${job.description ?? "No description available"}${companyContext}`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  // Extract the JSON object regardless of markdown fences or surrounding text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  try {
    if (!jsonMatch) throw new Error("No JSON object found");
    return JSON.parse(jsonMatch[0]) as AIRankResult;
  } catch {
    console.error("AI rank parse failed. Raw response:", raw.slice(0, 200));
    return { fitScore: 0, summary: "Could not parse AI response.", gaps: [], highlights: [], descriptionSummary: "" };
  }
}
