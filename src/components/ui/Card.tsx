import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200", className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={cn("bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-center border border-slate-200", className)}>
      <div className="text-2xl font-bold text-blue-700">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
