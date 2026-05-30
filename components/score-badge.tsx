"use client";

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md";
}

export function ScoreBadge({ score, label = "Score", size = "md" }: ScoreBadgeProps) {
  const isAI = label === "AI" || label === "AI Fit";

  // Portfolio-tone status colors (orange/sky/muted)
  const tone =
    score >= 70
      ? isAI
        ? "bg-[rgba(56,189,248,.14)] border-[rgba(56,189,248,.35)] text-[rgba(56,189,248,1)]"
        : "bg-[rgba(34,197,94,.12)] border-[rgba(34,197,94,.3)] text-[rgba(134,239,172,1)]"
      : score >= 40
        ? isAI
          ? "bg-[rgba(56,189,248,.08)] border-[rgba(56,189,248,.2)] text-[rgba(125,211,252,.95)]"
          : "bg-[rgba(251,146,60,.1)] border-[rgba(251,146,60,.25)] text-[rgba(251,180,100,.95)]"
        : "bg-white/[0.05] border-white/[0.1] text-white/55";

  const padding =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] tracking-[0.08em]"
      : "px-2.5 py-1 text-[11px] tracking-[0.06em]";

  return (
    <span
      className={[
        "inline-flex items-center font-semibold uppercase rounded-md border whitespace-nowrap",
        tone,
        padding,
      ].join(" ")}
    >
      {label}: {score}
    </span>
  );
}
