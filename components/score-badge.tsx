"use client";

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md";
}

export function ScoreBadge({ score, label = "Score", size = "md" }: ScoreBadgeProps) {
  const isAI = label === "AI" || label === "AI Fit";

  const color = isAI
    ? score >= 70
      ? "bg-violet-600 text-white"
      : score >= 40
        ? "bg-violet-400 text-white"
        : "bg-violet-200 text-violet-800"
    : score >= 70
      ? "bg-green-600 text-white"
      : score >= 40
        ? "bg-yellow-500 text-white"
        : "bg-gray-400 text-white";

  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${padding}`}>
      {label}: {score}
    </span>
  );
}
