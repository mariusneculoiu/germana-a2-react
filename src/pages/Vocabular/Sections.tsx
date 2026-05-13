import { useMemo } from "react";
import { Check } from "lucide-react";
import { DEFAULT_VOCAB } from "@/data/vocab";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  filter: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}

export function Sections({ filter, onChange }: Props) {
  const sections = useMemo(() => {
    const map = new Map<string, number>();
    DEFAULT_VOCAB.forEach((e) => {
      const k = e.section_ro || "general";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const anySelected = Object.values(filter).some(Boolean);

  const toggle = (s: string) => {
    if (!anySelected) {
      // First click: enable only this section
      const next: Record<string, boolean> = {};
      sections.forEach(([sec]) => (next[sec] = false));
      next[s] = true;
      onChange(next);
    } else {
      onChange({ ...filter, [s]: !filter[s] });
    }
  };

  const setAll = (val: boolean) => {
    const next: Record<string, boolean> = {};
    sections.forEach(([s]) => (next[s] = val));
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Activeaza categoriile pe care vrei sa le exersezi:</p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAll(true)}>Tot</Button>
          <Button size="sm" variant="ghost" onClick={() => setAll(false)}>Nimic</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sections.map(([s, count]) => {
          const active = !anySelected || filter[s];
          return (
            <button
              key={s}
              onClick={() => toggle(s)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all",
                active
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {active && <Check size={14} className="text-blue-600" />}
                {s}
              </span>
              <span className="text-xs text-slate-500">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
