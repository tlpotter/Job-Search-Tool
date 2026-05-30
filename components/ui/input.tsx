import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const inputBase =
  "w-full bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] border border-white/10 hover:border-white/15 focus:border-[rgba(56,189,248,.5)] rounded-[10px] text-white text-[15px] outline-none transition-colors duration-200 placeholder:text-white/30 disabled:opacity-50 disabled:cursor-not-allowed";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`${inputBase} px-4 py-3 ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "xs" | "sm" | "md";
}

const selectSizes = {
  xs: "px-2.5 py-1 text-[12px] pr-7",
  sm: "px-3 py-1.5 text-[13px] pr-8",
  md: "px-4 py-2.5 text-[15px] pr-9",
};

const selectArrow =
  "appearance-none bg-no-repeat bg-[right_8px_center] cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path fill=%22none%22 stroke=%22rgba(255,255,255,0.4)%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M3 4.5l3 3 3-3%22/></svg>')]";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", size = "sm", children, ...props }, ref) => (
    <select
      ref={ref}
      className={`${inputBase} ${selectSizes[size]} ${selectArrow} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${inputBase} px-4 py-3 resize-y ${className}`}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
