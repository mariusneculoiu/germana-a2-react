import { useMemo, useState } from "react";
import { Search, Volume2 } from "lucide-react";
import type { VocabEntry } from "@/types";
import { useTTS } from "@/hooks/useTTS";
import { useSrs } from "@/hooks/useSrs";
import { Pill } from "@/components/ui/Pill";

interface Props {
  entries: VocabEntry[];
}

const vocabKey = (e: VocabEntry) => `${e.ro}::${e.de}`;

export function ListView({ entries }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const { speak } = useTTS();
  const srs = useSrs<VocabEntry>(vocabKey);

  const categories = useMemo(() => Array.from(new Set(entries.map((e) => e.section_ro))).sort(), [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (cat !== "all" && e.section_ro !== cat) return false;
      if (!needle) return true;
      return e.ro.toLowerCase().includes(needle) || e.de.toLowerCase().includes(needle);
    });
  }, [entries, q, cat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cauta cuvant..."
            className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white"
        >
          <option value="all">Toate categoriile</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-slate-500">{filtered.length} cuvinte</span>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {filtered.map((e) => {
          const state = srs.getState(e);
          return (
            <div key={`${e.ro}-${e.de}`} className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Pill tone="blue">{e.section_ro}</Pill>
                  {state && state.reps > 0 && <span className="text-[10px] text-slate-400">SRS: {state.reps} reps</span>}
                </div>
                <div className="font-medium text-slate-800 truncate">{e.de}</div>
                <div className="text-xs text-slate-500 italic truncate">{e.ro}</div>
              </div>
              <button
                onClick={() => speak(e.de)}
                className="p-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-full transition-colors"
                title="Audio"
              >
                <Volume2 size={14} />
              </button>
            </div>
          );
        })}
        {!filtered.length && <p className="text-center text-sm text-slate-400 py-8">Niciun cuvant gasit.</p>}
      </div>
    </div>
  );
}
