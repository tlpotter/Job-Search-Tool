"use client";

import { useState } from "react";
import { ScoreBadge } from "./score-badge";
import { useIsDemo } from "./session-provider";
import { Button } from "@/components/ui/button";

interface AiScoreResult {
  fitScore: number;
  summary: string;
  gaps: string[];
  highlights: string[];
  scoreRole?: number | null;
  scoreCompany?: number | null;
  scoreComp?: number | null;
  scoreIndustry?: number | null;
  scoreGrowth?: number | null;
}

const AXIS_LABELS: { key: keyof AiScoreResult; label: string; weight: number }[] = [
  { key: "scoreRole",     label: "Role & skills",    weight: 0.35 },
  { key: "scoreCompany",  label: "Company health",   weight: 0.25 },
  { key: "scoreComp",     label: "Compensation",     weight: 0.15 },
  { key: "scoreIndustry", label: "Industry fit",     weight: 0.15 },
  { key: "scoreGrowth",   label: "Growth signals",   weight: 0.10 },
];

function axisTone(score: number): string {
  if (score >= 75) return "text-[rgba(134,239,172,1)]";
  if (score >= 55) return "text-[rgba(125,211,252,1)]";
  if (score >= 40) return "text-[rgba(251,180,100,.95)]";
  return "text-[rgba(255,180,180,.95)]";
}

function ScoreBreakdown({ result }: { result: AiScoreResult }) {
  const any = AXIS_LABELS.some((a) => result[a.key] != null);
  if (!any) return null;

  return (
    <div>
      <div className="eyebrow mb-3 !text-[11px]">Score breakdown</div>
      <div className="space-y-2">
        {AXIS_LABELS.map(({ key, label, weight }) => {
          const score = result[key] as number | null | undefined;
          if (score == null) return null;
          const pct = `${Math.round(weight * 100)}%`;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-[140px] shrink-0 text-[13px] text-white/70">
                {label}
                <span className="text-white/30 ml-2 text-[11px]">{pct}</span>
              </div>
              <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score}%`,
                    background:
                      score >= 75
                        ? "linear-gradient(90deg, rgba(34,197,94,.6), rgba(134,239,172,.9))"
                        : score >= 55
                          ? "linear-gradient(90deg, rgba(56,189,248,.6), rgba(125,211,252,.9))"
                          : score >= 40
                            ? "linear-gradient(90deg, rgba(251,146,60,.6), rgba(251,180,100,.9))"
                            : "linear-gradient(90deg, rgba(255,80,80,.5), rgba(255,180,180,.85))",
                  }}
                />
              </div>
              <div className={`w-9 shrink-0 text-right text-[13px] font-semibold tabular-nums ${axisTone(score)}`}>
                {score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AiScoreButton({
  listingId,
  initialScore,
  initialSummary,
  initialGaps,
  initialHighlights,
  initialBreakdown,
}: {
  listingId: string;
  initialScore?: number | null;
  initialSummary?: string | null;
  initialGaps?: string[] | null;
  initialHighlights?: string[] | null;
  initialBreakdown?: {
    scoreRole?: number | null;
    scoreCompany?: number | null;
    scoreComp?: number | null;
    scoreIndustry?: number | null;
    scoreGrowth?: number | null;
  };
}) {
  const isDemo = useIsDemo();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiScoreResult | null>(
    initialScore != null
      ? {
          fitScore: initialScore,
          summary: initialSummary ?? "",
          gaps: initialGaps ?? [],
          highlights: initialHighlights ?? [],
          ...initialBreakdown,
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);

  async function runScore() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="glass rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow !text-[11px]">AI Fit Analysis</div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge score={result.fitScore} label="AI Fit" />
            {!isDemo && (
              <button
                onClick={runScore}
                disabled={loading}
                className="w-7 h-7 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors inline-flex items-center justify-center text-sm"
                title="Re-run AI scoring"
              >
                {loading ? "…" : "↺"}
              </button>
            )}
          </div>
        </div>

        <ScoreBreakdown result={result} />

        {result.summary && (
          <p className="text-[17px] text-white/85 border-l-2 border-[rgba(56,189,248,.35)] pl-4 leading-relaxed">
            {result.summary}
          </p>
        )}

        {result.highlights.length > 0 && (
          <div>
            <div className="eyebrow !text-[rgba(134,239,172,.85)] mb-3 !text-[11px]">
              Strengths
            </div>
            <ul className="space-y-1.5">
              {result.highlights.map((h, i) => (
                <li key={i} className="text-[14px] text-white/80 flex items-start gap-2">
                  <span className="text-[rgba(134,239,172,1)] mt-1 shrink-0">✓</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.gaps.length > 0 && (
          <div>
            <div className="eyebrow mb-3 !text-[11px]">Skill Gaps</div>
            <ul className="space-y-1.5">
              {result.gaps.map((g, i) => (
                <li key={i} className="text-[14px] text-white/80 flex items-start gap-2">
                  <span className="text-[rgba(251,180,100,.95)] mt-1 shrink-0">⚠</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (isDemo) return null;

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow !text-[11px] mb-2">AI Fit Analysis</div>
          <p className="text-[13px] text-white/40">Not yet scored</p>
        </div>
        <Button onClick={runScore} disabled={loading} size="sm">
          {loading ? "Running…" : "Run AI Score"}
        </Button>
      </div>
      {error && (
        <p className="text-[13px] text-[rgba(255,180,180,.95)] mt-3">{error}</p>
      )}
    </div>
  );
}
