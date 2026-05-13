import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "success" | "danger" | "warning" | "ghost" | "tts";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-100",
  warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-100",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  tts: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-100",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({ variant = "primary", size = "md", className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "rounded-lg font-medium transition-all duration-150 inline-flex items-center justify-center gap-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
