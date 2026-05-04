"use client";

import { useState } from "react";
import { ScoreBadge } from "./score-badge";
import { useIsDemo } from "./session-provider";

interface AiScoreResult {
  fitScore: number;
  summary: string;
  gaps: string[];
  highlights: string[];
}

export function AiScoreButton({
  listingId,
  initialScore,
  initialSummary,
  initialGaps,
  initialHighlights,
}: {
  listingId: string;
  initialScore?: number | null;
  initialSummary?: string | null;
  initialGaps?: string[] | null;
  initialHighlights?: string[] | null;
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
      <div className="card card-bordered bg-base-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base-content">AI Fit Analysis</h2>
          <div className="flex items-center gap-2">
            <ScoreBadge score={result.fitScore} label="AI Fit" />
            {!isDemo && (
              <button
                onClick={runScore}
                disabled={loading}
                className="btn btn-ghost btn-xs text-base-content/50"
                title="Re-run AI scoring"
              >
                {loading ? "..." : "↺"}
              </button>
            )}
          </div>
        </div>

        {result.summary && (
          <p className="text-sm text-base-content/70 italic border-l-2 border-primary/30 pl-3 leading-snug">
            {result.summary}
          </p>
        )}

        {result.highlights.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-success uppercase tracking-wide mb-2">Strengths</p>
            <ul className="space-y-1">
              {result.highlights.map((h, i) => (
                <li key={i} className="text-sm text-base-content/80 flex items-start gap-1.5">
                  <span className="text-success mt-0.5 shrink-0">✓</span> {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.gaps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-warning uppercase tracking-wide mb-2">Skill Gaps</p>
            <ul className="space-y-1">
              {result.gaps.map((g, i) => (
                <li key={i} className="text-sm text-base-content/80 flex items-start gap-1.5">
                  <span className="text-warning mt-0.5 shrink-0">⚠</span> {g}
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
    <div className="card card-bordered bg-base-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base-content">AI Fit Analysis</h2>
          <p className="text-sm text-base-content/50 mt-0.5">Not yet scored</p>
        </div>
        <button
          onClick={runScore}
          disabled={loading}
          className="btn btn-primary btn-sm"
        >
          {loading ? <span className="loading loading-spinner loading-xs" /> : "Run AI Score"}
        </button>
      </div>
      {error && <p className="text-sm text-error mt-3">{error}</p>}
    </div>
  );
}
