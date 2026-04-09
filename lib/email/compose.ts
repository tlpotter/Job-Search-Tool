import { JobListing } from "../crawler/types";

function healthBadge(job: JobListing): string {
  if (!job.companyReputationAvailable) return "⚪ No data";
  const flags = job.companyRedFlags?.length ?? 0;
  const rating = job.companyRating ?? 0;
  if (flags >= 2 || rating < 3.0) return "🔴 Caution";
  if (flags === 1 || (rating > 0 && rating < 4.0)) return "🟡 Mixed";
  if (rating >= 4.0 && flags === 0) return "🟢 Strong";
  return "⚪ No data";
}

function scoreColor(score: number): string {
  if (score >= 70) return "#16a34a"; // green
  if (score >= 40) return "#ca8a04"; // yellow
  return "#6b7280"; // gray
}

function formatJob(job: JobListing): string {
  const score = job.relevanceScore ?? 0;
  const aiScore = job.aiFitScore ? ` | AI Fit: ${job.aiFitScore}` : "";
  const salary = job.salary
    ? `💰 ${job.salary} (listed)`
    : job.estimatedSalary
      ? `💰 ~${job.estimatedSalary} (estimated)`
      : "";

  const badges = [
    job.hasBenefitsInfo ? "🔥 Benefits" : "",
    job.hasEquity ? "📈 Equity" : "",
    job.mentionsDesignSystems ? "🧩 Design Systems" : "",
    job.mentionsAI ? "🤖 AI" : "",
    job.isAgency ? "🏷️ Agency" : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const companyInfo = job.companyReputationAvailable
    ? `${healthBadge(job)} Company: ${job.companyRating ? `${job.companyRating}★` : "N/A"} | ${job.companyGrowthTrend ?? "unknown trend"}`
    : `${healthBadge(job)}`;

  const aiSummary = job.aiFitSummary
    ? `<p style="margin:4px 0 0 0;font-style:italic;color:#374151">🤖 "${job.aiFitSummary}"</p>`
    : "";

  const gaps =
    job.aiSkillGaps?.length
      ? `<p style="margin:2px 0;font-size:12px;color:#6b7280">⚠️ Gaps: ${job.aiSkillGaps.join(", ")}</p>`
      : "";

  const highlights =
    job.aiHighlights?.length
      ? `<p style="margin:2px 0;font-size:12px;color:#16a34a">✓ ${job.aiHighlights.join(", ")}</p>`
      : "";

  return `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <strong style="font-size:15px"><a href="${job.url}" style="color:#1d4ed8;text-decoration:none">${job.title}</a></strong>
          — ${job.company}
          <span style="margin-left:8px;background:${scoreColor(score)};color:#fff;padding:2px 8px;border-radius:12px;font-size:12px">
            Score: ${score}${aiScore}
          </span>
        </div>
      </div>
      <p style="margin:6px 0 4px 0;font-size:13px;color:#6b7280">
        📍 ${job.location}${job.remote ? " (Remote)" : ""} |
        📅 ${job.postedDate ?? "Unknown"} |
        ${job.roleType === "ic" ? "👤 IC" : job.roleType === "management" ? "👥 Management" : ""}
        ${job.companySize !== "unknown" ? `| ${job.companySize}` : ""}
      </p>
      ${salary ? `<p style="margin:4px 0;font-size:13px">${salary}</p>` : ""}
      ${badges ? `<p style="margin:4px 0;font-size:13px">${badges}</p>` : ""}
      <p style="margin:4px 0;font-size:13px">${companyInfo}</p>
      ${aiSummary}
      ${highlights}
      ${gaps}
    </div>
  `;
}

export function composeEmail(listings: JobListing[]): string {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const topMatches = listings.filter((l) => (l.relevanceScore ?? 0) >= 70 && !l.isAgency);
  const goodMatches = listings.filter(
    (l) => (l.relevanceScore ?? 0) >= 40 && (l.relevanceScore ?? 0) < 70 && !l.isAgency
  );
  const agencies = listings.filter((l) => l.isAgency);

  const withBenefits = listings.filter((l) => l.hasBenefitsInfo).length;
  const withEquity = listings.filter((l) => l.hasEquity).length;

  const icCount = listings.filter((l) => l.roleType === "ic").length;
  const mgmtCount = listings.filter((l) => l.roleType === "management").length;
  const startupCount = listings.filter((l) => l.companySize === "startup").length;
  const enterpriseCount = listings.filter((l) => l.companySize === "enterprise").length;
  const midsizeCount = listings.filter((l) => l.companySize === "midsize").length;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:20px;background:#f9fafb;color:#111827">

  <h1 style="font-size:22px;margin-bottom:4px">📬 Daily UX Job Digest — ${today}</h1>
  <p style="color:#6b7280;margin-top:0">
    <strong>${listings.length} AI-scored listings</strong> — showing only jobs that scored ≥60 relevance
    ${withBenefits > 0 ? `| ${withBenefits} with benefits` : ""}
    ${withEquity > 0 ? `| ${withEquity} with equity` : ""}
  </p>

  ${
    topMatches.length > 0
      ? `
  <h2 style="color:#16a34a;border-bottom:2px solid #16a34a;padding-bottom:4px">🏆 Top Matches (score 70+)</h2>
  ${topMatches.map(formatJob).join("")}
  `
      : ""
  }

  ${
    goodMatches.length > 0
      ? `
  <h2 style="color:#ca8a04;border-bottom:2px solid #ca8a04;padding-bottom:4px">👍 Good Matches (score 40–69)</h2>
  ${goodMatches.map(formatJob).join("")}
  `
      : ""
  }

  ${
    agencies.length > 0
      ? `
  <h2 style="color:#6b7280;border-bottom:2px solid #e5e7eb;padding-bottom:4px">🏢 Agency / Consultancy</h2>
  ${agencies.map(formatJob).join("")}
  `
      : ""
  }

  <div style="background:#f3f4f6;border-radius:8px;padding:12px;margin-top:24px;font-size:13px;color:#374151">
    <strong>📊 Summary:</strong>
    ${icCount} IC roles | ${mgmtCount} management | ${listings.length - icCount - mgmtCount} unknown<br>
    ${startupCount} startup | ${enterpriseCount} enterprise | ${midsizeCount} midsize
  </div>

</body>
</html>
  `.trim();
}
