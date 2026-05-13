import { useMemo, useState } from "react";
import { BookOpen, ListChecks, Type, Zap, Calendar, Layers, List as ListIcon } from "lucide-react";
import { DEFAULT_VOCAB } from "@/data/vocab";
import type { VocabEntry } from "@/types";
import { Tabs } from "@/components/ui/Tabs";
import { Pill } from "@/components/ui/Pill";
import { Flashcards } from "./Flashcards";
import { MultipleChoice } from "./MultipleChoice";
import { TypeQuiz } from "./TypeQuiz";
import { SpeedQuiz } from "./SpeedQuiz";
import { SrsView } from "./SrsView";
import { Sections } from "./Sections";
import { ListView } from "./ListView";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";

export type VocabTab = "flashcards" | "mc" | "type" | "speed" | "srs" | "sections" | "list";

const TABS = [
  { id: "flashcards" as const, label: "Flashcards", icon: <BookOpen size={16} /> },
  { id: "srs" as const, label: "Astazi (SRS)", icon: <Calendar size={16} /> },
  { id: "mc" as const, label: "Quiz alegere", icon: <ListChecks size={16} /> },
  { id: "type" as const, label: "Quiz scriere", icon: <Type size={16} /> },
  { id: "speed" as const, label: "Speed quiz", icon: <Zap size={16} /> },
  { id: "sections" as const, label: "Sectiuni", icon: <Layers size={16} /> },
  { id: "list" as const, label: "Lista", icon: <ListIcon size={16} /> },
];

export default function VocabularPage() {
  const [tab, setTab] = useState<VocabTab>("flashcards");
  // section filter: { sectionName: true/false }
  const [sectionFilter, setSectionFilter] = useLocalStorage<Record<string, boolean>>("vocab_sections_v2", {});
  const streak = useStreak();

  const activeEntries = useMemo<VocabEntry[]>(() => {
    const any = Object.values(sectionFilter).some((v) => v);
    if (!any) return DEFAULT_VOCAB;
    return DEFAULT_VOCAB.filter((e) => sectionFilter[e.section_ro || "general"]);
  }, [sectionFilter]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vocabular A2</h1>
          <p className="text-slate-500 mt-1">{activeEntries.length} cuvinte active din {DEFAULT_VOCAB.length} totale.</p>
        </div>
        <div className="flex items-center gap-2">
          {streak.count > 0 && (
            <Pill tone={streak.isActive ? "amber" : "default"}>
              Streak: {streak.count}{!streak.isActive && " (rupt)"}
            </Pill>
          )}
        </div>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={(t) => setTab(t as VocabTab)} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-[520px]">
        {tab === "flashcards" && <Flashcards entries={activeEntries} onMark={streak.bump} />}
        {tab === "srs" && <SrsView entries={activeEntries} onMark={streak.bump} />}
        {tab === "mc" && <MultipleChoice entries={activeEntries} onAnswer={streak.bump} />}
        {tab === "type" && <TypeQuiz entries={activeEntries} onAnswer={streak.bump} />}
        {tab === "speed" && <SpeedQuiz entries={activeEntries} onStart={streak.bump} />}
        {tab === "sections" && <Sections filter={sectionFilter} onChange={setSectionFilter} />}
        {tab === "list" && <ListView entries={DEFAULT_VOCAB} />}
      </div>
    </div>
  );
}
