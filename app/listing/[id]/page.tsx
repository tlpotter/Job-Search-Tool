export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CompanyHealthBadge } from "@/components/company-health-badge";
import { ScoreBadge } from "@/components/score-badge";
import { AiScoreButton } from "@/components/ai-score-button";
import { ListingActions } from "@/components/listing-actions";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { cleanDescription } from "@/lib/utils/clean-description";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: job, error } = await supabase
    .from("listings")
    .select(`*, user_actions (status, bookmarked, notes, status_changed_at)`)
    .eq("id", id)
    .single();

  if (error || !job) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="font-serif text-[28px] text-white/55 mb-3">Listing not found</p>
            <Link
              href="/"
              className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[rgba(56,189,248,.8)] hover:text-[rgba(56,189,248,1)] transition-colors"
            >
              ← Back to feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // user_actions is returned as an array by Supabase joins — normalize it
  const userActions = Array.isArray(job.user_actions) ? job.user_actions[0] : job.user_actions;
  const initialStatus = userActions?.status;

  const salaryDisplay = job.salary
    ? `${job.salary} (listed)`
    : job.estimated_salary
      ? `~${job.estimated_salary} (estimated)`
      : "Not available";

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
      <dt className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/45 shrink-0">{label}</dt>
      <dd className="text-[14px] text-white/85 text-right">{children}</dd>
    </div>
  );

  return (
    <div className="min-h-screen">
      <AppHeader />

      <div className="max-w-[1024px] mx-auto px-6 md:px-10 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] uppercase text-[rgba(56,189,248,.75)] hover:text-[rgba(56,189,248,1)] transition-colors duration-300 group"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Back to feed
        </Link>
      </div>

      <div className="max-w-[1024px] mx-auto px-6 md:px-10 py-8 space-y-6">

        {/* Header card */}
        <div className="glass rounded-3xl p-8 md:p-10">
          <div className="eyebrow mb-3">{job.source}</div>
          <h1 className="font-serif text-[clamp(28px,3.5vw,42px)] font-semibold leading-[1.1] text-white mb-3">
            {job.title}
          </h1>
          <p className="text-[18px] text-white/70 mb-5">{job.company}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            <ScoreBadge score={job.relevance_score ?? 0} />
            {job.ai_fit_score != null && (
              <ScoreBadge score={job.ai_fit_score} label="AI Fit" />
            )}
            <CompanyHealthBadge
              rating={job.company_rating}
              redFlags={job.company_red_flags}
              reputationAvailable={job.company_reputation_available}
            />
          </div>

          <div className="pt-5 border-t border-white/[0.06]">
            <ListingActions
              listingId={job.id}
              applyUrl={job.url}
              initialStatus={initialStatus}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Job details */}
          <div className="glass rounded-2xl p-7 space-y-1">
            <div className="eyebrow mb-4 !text-[11px]">Job Details</div>
            <dl>
              <Row label="Location">{job.location}{job.remote ? " (Remote)" : ""}</Row>
              <Row label="Salary">
                <span className={job.salary_below_floor ? "text-[rgba(251,180,100,.95)] font-medium" : ""}>
                  {salaryDisplay}
                  {job.salary_below_floor && " ⚠️"}
                </span>
              </Row>
              <Row label="Posted">{job.posted_date ?? "Unknown"}</Row>
              <Row label="Source"><span className="capitalize">{job.source}</span></Row>
              <Row label="Role type"><span className="capitalize">{job.role_type ?? "Unknown"}</span></Row>
              <Row label="Company size"><span className="capitalize">{job.company_size ?? "Unknown"}</span></Row>
            </dl>

            <div className="flex flex-wrap gap-1.5 pt-4">
              {job.has_benefits_info && <Badge>🔥 Benefits</Badge>}
              {job.has_equity && <Badge variant="orange">📈 Equity</Badge>}
              {job.mentions_design_systems && <Badge>🧩 Design Systems</Badge>}
              {job.mentions_ai && <Badge variant="sky">🤖 AI</Badge>}
              {job.is_agency && <Badge variant="warning">🏷️ Agency</Badge>}
            </div>
          </div>

          {/* Company reputation */}
          <div className="glass rounded-2xl p-7 space-y-1">
            <div className="eyebrow mb-4 !text-[11px]">Company</div>
            {job.company_reputation_available ? (
              <dl>
                {job.company_rating != null && <Row label="Glassdoor">{job.company_rating}/5.0</Row>}
                {job.company_wlb != null && <Row label="Work-life balance">{job.company_wlb}/5.0</Row>}
                <Row label="Growth trend"><span className="capitalize">{job.company_growth_trend ?? "Unknown"}</span></Row>
                {job.company_headcount != null && <Row label="Headcount">{job.company_headcount.toLocaleString()}</Row>}
                {job.company_red_flags && job.company_red_flags.length > 0 && (
                  <div className="pt-3">
                    <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/45 mb-2">Red Flags</div>
                    <ul className="space-y-1.5">
                      {job.company_red_flags.map((flag: string) => (
                        <li key={flag} className="text-[13px] text-[rgba(255,180,180,.95)] flex items-start gap-2">
                          <span className="mt-0.5">⚠️</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-[13px] text-white/40">No reputation data available</p>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        <AiScoreButton
          listingId={job.id}
          initialScore={job.ai_fit_score}
          initialSummary={job.ai_fit_summary}
          initialGaps={job.ai_skill_gaps}
          initialHighlights={job.ai_highlights}
        />

        {/* Description */}
        {job.description && (
          <div className="glass rounded-2xl p-7">
            <div className="eyebrow mb-4 !text-[11px]">Description</div>
            <div className="text-[15px] text-white/75 whitespace-pre-wrap leading-[1.85] max-h-[480px] overflow-y-auto pr-2">
              {cleanDescription(job.description)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
