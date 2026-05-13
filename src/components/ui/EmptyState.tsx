import { Info } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: Props) {
  return (
    <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl border border-slate-200">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-3">
        {icon ?? <Info />}
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}
