"use client";

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, label = "Score", size = "md" }: ScoreBadgeProps) {
  const isAI = label === "AI" || label === "AI Fit";

  // Colors swapped from prior version: Score now sky, AI now green.
  const tone =
    score >= 70
      ? isAI
        ? "bg-[rgba(34,197,94,.12)] border-[rgba(34,197,94,.3)] text-[rgba(134,239,172,1)]"
        : "bg-[rgba(56,189,248,.14)] border-[rgba(56,189,248,.35)] text-[rgba(56,189,248,1)]"
      : score >= 40
        ? isAI
          ? "bg-[rgba(34,197,94,.08)] border-[rgba(34,197,94,.25)] text-[rgba(134,239,172,.95)]"
          : "bg-[rgba(56,189,248,.08)] border-[rgba(56,189,248,.2)] text-[rgba(125,211,252,.95)]"
        : "bg-white/[0.05] border-white/[0.1] text-white/55";

  // 50% larger than the original sm/md
  const padding =
    size === "sm"
      ? "px-3 py-1 text-[13px] tracking-[0.08em]"
      : size === "lg"
        ? "px-4 py-1.5 text-[17px] tracking-[0.06em]"
        : "px-3.5 py-1.5 text-[15px] tracking-[0.06em]";

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
