import { type ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "text-[20px] md:text-[26px]",
  md: "text-[28px] md:text-[36px]",
  lg: "text-[clamp(32px,4.5vw,52px)]",
};

export function SectionHeader({ eyebrow, children, size = "md", className = "" }: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
      <h2 className={`serif-heading ${sizeMap[size]}`}>{children}</h2>
    </div>
  );
}
