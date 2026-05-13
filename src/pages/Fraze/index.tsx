import { useMemo, useState } from "react";
import { BookOpen, ListChecks, FileText, Shuffle, Headphones, Languages, List as ListIcon } from "lucide-react";
import { DEFAULT_PHRASES } from "@/data/phrases";
import type { Phrase } from "@/types";
import { Tabs } from "@/components/ui/Tabs";
import { FraFlashcards } from "./Flashcards";
import { FraQuiz } from "./Quiz";
import { FraMultiBlank } from "./MultiBlank";
import { FraSatzbau } from "./Satzbau";
import { FraDiktat } from "./Diktat";
import { FraTranslate } from "./Translate";
import { FraList } from "./List";
import { useStreak } from "@/hooks/useStreak";
import { Pill } from "@/components/ui/Pill";

type Tab = "flashcards" | "quiz" | "multiblank" | "satzbau" | "diktat" | "translate" | "list";

const TABS = [
  { id: "flashcards" as const, label: "Flashcards", icon: <BookOpen size={16} /> },
  { id: "quiz" as const, label: "Quiz", icon: <ListChecks size={16} /> },
  { id: "multiblank" as const, label: "Completare", icon: <FileText size={16} /> },
  { id: "satzbau" as const, label: "Satzbau", icon: <Shuffle size={16} /> },
  { id: "diktat" as const, label: "Diktat", icon: <Headphones size={16} /> },
  { id: "translate" as const, label: "Traducere", icon: <Languages size={16} /> },
  { id: "list" as const, label: "Toate", icon: <ListIcon size={16} /> },
];

export default function FrazePage() {
  const [tab, setTab] = useState<Tab>("flashcards");
  const [cat, setCat] = useState<string>("all");
  const streak = useStreak();

  const categories = useMemo(() => Array.from(new Set(DEFAULT_PHRASES.map((p) => p.cat))).sort(), []);

  const filtered: Phrase[] = useMemo(() => {
    if (cat === "all") return DEFAULT_PHRASES;
    return DEFAULT_PHRASES.filter((p) => p.cat === cat);
  }, [cat]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fraze A2</h1>
          <p className="text-slate-500 mt-1">{filtered.length} fraze in categoria curenta din {DEFAULT_PHRASES.length} totale.</p>
        </div>
        {streak.count > 0 && (
          <Pill tone={streak.isActive ? "amber" : "default"}>Streak: {streak.count}{!streak.isActive && " (rupt)"}</Pill>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase text-slate-500 tracking-wider">Categorie:</span>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white"
        >
          <option value="all">Toate categoriile ({DEFAULT_PHRASES.length})</option>
          {categories.map((c) => {
            const count = DEFAULT_PHRASES.filter((p) => p.cat === c).length;
            return <option key={c} value={c}>{c} ({count})</option>;
          })}
        </select>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(t) => setTab(t as Tab)} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-[520px]">
        {tab === "flashcards" && <FraFlashcards phrases={filtered} onAction={streak.bump} />}
        {tab === "quiz" && <FraQuiz phrases={filtered} onAnswer={streak.bump} />}
        {tab === "multiblank" && <FraMultiBlank phrases={filtered} onAnswer={streak.bump} />}
        {tab === "satzbau" && <FraSatzbau phrases={filtered} onAnswer={streak.bump} />}
        {tab === "diktat" && <FraDiktat phrases={filtered} onAnswer={streak.bump} />}
        {tab === "translate" && <FraTranslate phrases={filtered} onAnswer={streak.bump} />}
        {tab === "list" && <FraList phrases={filtered} />}
      </div>
    </div>
  );
}
