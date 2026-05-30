"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useIsDemo } from "./session-provider";

export const COLUMNS = [
  { key: "save_for_later", label: "Saved", accent: "rgba(56,189,248,.7)" },
  { key: "applied", label: "Applied", accent: "rgba(168,85,247,.7)" },
  { key: "interviewing", label: "Interviewing", accent: "rgba(251,191,36,.7)" },
  { key: "offer", label: "Offer 🎉", accent: "rgba(34,197,94,.75)" },
  { key: "not_interested", label: "Not a Fit", accent: "rgba(255,255,255,.3)" },
];

export interface TrackerItem {
  listing_id: string;
  status: string;
  status_changed_at: string | null;
  listing: {
    id: string;
    title: string;
    company: string;
    relevance_score?: number | null;
    ai_fit_score?: number | null;
    url: string;
  };
}

interface TrackerBoardProps {
  initialItems: TrackerItem[];
}

export function TrackerBoard({ initialItems }: TrackerBoardProps) {
  const isDemo = useIsDemo();
  const [items, setItems] = useState<TrackerItem[]>(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragItem = useRef<TrackerItem | null>(null);

  const byStatus = (colKey: string) => items.filter((i) => i.status === colKey);

  function onDragStart(e: React.DragEvent, item: TrackerItem) {
    if (isDemo) {
      e.preventDefault();
      return;
    }
    dragItem.current = item;
    setDraggingId(item.listing_id);

    // Custom drag ghost styled for dark theme
    const ghost = document.createElement("div");
    ghost.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: 220px; padding: 12px 14px;
      background: rgba(20,24,32,0.95); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.5);
      backdrop-filter: blur(20px);
      font-family: inherit; color: white; pointer-events: none;
    `;
    ghost.innerHTML = `
      <p style="font-family:'Fraunces',Georgia,serif;font-size:14px;font-weight:600;color:#fff;margin:0 0 4px 0;line-height:1.3">${item.listing.title}</p>
      <p style="font-size:12px;color:rgba(255,255,255,0.55);margin:0">${item.listing.company}</p>
    `;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 16, 16);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
    dragItem.current = null;
  }

  function onDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    setDragOverCol(colKey);
  }

  async function onDrop(colKey: string) {
    const item = dragItem.current;
    if (!item || item.status === colKey) {
      setDraggingId(null);
      setDragOverCol(null);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.listing_id === item.listing_id
          ? { ...i, status: colKey, status_changed_at: new Date().toISOString() }
          : i
      )
    );
    setDraggingId(null);
    setDragOverCol(null);

    await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: item.listing_id, status: colKey }),
    });
  }

  return (
    <div className="flex gap-4 h-full">
      {COLUMNS.map((col) => {
        const colItems = byStatus(col.key);
        const isOver = dragOverCol === col.key;

        return (
          <div
            key={col.key}
            className="flex-1 min-w-0 flex flex-col"
            onDragOver={(e) => onDragOver(e, col.key)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => onDrop(col.key)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-block w-[18px] h-[1px]"
                  style={{ background: col.accent }}
                />
                <h2
                  className="text-[12px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: col.accent }}
                >
                  {col.label}
                </h2>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-white/40">
                {colItems.length}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className={[
                "flex-1 rounded-2xl p-3 transition-all duration-200 min-h-32 border",
                isOver
                  ? "bg-[rgba(56,189,248,.05)] border-[rgba(56,189,248,.35)]"
                  : "bg-white/[0.02] border-white/[0.05]",
              ].join(" ")}
            >
              <div className="space-y-2.5">
                {colItems.length === 0 && !isOver && (
                  <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/20 text-center py-8">
                    Empty
                  </p>
                )}
                {isOver && colItems.length === 0 && (
                  <div className="border border-dashed border-[rgba(56,189,248,.4)] rounded-xl h-16 flex items-center justify-center">
                    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[rgba(56,189,248,.7)]">
                      Drop here
                    </p>
                  </div>
                )}
                {colItems.map((item) => (
                  <div
                    key={item.listing_id}
                    draggable={!isDemo}
                    onDragStart={(e) => onDragStart(e, item)}
                    onDragEnd={onDragEnd}
                    className={[
                      "glass rounded-xl p-3 transition-all select-none",
                      isDemo ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                      draggingId === item.listing_id
                        ? "opacity-40 scale-95"
                        : "hover:bg-white/[0.07]",
                    ].join(" ")}
                  >
                    <Link
                      href={`/listing/${item.listing.id}`}
                      className="block"
                      onClick={(e) => {
                        if (draggingId) e.preventDefault();
                      }}
                    >
                      <p className="font-serif text-[14px] font-semibold text-white leading-tight">
                        {item.listing.title}
                      </p>
                      <p className="text-[12px] text-white/55 mt-1">
                        {item.listing.company}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.listing.relevance_score != null && (
                          <span className="text-[10px] font-semibold tracking-[0.06em] bg-white/[0.06] border border-white/[0.08] text-white/70 rounded px-1.5 py-0.5">
                            {item.listing.relevance_score}
                          </span>
                        )}
                        {item.listing.ai_fit_score != null && (
                          <span className="text-[10px] font-semibold tracking-[0.06em] bg-[rgba(56,189,248,.1)] border border-[rgba(56,189,248,.25)] text-[rgba(125,211,252,1)] rounded px-1.5 py-0.5">
                            AI {item.listing.ai_fit_score}
                          </span>
                        )}
                      </div>
                      {item.status_changed_at && (
                        <p className="text-[10px] text-white/30 mt-2 tracking-[0.04em]">
                          {new Date(item.status_changed_at).toLocaleDateString()}
                        </p>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
