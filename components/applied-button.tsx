"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";

interface AppliedButtonProps {
  isApplied: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}

function burst(x: number, y: number, colors: string[]) {
  confetti({
    particleCount: 70,
    spread: 360,
    origin: { x, y },
    startVelocity: 28,
    gravity: 0.6,
    scalar: 0.75,
    ticks: 180,
    shapes: ["circle"],
    colors,
  });
}

function fireConfetti() {
  // Staggered firework bursts — portfolio palette
  const PALETTE_A = ["#fb923c", "#f97316", "#ffdd88", "#ffffff"];
  const PALETTE_B = ["#22c55e", "#38bdf8", "#00d4ff", "#ffffff"];
  const PALETTE_C = ["#fb923c", "#38bdf8", "#a855f7", "#ffffff"];

  burst(0.25, 0.25, PALETTE_A);
  setTimeout(() => burst(0.75, 0.2, PALETTE_B), 200);
  setTimeout(() => burst(0.5, 0.15, PALETTE_C), 400);
  setTimeout(() => burst(0.15, 0.35, PALETTE_B), 550);
  setTimeout(() => burst(0.85, 0.3, PALETTE_A), 700);
  setTimeout(() => burst(0.5, 0.28, PALETTE_A), 900);
}

const sizeStyles = {
  sm: "px-4 py-1.5 text-[13px] gap-1.5 rounded-lg",
  md: "px-7 py-3 text-base gap-2 rounded-[10px]",
};

export function AppliedButton({ isApplied, disabled, onClick, size = "sm" }: AppliedButtonProps) {
  const [justClicked, setJustClicked] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const showApplied = isApplied || justClicked;

  useEffect(() => {
    if (!justClicked || !btnRef.current) return;
    btnRef.current.animate(
      [
        { transform: "scale(0.85)", opacity: "0.7", boxShadow: "0 0 0 0px rgba(34,197,94,0.6)" },
        { transform: "scale(1.18)", opacity: "1",   boxShadow: "0 0 0 8px rgba(34,197,94,0.15)", offset: 0.45 },
        { transform: "scale(0.95)",                  boxShadow: "0 0 0 12px rgba(34,197,94,0)",  offset: 0.7 },
        { transform: "scale(1)",                     boxShadow: "0 0 0 14px rgba(34,197,94,0)" },
      ],
      { duration: 500, easing: "ease-out", fill: "forwards" }
    );
  }, [justClicked]);

  function handleClick() {
    if (showApplied || disabled) return;
    setJustClicked(true);
    fireConfetti();
    onClick();
  }

  const base =
    "inline-flex items-center justify-center font-semibold tracking-[0.02em] border transition-all duration-300 ease-out backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

  if (showApplied) {
    return (
      <button
        ref={btnRef}
        disabled={disabled}
        className={`${base} ${sizeStyles[size]} bg-[rgba(34,197,94,.15)] border-[rgba(34,197,94,.4)] text-[rgba(150,255,180,1)]`}
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8.5l3.5 3.5 6.5-7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Applied!
      </button>
    );
  }

  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={`${base} ${sizeStyles[size]} bg-transparent hover:bg-white/[0.04] border-white/10 hover:border-white/20 text-white/70 hover:text-white`}
    >
      ✋ I Applied
    </button>
  );
}
