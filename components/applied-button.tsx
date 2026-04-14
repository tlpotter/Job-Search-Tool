"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";

interface AppliedButtonProps {
  isApplied: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}

function fireConfetti() {
  // Two cannon bursts from the top corners
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.1, y: 0.1 },
    colors: ["#22c55e", "#16a34a", "#86efac", "#ffffff", "#fbbf24"],
    startVelocity: 55,
    gravity: 0.8,
    ticks: 200,
  });
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.9, y: 0.1 },
    colors: ["#22c55e", "#16a34a", "#86efac", "#ffffff", "#fbbf24"],
    startVelocity: 55,
    gravity: 0.8,
    ticks: 200,
  });
  // A third burst from the center for good measure
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { x: 0.5, y: 0.2 },
      colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#ffffff"],
      startVelocity: 40,
      gravity: 0.9,
      ticks: 180,
    });
  }, 150);
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
