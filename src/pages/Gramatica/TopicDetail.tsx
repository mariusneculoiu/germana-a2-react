import { useMemo, useState } from "react";
import { ArrowLeft, BookOpenCheck, Sparkles } from "lucide-react";
import type { GrammarTopic, NormalizedExercise, Difficulty, ExerciseTypeRaw } from "@/types";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Tabs } from "@/components/ui/Tabs";
import { normalizeExercise } from "@/services/exerciseNormalizer";
import { ExercisePlayer } from "./ExercisePlayer";
import { shuffle } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DifficultyHistory } from "@/types";
import { makeHistory, recentSuccessRate, isCloseToPromote } from "@/services/difficultyManager";

interface Props {
  topic: GrammarTopic;
  onBack: () => void;
}

type Order = "original" | "random" | "uncomplete";
type DiffFilter = "all" | Difficulty;
type TypeFilter = "all" | ExerciseTypeRaw;

export function TopicDetail({ topic, onBack }: Props) {
  const [tab, setTab] = useState<"theory" | "exercises">("theory");
  const [order, setOrder] = useState<Order>("original");
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [progress, setProgress] = useLocalStorage<Record<string, Record<string, "correct" | "incorrect" | "skipped">>>("gramatica_progress_v2", {});
  const [history, setHistory] = useLocalStorage<Record<string, DifficultyHistory>>("gramatica_history_v2", {});

  const topicProgress = progress[topic.id] || {};
  const topicHistory = history[topic.id] || makeHistory();

  const allExercises = useMemo<NormalizedExercise[]>(() => {
    return (topic.exercises || []).map((e, i) => normalizeExercise(e, `${topic.id}-${i}`));
  }, [topic]);

  const filtered = useMemo(() => {
    let list = allExercises.slice();
    if (diffFilter !== "all") list = list.filter((e) => e.difficulty === diffFilter);
    if (typeFilter !== "all") list = list.filter((e) => e.rawType === typeFilter);
    if (order === "uncomplete") list = list.filter((e) => !topicProgress[e.id]);
    if (order === "random") list = shuffle(list);
    return list;
  }, [allExercises, diffFilter, typeFilter, order, topicProgress]);

  const handleResult = (exId: string, correct: boolean) => {
    setProgress((p) => ({
      ...p,
      [topic.id]: { ...(p[topic.id] || {}), [exId]: correct ? "correct" : "incorrect" },
    }));
    setHistory((h) => {
      const cur = h[topic.id] || makeHistory();
      const recent = [...cur.recent, correct].slice(-10);
      let level = cur.currentLevel;
      if (recent.length >= 10) {
        const rate = recent.filter(Boolean).length / recent.length;
        const order: Difficulty[] = ["Usor", "Mediu", "Greu"];
        const idx = order.indexOf(level);
        if (rate >= 0.8 && idx < 2) level = order[idx + 1];
        else if (rate <= 0.3 && idx > 0) level = order[idx - 1];
      }
      return {
        ...h,
        [topic.id]: {
          recent,
          currentLevel: level,
          totalCorrect: cur.totalCorrect + (correct ? 1 : 0),
          totalAttempts: cur.totalAttempts + 1,
        },
      };
    });
  };

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} /> Inapoi la topicuri
      </Button>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Pill tone={topic.level === "A1" ? "green" : topic.level === "A2" ? "amber" : "blue"}>{topic.level}</Pill>
            <span className="text-xs text-slate-500">{topic.category}</span>
            <Pill tone="slate">{topicHistory.currentLevel}</Pill>
            {isCloseToPromote(topicHistory) && (
              <Pill tone="violet"><Sparkles size={10} className="inline mr-1" /> Aproape de avansare</Pill>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{topic.title_de}</h1>
          <p className="text-slate-500">{topic.title_ro}</p>
          <p className="text-xs text-slate-400 mt-2">
            Progres: {topicHistory.totalCorrect}/{topicHistory.totalAttempts} corecte ({Math.round(recentSuccessRate(topicHistory) * 100)}% recent)
          </p>
        </div>
      </header>

      <Tabs
        variant="underline"
        tabs={[
          { id: "theory", label: "Teorie", icon: <BookOpenCheck size={16} /> },
          { id: "exercises", label: `Exercitii (${filtered.length} din ${allExercises.length})` },
        ]}
        active={tab}
        onChange={(t) => setTab(t as "theory" | "exercises")}
      />

      {tab === "theory" && (
        <div
          className="prose-grammar bg-white rounded-2xl border border-slate-200 p-6 md:p-8"
          dangerouslySetInnerHTML={{ __html: topic.theory }}
        />
      )}

      {tab === "exercises" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Ordine:</span>
              {(["original", "random", "uncomplete"] as Order[]).map((o) => (
                <Button key={o} size="sm" variant={order === o ? "primary" : "ghost"} onClick={() => setOrder(o)} className="rounded-full">
                  {o === "original" ? "Originala" : o === "random" ? "Aleatoare" : "Neicepute"}
                </Button>
              ))}
              <Button size="sm" variant="warning" onClick={() => { setOrder("random"); }} className="rounded-full ml-auto">
                Re-shuffle
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Dificultate:</span>
              {(["all", "Usor", "Mediu", "Greu"] as DiffFilter[]).map((d) => (
                <Button key={d} size="sm" variant={diffFilter === d ? "primary" : "ghost"} onClick={() => setDiffFilter(d)} className="rounded-full">
                  {d === "all" ? "Toate" : d}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tip:</span>
              <Button size="sm" variant={typeFilter === "all" ? "primary" : "ghost"} onClick={() => setTypeFilter("all")} className="rounded-full">Toate</Button>
              {(["Lückentext", "Multiple Choice", "Umformung", "Satzbau", "Fehlerkorrektur"] as const).map((t) => (
                <Button key={t} size="sm" variant={typeFilter === t ? "primary" : "ghost"} onClick={() => setTypeFilter(t)} className="rounded-full">
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <ExercisePlayer
            exercises={filtered}
            onResult={(exId, correct) => handleResult(exId, correct)}
          />
        </div>
      )}

      <style>{`
        .prose-grammar h3 { font-size: 1.25rem; font-weight: 700; color: #1e3a8a; margin: 1.25rem 0 0.5rem; }
        .prose-grammar h4 { font-size: 1rem; font-weight: 600; color: #2a5298; margin: 1rem 0 0.5rem; }
        .prose-grammar p { font-size: 0.95rem; line-height: 1.65; color: #374151; margin-bottom: 0.75rem; }
        .prose-grammar ul, .prose-grammar ol { margin: 0.5rem 0 0.75rem 1.5rem; }
        .prose-grammar li { font-size: 0.95rem; line-height: 1.65; margin-bottom: 0.25rem; }
        .prose-grammar strong { color: #1e3a8a; }
        .prose-grammar em { color: #555; font-style: italic; }
        .prose-grammar code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 0.85em; }
        .prose-grammar .gram-example { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 8px; margin: 0.75rem 0; }
        .prose-grammar .gram-tip { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 1rem 0; color: #78350f; }
        .prose-grammar .gram-tip strong { color: #92400e; }
        .prose-grammar .gram-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
        .prose-grammar .gram-table th, .prose-grammar .gram-table td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; vertical-align: top; }
        .prose-grammar .gram-table th { background: #2563eb; color: white; font-weight: 600; }
        .prose-grammar .gram-table tr:nth-child(even) { background: #f8fafc; }
      `}</style>
    </div>
  );
}
