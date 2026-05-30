"use client";

import { Badge } from "@/components/ui/badge";

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
    return <Badge variant="neutral">⚪ No data</Badge>;
  }

  const flagCount = redFlags?.length ?? 0;
  const r = rating ?? 0;

  if (flagCount >= 2 || r < 3.0) {
    return <Badge variant="danger">🔴 Caution</Badge>;
  }
  if (flagCount === 1 || (r > 0 && r < 4.0)) {
    return <Badge variant="warning">🟡 Mixed</Badge>;
  }
  if (r >= 4.0 && flagCount === 0) {
    return <Badge variant="success">🟢 Strong</Badge>;
  }

  return <Badge variant="neutral">⚪ No data</Badge>;
}
