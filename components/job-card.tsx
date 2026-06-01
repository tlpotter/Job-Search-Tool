"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScoreBadge } from "./score-badge";
import { AppliedButton } from "./applied-button";
import { useIsDemo } from "./session-provider";
import { cleanDescription } from "@/lib/utils/clean-description";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    url: string;
    salary?: string | null;
    estimated_salary?: string | null;
    salary_source?: string | null;
    salary_below_floor?: boolean | null;
    posted_date?: string | null;
    relevance_score?: number | null;
    ai_fit_score?: number | null;
    ai_fit_summary?: string | null;
    ai_description_summary?: string | null;
    source: string;
    role_type?: string | null;
    company_size?: string | null;
    has_equity?: boolean | null;
    has_benefits_info?: boolean | null;
    mentions_design_systems?: boolean | null;
    mentions_ai?: boolean | null;
    is_agency?: boolean | null;
    company_rating?: number | null;
    company_red_flags?: string[] | null;
    company_growth_trend?: string | null;
    company_reputation_available?: boolean | null;
    description?: string | null;
    user_actions?: { status?: string; bookmarked?: boolean } | null;
  };
  onStatusChange?: (id: string, status: string) => void;
  onBookmark?: (id: string, bookmarked: boolean) => void;
}

const statusOptions = [
  "not_reviewed",
  "save_for_later",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "not_interested",
  "zombie_listing",
];
const statusLabels: Record<string, string> = {
  not_reviewed: "Not reviewed",
  save_for_later: "Save for Later",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  not_interested: "Not Interested / Not a Fit",
  zombie_listing: "🧟 Zombie Listing",
};

function glassdoorUrl(company: string) {
  // Companies/reviews search rather than jobs
  return `https://www.glassdoor.com/Reviews/company-reviews.htm?sc.keyword=${encodeURIComponent(company)}`;
}

function formatPostedDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function Chip({ emoji, label, variant = "default", tooltip }: { emoji: string; label: string; variant?: BadgeVariant; tooltip: string }) {
  return (
    <Badge variant={variant} title={tooltip} className="cursor-default normal-case tracking-[0.06em]">
      <span aria-hidden>{emoji}</span> {label}
    </Badge>
  );
}

