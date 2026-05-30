import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "ghost"
  | "ghost-bordered"
  | "danger"
  | "warning"
  | "success";
export type ButtonSize = "xs" | "sm" | "md";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,rgba(251,146,60,.4),rgba(249,115,22,.4))] hover:bg-[linear-gradient(135deg,rgba(251,146,60,.6),rgba(249,115,22,.6))] border-[rgba(251,146,60,.5)] text-white shadow-[0_4px_20px_rgba(251,146,60,.2)] hover:shadow-[0_8px_32px_rgba(251,146,60,.35)] hover:-translate-y-0.5",
  ghost:
    "bg-[rgba(56,189,248,.06)] hover:bg-[rgba(56,189,248,.12)] border-[rgba(56,189,248,.2)] text-white/85 hover:text-white hover:-translate-y-0.5",
  "ghost-bordered":
    "bg-transparent hover:bg-white/[0.04] border-white/10 hover:border-white/20 text-white/70 hover:text-white",
  danger:
    "bg-[rgba(255,80,80,.12)] hover:bg-[rgba(255,80,80,.2)] border-[rgba(255,80,80,.3)] hover:border-[rgba(255,80,80,.5)] text-[rgba(255,180,180,.95)] hover:text-white",
  warning:
    "bg-[rgba(251,146,60,.1)] hover:bg-[rgba(251,146,60,.2)] border-[rgba(251,146,60,.3)] hover:border-[rgba(251,146,60,.5)] text-[rgba(251,180,100,.95)] hover:text-white",
  success:
    "bg-[rgba(34,197,94,.15)] hover:bg-[rgba(34,197,94,.25)] border-[rgba(34,197,94,.4)] text-[rgba(150,255,180,1)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-3 py-1 text-[11px] gap-1 rounded-md tracking-[0.06em] uppercase font-semibold",
  sm: "px-4 py-1.5 text-[13px] gap-1.5 rounded-lg",
  md: "px-7 py-3 text-base gap-2 rounded-[10px]",
};

const base =
  "inline-flex items-center justify-center font-semibold tracking-[0.02em] border transition-all duration-300 ease-out backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      className={[base, variantStyles[variant], sizeStyles[size], className].join(" ")}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => (
    <a
      ref={ref}
      className={[base, variantStyles[variant], sizeStyles[size], className].join(" ")}
      {...props}
    >
      {children}
    </a>
  )
);
LinkButton.displayName = "LinkButton";
