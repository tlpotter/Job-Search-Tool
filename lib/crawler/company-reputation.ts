import { CompanyReputation } from "./types";

const reputationCache = new Map<string, CompanyReputation>();

function parseRating(text: string): number | undefined {
  // Require a decimal point so "1/5" (pagination, review counts) can't match
  // Glassdoor always shows ratings like "4.1" or "3.8", never a bare integer
  const match = text.match(/(\d+\.\d+)\s*(\/\s*5|out of 5|stars?)/i);
  if (match) {
    const val = parseFloat(match[1]);
    return val >= 1.0 && val <= 5.0 ? val : undefined;
  }
  // Also try "4.2 rating" patterns
  const ratingMatch = text.match(/(\d+\.\d+)\s*rating/i);
  if (ratingMatch) {
    const val = parseFloat(ratingMatch[1]);
    return val >= 1.0 && val <= 5.0 ? val : undefined;
  }
  return undefined;
}

function detectGrowthTrend(text: string): CompanyReputation["growthTrend"] {
  const lower = text.toLowerCase();
  if (/hiring|growing|growth|expanding|series [c-z]/i.test(lower)) return "growing";
  if (/layoff|shrink|downsize|restructur|decline/i.test(lower)) return "shrinking";
  if (/stable|steady|consistent/i.test(lower)) return "stable";
  return "unknown";
}

async function searchSnippet(query: string): Promise<string | null> {
  // Uses JSearch (RapidAPI) for Google search snippets if key available
  // Falls back to null — reputation is best-effort
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;

  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encoded}&page=1&num_pages=1`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const snippets = (json.data ?? [])
      .slice(0, 3)
      .map((r: { job_description?: string; job_title?: string }) =>
        [r.job_title, r.job_description].filter(Boolean).join(" ")
      )
      .join(" ");
    return snippets || null;
  } catch {
    return null;
  }
}

export async function lookupCompanyReputation(companyName: string): Promise<CompanyReputation> {
  if (reputationCache.has(companyName)) return reputationCache.get(companyName)!;

  const reputation: CompanyReputation = {
    growthTrend: "unknown",
    redFlags: [],
    source: "none",
  };

  // 1. Glassdoor rating snippet
  const ratingSnippet = await searchSnippet(`${companyName} glassdoor rating`);
  if (ratingSnippet) {
    const rating = parseRating(ratingSnippet);
    if (rating !== undefined) {
      reputation.rating = rating;
      reputation.source = "glassdoor-snippet";
      if (rating < 3.0) reputation.redFlags.push(`low rating (${rating}/5.0)`);
    }
  }

  // 2. News red flags
  const newsSnippet = await searchSnippet(
    `${companyName} layoffs OR restructuring OR "hiring freeze" 2025 OR 2026`
  );
  if (newsSnippet) {
    if (/layoff/i.test(newsSnippet)) reputation.redFlags.push("recent layoffs reported");
    if (/restructur/i.test(newsSnippet)) reputation.redFlags.push("recent restructuring");
    if (/hiring freeze/i.test(newsSnippet)) reputation.redFlags.push("hiring freeze reported");
    if (/CEO (left|depart|resign|fired)/i.test(newsSnippet)) reputation.redFlags.push("CEO turnover");

    const trend = detectGrowthTrend(newsSnippet);
    if (trend !== "unknown") reputation.growthTrend = trend;
  }

  reputationCache.set(companyName, reputation);
  return reputation;
}

export function enrichWithReputation(
  job: import("./types").JobListing,
  reputation: CompanyReputation
): import("./types").JobListing {
  return {
    ...job,
    companyRating: reputation.rating,
    companyWorkLifeBalance: reputation.workLifeBalance,
    companyGrowthTrend: reputation.growthTrend,
    companyHeadcount: reputation.headcount,
    companyRedFlags: reputation.redFlags,
    companyReputationSource: reputation.source,
    companyReputationAvailable: reputation.source !== "none",
  };
}
