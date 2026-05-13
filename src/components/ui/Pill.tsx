import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "default" | "blue" | "green" | "amber" | "rose" | "violet" | "slate";

interface Props {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

const tones: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  slate: "bg-slate-800 text-slate-100",
};

export function Pill({ tone = "default", className, children }: Props) {
  return (
    <span className={cn("inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full", tones[tone], className)}>
      {children}
    </span>
  );
}
