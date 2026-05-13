import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Volume2 } from "lucide-react";
import type { VocabEntry } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { pick, shuffle } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

interface Props {
  entries: VocabEntry[];
  onAnswer?: () => void;
}

interface QuizState {
  question: VocabEntry;
  options: VocabEntry[];
  direction: "ro-de" | "de-ro";
  answered: VocabEntry | null;
}

export function MultipleChoice({ entries, onAnswer }: Props) {
  const [direction, setDirection] = useState<"ro-de" | "de-ro" | "random">("ro-de");
  const [stats, setStats] = useLocalStorage("vocab_mc_stats_v2", { correct: 0, total: 0, streak: 0 });
  const [state, setState] = useState<QuizState | null>(null);
  const { speak } = useTTS();

  const newQuestion = useMemo(() => () => {
    if (entries.length < 4) return null;
    const q = pick(entries);
    const wrongs = shuffle(entries.filter((e) => e.de !== q.de)).slice(0, 3);
    const options = shuffle([q, ...wrongs]);
    const dir = direction === "random" ? (Math.random() < 0.5 ? "ro-de" : "de-ro") : direction;
    return { question: q, options, direction: dir, answered: null };
  }, [entries, direction]);

  useEffect(() => {
    setState(newQuestion());
  }, [newQuestion]);

  if (entries.length < 4) {
    return <EmptyState title="Prea putine cuvinte" description="Ai nevoie de cel putin 4 cuvinte active pentru quiz." />;
  }
  if (!state) return null;

  const promptKey = state.direction === "ro-de" ? "ro" : "de";
  const answerKey = state.direction === "ro-de" ? "de" : "ro";

  const handleClick = (opt: VocabEntry) => {
    if (state.answered) return;
    const correct = opt.de === state.question.de;
    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
      streak: correct ? s.streak + 1 : 0,
    }));
    setState({ ...state, answered: opt });
    onAnswer?.();
    if (state.direction === "ro-de") speak(state.question.de); // play correct German
  };

  const accuracy = stats.total ? Math.round((100 * stats.correct) / stats.total) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={stats.correct} label="Corecte" />
        <StatCard value={stats.total} label="Total" />
        <StatCard value={`${accuracy}%`} label="Acuratete" />
        <StatCard value={stats.streak} label="Streak" />
      </div>

      <div className="flex flex-wrap gap-2 justify-center text-sm">
        <span className="text-xs text-slate-500 self-center">Directie:</span>
        {(["ro-de", "de-ro", "random"] as const).map((d) => (
          <Button key={d} size="sm" variant={direction === d ? "primary" : "ghost"} onClick={() => setDirection(d)} className="rounded-full">
            {d === "ro-de" ? "RO → DE" : d === "de-ro" ? "DE → RO" : "Aleator"}
          </Button>
        ))}
      </div>

      <div className="bg-slate-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
          {state.direction === "ro-de" ? "Tradu in germana" : "Tradu in romana"} - {state.question.section_ro}
        </div>
        <div className="text-2xl font-semibold text-slate-800">{state.question[promptKey]}</div>
      </div>

      <div className="grid gap-3">
        {state.options.map((o) => {
          const isCorrect = o.de === state.question.de;
          const isPicked = state.answered?.de === o.de;
          return (
            <button
              key={o.de}
              onClick={() => handleClick(o)}
              disabled={!!state.answered}
              className={cn(
                "p-4 rounded-xl border-2 text-left text-base font-medium transition-all",
                !state.answered && "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50",
                state.answered && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-800",
                state.answered && !isCorrect && isPicked && "border-rose-500 bg-rose-50 text-rose-800",
                state.answered && !isCorrect && !isPicked && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                {state.answered && isCorrect && <CheckCircle2 size={18} className="text-emerald-600" />}
                {state.answered && !isCorrect && isPicked && <XCircle size={18} className="text-rose-600" />}
                <span className="flex-1">{o[answerKey]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {state.answered && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="tts" onClick={() => speak(state.question.de)}>
            <Volume2 size={14} /> Audio
          </Button>
          <Button variant="primary" onClick={() => setState(newQuestion())}>
            Intrebare noua →
          </Button>
        </div>
      )}
    </div>
  );
}
