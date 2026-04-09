export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CompanyHealthBadge } from "@/components/company-health-badge";
import { ScoreBadge } from "@/components/score-badge";
import { AiScoreButton } from "@/components/ai-score-button";
import { ListingActions } from "@/components/listing-actions";
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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-base-content/50 text-lg">Listing not found</p>
          <Link href="/" className="text-primary text-sm mt-2 inline-block hover:underline">
            ← Back to feed
          </Link>
        </div>
      </div>
    );
  }

  const salaryDisplay = job.salary
    ? `${job.salary} (listed)`
    : job.estimated_salary
      ? `~${job.estimated_salary} (estimated)`
      : "Not available";

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 border-b border-base-300 px-6">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost btn-sm text-primary">← Back</Link>
          <span className="mx-3 text-base-content/20">·</span>
          <span className="text-base font-semibold">UX Job Crawler</span>
        </div>
        <div className="navbar-end gap-2">
          <Link href="/" className="btn btn-ghost btn-sm text-base-content/60">Feed</Link>
          <Link href="/tracker" className="btn btn-ghost btn-sm text-base-content/60">Tracker</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header card */}
        <div className="card card-bordered bg-base-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">{job.title}</h1>
              <p className="text-lg text-base-content/70 mt-1">{job.company}</p>
              <div className="flex flex-wrap gap-2 mt-3">
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
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ListingActions
                listingId={job.id}
                applyUrl={job.url}
                initialStatus={job.user_actions?.status}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Job details */}
          <div className="card card-bordered bg-base-100 p-5 space-y-4">
            <h2 className="font-semibold text-base-content">Job Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-base-content/50">Location</dt>
                <dd className="text-base-content">{job.location}{job.remote ? " (Remote)" : ""}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/50">Salary</dt>
                <dd className={job.salary_below_floor ? "text-warning font-medium" : "text-base-content"}>
                  {salaryDisplay}
                  {job.salary_below_floor && " ⚠️"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/50">Posted</dt>
                <dd className="text-base-content">{job.posted_date ?? "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/50">Source</dt>
                <dd className="text-base-content capitalize">{job.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/50">Role type</dt>
                <dd className="text-base-content capitalize">{job.role_type ?? "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-base-content/50">Company size</dt>
                <dd className="text-base-content capitalize">{job.company_size ?? "Unknown"}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {job.has_benefits_info && <span className="badge badge-ghost badge-sm">🔥 Benefits</span>}
              {job.has_equity && <span className="badge badge-ghost badge-sm">📈 Equity</span>}
              {job.mentions_design_systems && <span className="badge badge-ghost badge-sm">🧩 Design Systems</span>}
              {job.mentions_ai && <span className="badge badge-ghost badge-sm">🤖 AI</span>}
              {job.is_agency && <span className="badge badge-outline badge-sm">🏷️ Agency</span>}
            </div>
          </div>

          {/* Company reputation */}
          <div className="card card-bordered bg-base-100 p-5 space-y-4">
            <h2 className="font-semibold text-base-content">Company</h2>
            {job.company_reputation_available ? (
              <dl className="space-y-2 text-sm">
                {job.company_rating != null && (
                  <div className="flex justify-between">
                    <dt className="text-base-content/50">Glassdoor rating</dt>
                    <dd className="text-base-content">{job.company_rating}/5.0</dd>
                  </div>
                )}
                {job.company_wlb != null && (
                  <div className="flex justify-between">
                    <dt className="text-base-content/50">Work-life balance</dt>
                    <dd className="text-base-content">{job.company_wlb}/5.0</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-base-content/50">Growth trend</dt>
                  <dd className="text-base-content capitalize">{job.company_growth_trend ?? "Unknown"}</dd>
                </div>
                {job.company_headcount != null && (
                  <div className="flex justify-between">
                    <dt className="text-base-content/50">Headcount</dt>
                    <dd className="text-base-content">{job.company_headcount.toLocaleString()}</dd>
                  </div>
                )}
                {job.company_red_flags && job.company_red_flags.length > 0 && (
                  <div>
                    <dt className="text-base-content/50 mb-1 block">Red flags</dt>
                    <ul className="space-y-1">
                      {job.company_red_flags.map((flag: string) => (
                        <li key={flag} className="text-error text-xs flex items-center gap-1">
                          ⚠️ {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-base-content/40">No reputation data available</p>
            )}
          </div>
        </div>

        {/* AI Analysis — always shown, button if not yet scored */}
        <AiScoreButton
          listingId={job.id}
          initialScore={job.ai_fit_score}
          initialSummary={job.ai_fit_summary}
          initialGaps={job.ai_skill_gaps}
          initialHighlights={job.ai_highlights}
        />

        {/* Description */}
        {job.description && (
          <div className="card card-bordered bg-base-100 p-5">
            <h2 className="font-semibold text-base-content mb-3">Description</h2>
            <div className="text-sm text-base-content/70 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {cleanDescription(job.description)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
