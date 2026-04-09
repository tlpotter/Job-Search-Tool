"use client";

interface CompanyHealthBadgeProps {
  rating?: number | null;
  redFlags?: string[] | null;
  reputationAvailable?: boolean | null;
}

export function CompanyHealthBadge({
  rating,
  redFlags,
  reputationAvailable,
}: CompanyHealthBadgeProps) {
  if (!reputationAvailable) {
    return <span className="text-gray-400 text-xs">⚪ No data</span>;
  }

  const flagCount = redFlags?.length ?? 0;
  const r = rating ?? 0;

  if (flagCount >= 2 || r < 3.0) {
    return <span className="text-red-600 text-xs font-medium">🔴 Caution</span>;
  }
  if (flagCount === 1 || (r > 0 && r < 4.0)) {
    return <span className="text-yellow-600 text-xs font-medium">🟡 Mixed</span>;
  }
  if (r >= 4.0 && flagCount === 0) {
    return <span className="text-green-600 text-xs font-medium">🟢 Strong</span>;
  }

  return <span className="text-gray-400 text-xs">⚪ No data</span>;
}
