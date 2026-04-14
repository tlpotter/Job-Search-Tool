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
  // Staggered firework bursts across the top of the screen
  const PALETTE_A = ["#ff4444", "#ff8800", "#ffdd00", "#ffffff"];
  const PALETTE_B = ["#22c55e", "#00cfff", "#a855f7", "#ffffff"];
  const PALETTE_C = ["#f472b6", "#fbbf24", "#60a5fa", "#ffffff"];

  burst(0.25, 0.25, PALETTE_A);

  setTimeout(() => burst(0.75, 0.2, PALETTE_B), 200);
  setTimeout(() => burst(0.5,  0.15, PALETTE_C), 400);
  setTimeout(() => burst(0.15, 0.35, PALETTE_B), 550);
  setTimeout(() => burst(0.85, 0.3,  PALETTE_A), 700);
  setTimeout(() => burst(0.5,  0.28, PALETTE_A), 900);
}

export function AppliedButton({ isApplied, disabled, onClick, size = "sm" }: AppliedButtonProps) {
  const [justClicked, setJustClicked] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sizeClass = size === "sm" ? "btn-sm" : "";
  const showApplied = isApplied || justClicked;

  // Button pulse animation
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

  if (showApplied) {
    return (
      <button
        ref={btnRef}
        disabled={disabled}
        className={`btn ${sizeClass} btn-success`}
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
      className={`btn ${sizeClass} btn-ghost border border-base-300`}
    >
      I Applied
    </button>
  );
}
