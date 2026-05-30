import { forwardRef, type HTMLAttributes, type AnchorHTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  radius?: "md" | "lg" | "xl" | "2xl";
}

const radiusMap = {
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-[20px]",
  "2xl": "rounded-3xl",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ hover = false, radius = "lg", className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        "glass",
        radiusMap[radius],
        hover ? "glass-hover" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = "GlassCard";

interface GlassLinkCardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  radius?: "md" | "lg" | "xl" | "2xl";
}

export const GlassLinkCard = forwardRef<HTMLAnchorElement, GlassLinkCardProps>(
  ({ radius = "lg", className = "", children, ...props }, ref) => (
    <a
      ref={ref}
      className={[
        "glass glass-hover block",
        radiusMap[radius],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </a>
  )
);
GlassLinkCard.displayName = "GlassLinkCard";
