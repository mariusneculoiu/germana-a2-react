import { useMemo, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { DEFAULT_GRAMMAR_TOPICS } from "@/data/grammar";
import type { GrammarTopic, Level } from "@/types";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { TopicDetail } from "./TopicDetail";
import { ScenarioStudio } from "./ScenarioStudio";

type View = "list" | "topic" | "scenario";

export default function GramaticaPage() {
  const [view, setView] = useState<View>("list");
  const [activeTopic, setActiveTopic] = useState<GrammarTopic | null>(null);
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  const categories = useMemo(() => Array.from(new Set(DEFAULT_GRAMMAR_TOPICS.map((t) => t.category))).sort(), []);

  const filtered = useMemo(() => {
    return DEFAULT_GRAMMAR_TOPICS.filter((t) => {
      if (levelFilter !== "all" && t.level !== levelFilter) return false;
      if (catFilter !== "all" && t.category !== catFilter) return false;
      return true;
    });
  }, [levelFilter, catFilter]);

  if (view === "topic" && activeTopic) {
    return <TopicDetail topic={activeTopic} onBack={() => setView("list")} />;
  }
  if (view === "scenario") {
    return <ScenarioStudio onBack={() => setView("list")} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gramatica A1-B1</h1>
          <p className="text-slate-500 mt-1">{filtered.length} topicuri, {filtered.reduce((s, t) => s + (t.exercises?.length || 0), 0)} exercitii</p>
        </div>
        <Button variant="primary" onClick={() => setView("scenario")}>
          <Sparkles size={16} /> Scenario Studio (AI)
        </Button>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase text-slate-500 tracking-wider font-semibold">Nivel:</span>
          {(["all", "A1", "A2", "B1"] as const).map((l) => (
            <Button key={l} size="sm" variant={levelFilter === l ? "primary" : "ghost"} onClick={() => setLevelFilter(l)} className="rounded-full">
              {l === "all" ? "Toate" : l}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase text-slate-500 tracking-wider font-semibold">Categorie:</span>
          <Button size="sm" variant={catFilter === "all" ? "primary" : "ghost"} onClick={() => setCatFilter("all")} className="rounded-full">Toate</Button>
          {categories.map((c) => (
            <Button key={c} size="sm" variant={catFilter === c ? "primary" : "ghost"} onClick={() => setCatFilter(c)} className="rounded-full">
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const tone = t.level === "A1" ? "green" : t.level === "A2" ? "amber" : "blue";
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTopic(t); setView("topic"); }}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pill tone={tone}>{t.level}</Pill>
                  <span className="text-xs text-slate-500">{t.category}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{t.title_de}</h3>
              <p className="text-sm text-slate-500 mb-3">{t.title_ro}</p>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t.summary}</p>
              <div className="text-xs text-blue-600 font-medium">{t.exercises?.length || 0} exercitii →</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
