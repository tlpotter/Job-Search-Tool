"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export const COLUMNS = [
  { key: "save_for_later", label: "Saved", color: "bg-blue-50 border-blue-200", headerColor: "text-blue-700" },
  { key: "applied", label: "Applied", color: "bg-purple-50 border-purple-200", headerColor: "text-purple-700" },
  { key: "interviewing", label: "Interviewing", color: "bg-yellow-50 border-yellow-200", headerColor: "text-yellow-700" },
  { key: "offer", label: "Offer 🎉", color: "bg-green-50 border-green-200", headerColor: "text-green-700" },
  { key: "not_interested", label: "Not Interested / Not a Fit", color: "bg-gray-50 border-gray-200", headerColor: "text-gray-500" },
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
  const [items, setItems] = useState<TrackerItem[]>(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragItem = useRef<TrackerItem | null>(null);

  const byStatus = (colKey: string) => items.filter((i) => i.status === colKey);

  function onDragStart(e: React.DragEvent, item: TrackerItem) {
    dragItem.current = item;
    setDraggingId(item.listing_id);

    // Build a custom drag ghost that sticks to the cursor
    const ghost = document.createElement("div");
    ghost.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: 200px; padding: 10px 12px;
      background: white; border: 1px solid #d1d5db;
      border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      font-family: inherit; pointer-events: none;
    `;
    ghost.innerHTML = `
      <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 2px 0;line-height:1.3">${item.listing.title}</p>
      <p style="font-size:11px;color:#6b7280;margin:0">${item.listing.company}</p>
    `;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 16, 16);
    // Clean up after drag starts
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

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.listing_id === item.listing_id
          ? { ...i, status: colKey, status_changed_at: new Date().toISOString() }
          : i
      )
    );
    setDraggingId(null);
    setDragOverCol(null);

    // Persist
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
            <div className="flex items-center justify-between mb-3">
              <h2 className={`font-semibold text-sm ${col.headerColor}`}>{col.label}</h2>
              <span className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs font-medium text-gray-500">
                {colItems.length}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className={`flex-1 rounded-xl border-2 p-3 transition-colors min-h-32 ${
                isOver
                  ? "border-blue-400 bg-blue-50"
                  : `border ${col.color}`
              }`}
            >
              <div className="space-y-2">
                {colItems.length === 0 && !isOver && (
                  <p className="text-xs text-gray-400 text-center py-6">Drop here</p>
                )}
                {isOver && colItems.length === 0 && (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg h-16 flex items-center justify-center">
                    <p className="text-xs text-blue-400">Move here</p>
                  </div>
                )}
                {colItems.map((item) => (
                  <div
                    key={item.listing_id}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    onDragEnd={onDragEnd}
                    className={`bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all select-none ${
                      draggingId === item.listing_id ? "opacity-40 scale-95" : "hover:shadow-sm"
                    }`}
                  >
                    <Link
                      href={`/listing/${item.listing.id}`}
                      className="block"
                      onClick={(e) => {
                        // Prevent navigation during drag
                        if (draggingId) e.preventDefault();
                      }}
                    >
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {item.listing.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.listing.company}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        {item.listing.relevance_score != null && (
                          <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                            {item.listing.relevance_score}
                          </span>
                        )}
                        {item.listing.ai_fit_score != null && (
                          <span className="text-xs bg-blue-100 text-blue-600 rounded px-1.5 py-0.5">
                            AI: {item.listing.ai_fit_score}
                          </span>
                        )}
                      </div>
                      {item.status_changed_at && (
                        <p className="text-xs text-gray-400 mt-1">
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
