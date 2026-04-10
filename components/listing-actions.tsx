"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppliedButton } from "./applied-button";

const STATUS_OPTIONS = [
  { value: "not_reviewed", label: "Not reviewed" },
  { value: "save_for_later", label: "Save for Later" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "not_interested", label: "Not Interested / Not a Fit" },
];

interface ListingActionsProps {
  listingId: string;
  applyUrl: string;
  initialStatus?: string | null;
}

export function ListingActions({ listingId, applyUrl, initialStatus }: ListingActionsProps) {
  const [status, setStatus] = useState(initialStatus ?? "not_reviewed");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    setSaving(true);
    setStatus(newStatus);
    await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, status: newStatus }),
    });
    setSaving(false);
    if (newStatus === "not_interested") router.push("/");
    if (newStatus === "applied") setTimeout(() => router.push("/"), 800);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={saving}
        className="select select-bordered select-sm border-base-300 w-auto"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <button
        onClick={() => updateStatus("not_interested")}
        disabled={saving}
        className={`btn btn-sm ${status === "not_interested" ? "btn-error btn-outline" : "btn-ghost border border-base-300"}`}
      >
        Not Interested
      </button>

      <AppliedButton
        isApplied={status === "applied"}
        disabled={saving}
        onClick={() => updateStatus("applied")}
      />

      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary btn-sm"
      >
        Apply →
      </a>
    </div>
  );
}
