import { useMemo, useState } from "react";
import { Search, Volume2 } from "lucide-react";
import type { Phrase } from "@/types";
import { useTTS } from "@/hooks/useTTS";
import { Pill } from "@/components/ui/Pill";

interface Props { phrases: Phrase[]; }

export function FraList({ phrases }: Props) {
  const [q, setQ] = useState("");
  const { speak } = useTTS();

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return phrases;
    return phrases.filter((p) => p.de.toLowerCase().includes(n) || p.ro.toLowerCase().includes(n));
  }, [phrases, q]);

  // Group by category
  const grouped = useMemo(() => {
    const g: Record<string, Phrase[]> = {};
    filtered.forEach((p) => { (g[p.cat] = g[p.cat] || []).push(p); });
    return g;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cauta in fraze..."
          className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
        />
      </div>
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-sm font-bold text-blue-700 mb-2 sticky top-0 bg-white py-1">
              {cat} <span className="text-xs font-normal text-slate-400">({items.length})</span>
            </h3>
            <div className="space-y-2">
              {items.map((p) => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800">{p.de}</div>
                      <div className="text-sm text-slate-500 italic">{p.ro}</div>
                      {p.grammar && (
                        <div className="text-xs text-amber-700 mt-1.5 italic">💡 {p.grammar}</div>
                      )}
                    </div>
                    <button
                      onClick={() => speak(p.de)}
                      className="p-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-full flex-shrink-0"
                      title="Audio"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
