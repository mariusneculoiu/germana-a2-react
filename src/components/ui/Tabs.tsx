import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline";
}

export function Tabs({ tabs, active, onChange, variant = "pills" }: Props) {
  if (variant === "underline") {
    return (
      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto -mx-2 px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2",
              active === t.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2",
            active === t.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
