import { type HTMLAttributes } from "react";

export type BadgeVariant =
  | "default"
  | "orange"
  | "sky"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-white/[0.04] border border-white/[0.07] text-white/70",
  orange:
    "bg-[rgba(251,146,60,.1)] border border-[rgba(251,146,60,.2)] text-[rgba(251,180,100,.95)]",
  sky:
    "bg-[rgba(56,189,248,.08)] border border-[rgba(56,189,248,.2)] text-[rgba(56,189,248,.95)]",
  success:
    "bg-[rgba(34,197,94,.1)] border border-[rgba(34,197,94,.25)] text-[rgba(134,239,172,1)]",
  warning:
    "bg-[rgba(251,146,60,.1)] border border-[rgba(251,146,60,.25)] text-[rgba(251,180,100,.95)]",
  danger:
    "bg-[rgba(255,80,80,.1)] border border-[rgba(255,80,80,.25)] text-[rgba(255,180,180,.95)]",
  neutral:
    "bg-white/[0.06] border border-white/[0.1] text-white/60",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-[3px] rounded-md",
        "text-[10px] font-bold tracking-[0.1em] uppercase whitespace-nowrap",
        variantStyles[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
