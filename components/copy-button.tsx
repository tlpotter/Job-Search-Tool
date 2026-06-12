"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copy description", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  return (
    <button
      onClick={handleClick}
      title={label}
      aria-label={label}
      className={[
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
        "text-[11px] font-semibold tracking-[0.08em] uppercase",
        "border transition-colors duration-200",
        copied
          ? "bg-[rgba(34,197,94,.12)] border-[rgba(34,197,94,.3)] text-[rgba(134,239,172,1)]"
          : "bg-white/[0.04] border-white/[0.08] text-white/55 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15]",
        className,
      ].join(" ")}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.5 3.5 6.5-7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}
