"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppliedButton } from "./applied-button";
import { useIsDemo } from "./session-provider";
import { Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "not_reviewed", label: "Not reviewed" },
  { value: "save_for_later", label: "Save for Later" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "not_interested", label: "Not Interested / Not a Fit" },
  { value: "zombie_listing", label: "🧟 Zombie Listing" },
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
  const isDemo = useIsDemo();

  async function updateStatus(newStatus: string) {
    if (isDemo) return;
    setSaving(true);
    setStatus(newStatus);
    await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, status: newStatus }),
    });
    setSaving(false);
    if (newStatus === "not_interested" || newStatus === "zombie_listing") router.push("/");
    if (newStatus === "applied") setTimeout(() => router.push("/"), 800);
  }

  if (isDemo) {
    return (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <LinkButton href={applyUrl} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
          👀 View posting →
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <Select
        value={status}
        size="sm"
        onChange={(e) => updateStatus(e.target.value)}
        disabled={saving}
        className="w-[165px]"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>

      <Button
        variant={status === "not_interested" ? "danger" : "ghost-bordered"}
        size="sm"
        disabled={saving}
        onClick={() => updateStatus("not_interested")}
      >
        👎 Not a Fit
      </Button>

      <Button
        variant={status === "zombie_listing" ? "warning" : "ghost-bordered"}
        size="sm"
        disabled={saving}
        onClick={() => updateStatus("zombie_listing")}
        title="Listing is dead/expired"
      >
        🧟 Zombie
      </Button>

      <AppliedButton
        isApplied={status === "applied"}
        disabled={saving}
        onClick={() => updateStatus("applied")}
      />

      <LinkButton href={applyUrl} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
        🚀 Apply →
      </LinkButton>
    </div>
  );
}