function ScoreOverlay({ job, onClose }: { job: JobCardProps["job"]; onClose: () => void }) {
  const score = job.relevance_score ?? 0;
  const title = job.title.toLowerCase();
  const desc = ((job.description ?? "") + " " + title).toLowerCase();

  const seniorityTerms = ["senior", "staff", "lead", "principal"];
  const keywords = ["ux designer", "product designer", "design systems", "senior designer", "staff designer", "design lead", "experience designer", "ui/ux designer"];

  const factors: { label: string; value: number; positive: boolean }[] = [];

  if (seniorityTerms.some(t => title.includes(t))) factors.push({ label: "Seniority term in title", value: 30, positive: true });
  if (keywords.some(k => title.includes(k))) factors.push({ label: "Keyword match in title", value: 20, positive: true });
  if (job.mentions_design_systems) factors.push({ label: "Design systems mentioned", value: 15, positive: true });
  if (job.has_benefits_info) factors.push({ label: "Benefits info present", value: 12, positive: true });
  if (job.has_equity) factors.push({ label: "Equity / stock options mentioned", value: 10, positive: true });
  if (job.remote) factors.push({ label: "Remote available", value: 10, positive: true });
  const jobLoc = (job.location ?? "").toLowerCase();
  const phoenixUnambiguous = ["phoenix", "scottsdale", "tempe", "arizona", ", az", "(az)", " az "];
  const phoenixAmbiguous = ["mesa", "chandler", "gilbert", "glendale", "peoria", "surprise"];
  const isPhoenix = phoenixUnambiguous.some(t => jobLoc.includes(t)) ||
    (phoenixAmbiguous.some(t => jobLoc.includes(t)) && (jobLoc.includes("az") || jobLoc.includes("arizona")));
  const mentionsHybrid = desc.includes("hybrid") || (job.location ?? "").toLowerCase().includes("hybrid");
  if (isPhoenix && mentionsHybrid) factors.push({ label: "Hybrid in Phoenix metro", value: 12, positive: true });
  else if (isPhoenix && !job.remote) factors.push({ label: "Local Phoenix metro role", value: 8, positive: true });
  if (job.salary) factors.push({ label: "Salary range listed", value: 8, positive: true });
  const salaryStr = job.salary ?? job.estimated_salary ?? "";
  const salaryNums = salaryStr.match(/\$?([\d,]+)/g)?.map(m => parseInt(m.replace(/[$,]/g, ""))).filter(n => !isNaN(n) && n > 1000) ?? [];
  const salaryMax = salaryNums.length > 0 ? Math.max(...salaryNums) : 0;
  if (salaryMax >= 200_000) factors.push({ label: `Salary max $${(salaryMax / 1000).toFixed(0)}K — exceeds $200K`, value: 12, positive: true });
  else if (salaryMax >= 150_000) factors.push({ label: `Salary max $${(salaryMax / 1000).toFixed(0)}K — exceeds $150K`, value: 6, positive: true });
  if (job.mentions_ai) factors.push({ label: "AI / LLM mentioned", value: 5, positive: true });
  if (desc.includes("figma")) factors.push({ label: "Figma mentioned", value: 5, positive: true });
  if (job.role_type === "ic") factors.push({ label: "IC role explicitly stated", value: 3, positive: true });
  if (job.company_rating && job.company_rating >= 4.0) factors.push({ label: `Company rating ${job.company_rating}★`, value: 8, positive: true });
  if (job.company_growth_trend === "growing") factors.push({ label: "Company growth trend: growing", value: 5, positive: true });
  if (job.company_rating && job.company_rating < 3.0) factors.push({ label: `Low company rating (${job.company_rating}★)`, value: -10, positive: false });
  else if (job.company_rating && job.company_rating < 3.5) factors.push({ label: `Below-average rating (${job.company_rating}★)`, value: -5, positive: false });
  const redFlags = job.company_red_flags?.length ?? 0;
  if (redFlags >= 2) factors.push({ label: `Multiple red flags (${redFlags})`, value: -15, positive: false });
  else if (redFlags === 1) factors.push({ label: `Red flag: ${job.company_red_flags?.[0]}`, value: -8, positive: false });
  if (job.is_agency) factors.push({ label: "Agency / consultancy", value: -10, positive: false });
  if (job.salary_below_floor && job.salary_source === "listed") factors.push({ label: "Listed salary below $140K", value: -15, positive: false });
  if (job.salary_below_floor && job.salary_source === "estimated") factors.push({ label: "Estimated salary below $140K", value: -8, positive: false });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-10 bg-[rgba(2,6,8,0.7)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="eyebrow mb-2 !text-[11px]">Score Breakdown</div>
            <p className="font-serif text-[18px] font-semibold leading-snug truncate text-white">{job.title}</p>
            <p className="text-[13px] text-white/55 mt-0.5 truncate">{job.company}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ScoreBadge score={score} />
            <button
              onClick={onClose}
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
          {factors.length === 0 && (
            <p className="text-sm text-white/40 text-center py-6">No scored factors found.</p>
          )}
          {factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="text-white/75">{f.label}</span>
              <span className={`font-semibold shrink-0 ${f.positive ? "text-[rgba(134,239,172,1)]" : "text-[rgba(255,180,180,.95)]"}`}>
                {f.positive ? "+" : ""}{f.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/45">Total score</span>
          <ScoreBadge score={score} />
        </div>

        {job.ai_fit_score != null && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/45">AI fit score</span>
            <ScoreBadge score={job.ai_fit_score} label="AI Fit" />
          </div>
        )}
        {job.ai_fit_summary && (
          <p className="mt-4 text-sm text-white/65 italic font-serif font-light border-l-2 border-[rgba(56,189,248,.3)] pl-3 leading-relaxed">
            {job.ai_fit_summary}
          </p>
        )}
      </div>
    </div>
  );
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const [showScoreOverlay, setShowScoreOverlay] = useState(false);
  const router = useRouter();
  const isDemo = useIsDemo();
  const score = job.relevance_score ?? 0;
  const status = job.user_actions?.status ?? "not_reviewed";
  const desc = ((job.description ?? "") + " " + job.title).toLowerCase();

  const benefitsKeywords = ["health insurance", "dental", "vision", "401k", "401(k)", "pto", "paid time off", "parental leave", "wellness", "learning budget", "professional development"];
  const equityKeywords = ["equity", "stock options", "rsu", "rsus", "shares", "espp"];
  const designSystemsKeywords = ["design system", "design tokens", "component library", "figma", "storybook", "pattern library"];
  const aiKeywords = ["ai", "artificial intelligence", "llm", "machine learning", "generative ai", "copilot", "ai-powered"];
  const agencyKeywords = ["agency", "consultancy", "consulting", "staffing", "contract-to-hire", "freelance marketplace"];

  // Industry detection (first match wins)
  const industries: { emoji: string; label: string; terms: string[] }[] = [
    { emoji: "🏥", label: "Healthcare", terms: ["healthcare", "health care", "medical", "hospital", "clinical", "patient", "pharma", "biotech", "wellness", "telemedicine", "telehealth", "dental", "behavioral health"] },
    { emoji: "💳", label: "Fintech", terms: ["fintech", "financial", "banking", "payments", "lending", "insurance", "mortgage", "investment", "wealth management", "trading", "crypto", "defi"] },
    { emoji: "👥", label: "HR Tech", terms: ["hr tech", "human resources", "recruiting", "talent management", "payroll", "workforce", "people ops", "benefits administration", "applicant tracking"] },
    { emoji: "🎓", label: "EdTech", terms: ["edtech", "education technology", "e-learning", "elearning", "online learning", "curriculum", "tutoring", "k-12", "higher education"] },
    { emoji: "🛒", label: "E-commerce", terms: ["e-commerce", "ecommerce", "retail", "online marketplace", "shopping", "direct-to-consumer", "dtc", "consumer goods"] },
    { emoji: "🔒", label: "Security", terms: ["cybersecurity", "cyber security", "infosec", "information security", "identity management", "authentication", "zero trust", "soc"] },
    { emoji: "🎮", label: "Gaming", terms: ["gaming", "game studio", "video game", "esports", "interactive entertainment", "mobile game"] },
    { emoji: "✈️", label: "Travel", terms: ["travel", "hospitality", "hotel", "airline", "tourism", "vacation rental", "booking platform"] },
    { emoji: "🏠", label: "Real Estate", terms: ["real estate", "proptech", "property management", "homebuying", "mortgage platform", "mls"] },
    { emoji: "🚚", label: "Logistics", terms: ["logistics", "supply chain", "shipping", "last-mile delivery", "fleet management", "warehousing", "freight"] },
    { emoji: "📡", label: "Telecom", terms: ["telecom", "telecommunications", "wireless", "5g", "broadband", "isp", "mobile network"] },
    { emoji: "📺", label: "Media", terms: ["media", "streaming", "content platform", "publishing", "podcast", "music platform", "video platform", "entertainment"] },
    { emoji: "📊", label: "Data & Analytics", terms: ["data analytics", "business intelligence", "data platform", "data infrastructure", "data warehouse", "bi platform"] },
    { emoji: "🛠️", label: "Dev Tools", terms: ["developer tools", "devops", "developer platform", "ci/cd", "infrastructure platform", "devex", "developer experience"] },
    { emoji: "⚖️", label: "Legal Tech", terms: ["legal tech", "legaltech", "law firm", "legal software", "compliance platform", "regulatory tech"] },
    { emoji: "🍔", label: "Food Tech", terms: ["food delivery", "restaurant tech", "food platform", "meal kit", "grocery delivery", "foodtech"] },
    { emoji: "🏭", label: "Enterprise SaaS", terms: ["enterprise software", "saas platform", "b2b saas", "cloud software", "business software"] },
  ];

  const detectedIndustry = industries.find(({ terms }) => terms.some(t => desc.includes(t)));

  // Business model detection
  const b2bTerms = ["enterprise", "b2b", "for businesses", "for companies", "for teams", "business customers", "smb", "mid-market", "fortune 500", "corporate clients", "saas", "software as a service", "internal tools", "internal tool", "business owners", "small business", "admin dashboard", "operations platform", "underwriting", "procurement", "accounts payable", "accounts receivable", "erp", "crm platform", "hr platform", "payroll platform", "fleet management", "supply chain platform"];
  const b2cTerms = ["b2c", "consumer app", "millions of users", "everyday people", "personal finance", "end consumers", "direct to consumer", "dtc", "mobile app for", "consumer product", "retail customers", "general public", "everyday users"];
  const isB2B = b2bTerms.some(t => desc.includes(t));
  const isB2C = b2cTerms.some(t => desc.includes(t));
  const businessModel = isB2B && isB2C ? { emoji: "🔄", label: "B2B+B2C" }
    : isB2B ? { emoji: "🏢", label: "B2B" }
    : isB2C ? { emoji: "👤", label: "B2C" }
    : null;

  function matchedTerms(keywords: string[]): string {
    const found = keywords.filter(k => desc.includes(k));
    return found.length > 0 ? found.map(k => `"${k}"`).join(", ") : "keyword match";
  }

  const salaryDisplay = job.salary ?? (job.estimated_salary ? `${job.estimated_salary} est.` : null);

  return (
    <>
      {showScoreOverlay && <ScoreOverlay job={job} onClose={() => setShowScoreOverlay(false)} />}

      <div
        className="glass glass-hover rounded-[18px] p-6 cursor-pointer relative overflow-hidden"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button, select")) return;
          router.push(`/listing/${job.id}`);
        }}
      >
        {/* Subtle warm radial halo on hover (matches portfolio work-card pattern) */}
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,.05), transparent 60%)",
          }}
        />

        <div className="relative flex items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            {/* Source eyebrow */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/40">
                {job.source}
              </span>
              {job.posted_date && (
                <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/30">
                  · {formatPostedDate(job.posted_date)}
                </span>
              )}
            </div>

            {/* Title */}
            <Link
              href={`/listing/${job.id}`}
              className="block font-serif text-[22px] font-semibold leading-[1.2] text-white hover:text-[rgba(251,146,60,.95)] transition-colors duration-300 mb-2"
            >
              {job.title}
            </Link>

            {/* Company row */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-4">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(job.company + " official website")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] font-medium text-white/85 hover:text-[rgba(56,189,248,.95)] transition-colors duration-200"
              >
                {job.company}
              </a>
              {job.company_size && job.company_size !== "unknown" && (
                <span className="text-[12px] text-white/45 capitalize">· {job.company_size}</span>
              )}
              <a
                href={glassdoorUrl(job.company)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[rgba(56,189,248,.65)] hover:text-[rgba(56,189,248,1)] transition-colors duration-200"
              >
                Glassdoor ↗
              </a>
              {job.company_rating != null && (
                <span className="text-[12px] text-white/65">
                  {job.company_rating}★
                  {(job.company_red_flags?.length ?? 0) > 0 && (
                    <span className="text-[rgba(251,146,60,.9)] ml-1" title={job.company_red_flags?.join(", ")}>⚠</span>
                  )}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/65 mb-3">
              {job.remote ? (
                <span>🌎 Remote</span>
              ) : (
                job.location && <span>📍 {job.location}</span>
              )}
              {salaryDisplay && (
                <span className={job.salary_below_floor ? "text-[rgba(251,146,60,.95)] font-medium" : "text-white/85 font-medium"}>
                  💰 {salaryDisplay}
                </span>
              )}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5">
              {detectedIndustry && <Chip emoji={detectedIndustry.emoji} label={detectedIndustry.label} tooltip={`Industry: ${detectedIndustry.label}`} />}
              {businessModel && <Chip emoji={businessModel.emoji} label={businessModel.label} variant="sky" tooltip={`Business model: ${businessModel.label}`} />}
              {job.has_benefits_info && <Chip emoji="🔥" label="Benefits" tooltip={`Found: ${matchedTerms(benefitsKeywords)} · +12 pts`} />}
              {job.has_equity && <Chip emoji="📈" label="Equity" variant="orange" tooltip={`Found: ${matchedTerms(equityKeywords)} · +10 pts`} />}
              {job.mentions_design_systems && <Chip emoji="🧩" label="Design Systems" tooltip={`Found: ${matchedTerms(designSystemsKeywords)} · +15 pts`} />}
              {job.mentions_ai && <Chip emoji="🤖" label="AI" variant="sky" tooltip={`Found: ${matchedTerms(aiKeywords)} · +5 pts`} />}
              {job.role_type === "ic" && <Chip emoji="👤" label="IC" tooltip={`"individual contributor" or "no direct reports" found · +3 pts`} />}
              {job.role_type === "management" && <Chip emoji="👥" label="Management" tooltip={`"manage" or "direct reports" found in listing`} />}
              {job.is_agency && <Chip emoji="🏷️" label="Agency" variant="warning" tooltip={`Found: ${matchedTerms(agencyKeywords)} · -10 pts`} />}
              {job.salary_below_floor && (
                <Chip emoji="⚠️" label="Low salary" variant="warning" tooltip={`${salaryDisplay} is below $140K floor · ${job.salary_source === "listed" ? "-15" : "-8"} pts`} />
              )}
            </div>

            {/* AI description summary */}
            {job.ai_description_summary && (
              <p className="mt-5 text-[14px] text-white/65 leading-relaxed">
                {cleanDescription(job.ai_description_summary)}
              </p>
            )}

            {/* AI fit summary */}
            {job.ai_fit_summary && (
              <p className="mt-3 text-[14px] text-white/60 italic font-serif font-light border-l-2 border-[rgba(56,189,248,.25)] pl-3 leading-relaxed">
                {cleanDescription(job.ai_fit_summary)}
              </p>
            )}
          </div>

          {/* Right column — scores (AI first, then base score) */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={() => setShowScoreOverlay(true)}
              className="flex items-center gap-1.5 cursor-pointer group"
              title="Click for score breakdown"
            >
              <ScoreBadge score={job.ai_fit_score ?? null} label="AI" size="sm" />
              <ScoreBadge score={score} size="sm" />
              <span className="text-white/20 group-hover:text-white/55 text-xs transition-colors">ⓘ</span>
            </button>
          </div>
        </div>

        {/* Bottom action row */}
        <div className="relative flex items-center justify-end gap-2.5 mt-5 pt-5 border-t border-white/[0.05]">
          {!isDemo && (
            <>
              <Select
                value={status}
                size="xs"
                onChange={(e) => onStatusChange?.(job.id, e.target.value)}
                className="mr-auto w-auto min-w-[70px]"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </Select>
              <Button
                variant={status === "not_interested" ? "danger" : "ghost-bordered"}
                size="sm"
                onClick={() => onStatusChange?.(job.id, "not_interested")}
              >
                👎 Not a Fit
              </Button>
              <Button
                variant={status === "zombie_listing" ? "warning" : "ghost-bordered"}
                size="sm"
                onClick={() => onStatusChange?.(job.id, "zombie_listing")}
                title="Listing is dead/expired"
              >
                🧟 Zombie
              </Button>
              <AppliedButton
                isApplied={status === "applied"}
                onClick={() => onStatusChange?.(job.id, "applied")}
              />
            </>
          )}
          <LinkButton
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="sm"
          >
            {isDemo ? "👀 View posting →" : "🚀 Apply →"}
          </LinkButton>
        </div>
      </div>
    </>
  );
}
