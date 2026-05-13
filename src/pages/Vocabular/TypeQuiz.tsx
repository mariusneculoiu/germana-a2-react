import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Volume2, Lightbulb } from "lucide-react";
import type { VocabEntry } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { pick, normalizeDE } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

interface Props {
  entries: VocabEntry[];
  onAnswer?: () => void;
}

interface State {
  current: VocabEntry;
  direction: "ro-de" | "de-ro";
  answered: { user: string; correct: boolean } | null;
}

function normalizeUserAnswer(s: string, isGerman: boolean): string {
  let n = normalizeDE(s);
  if (isGerman) n = n.replace(/^(der|die|das)\s+/i, "");
  if (!isGerman) n = n.replace(/^a\s+/i, "");
  return n;
}

export function TypeQuiz({ entries, onAnswer }: Props) {
  const [direction, setDirection] = useState<"ro-de" | "de-ro">("ro-de");
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState("");
  const [stats, setStats] = useLocalStorage("vocab_type_stats_v2", { correct: 0, total: 0 });
  const { speak } = useTTS();

  const newQuestion = () => {
    if (!entries.length) return;
    const e = pick(entries);
    setState({ current: e, direction, answered: null });
    setInput("");
  };

  useEffect(newQuestion, [entries, direction]);

  if (!entries.length) {
    return <EmptyState title="Nicio sectiune activa" description="Activeaza sectiuni pentru a incepe quiz-ul." />;
  }
  if (!state) return null;

  const isGermanAnswer = state.direction === "ro-de";
  const promptText = state.direction === "ro-de" ? state.current.ro : state.current.de;
  const correctText = state.direction === "ro-de" ? state.current.de : state.current.ro;

  const check = () => {
    if (state.answered) return;
    const correct = normalizeUserAnswer(input, isGermanAnswer) === normalizeUserAnswer(correctText, isGermanAnswer);
    setState({ ...state, answered: { user: input, correct } });
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    onAnswer?.();
  };

  const accuracy = stats.total ? Math.round((100 * stats.correct) / stats.total) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.correct} label="Corecte" />
        <StatCard value={stats.total} label="Total" />
        <StatCard value={`${accuracy}%`} label="Acuratete" />
      </div>

      <div className="flex gap-2 justify-center">
        <Button size="sm" variant={direction === "ro-de" ? "primary" : "ghost"} onClick={() => setDirection("ro-de")} className="rounded-full">RO → DE</Button>
        <Button size="sm" variant={direction === "de-ro" ? "primary" : "ghost"} onClick={() => setDirection("de-ro")} className="rounded-full">DE → RO</Button>
      </div>

      <div className="bg-slate-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
          {state.direction === "ro-de" ? "Tradu in germana" : "Tradu in romana"} - {state.current.section_ro}
        </div>
        <div className="text-2xl font-semibold text-slate-800">{promptText}</div>
      </div>

      <input
        type="text"
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!!state.answered}
        onKeyDown={(e) => { if (e.key === "Enter") check(); }}
        placeholder="Scrie raspunsul..."
        className={cn(
          "w-full p-4 text-lg border-2 rounded-xl outline-none transition-all",
          !state.answered && "border-slate-200 focus:border-blue-500",
          state.answered?.correct && "border-emerald-500 bg-emerald-50",
          state.answered && !state.answered.correct && "border-rose-500 bg-rose-50"
        )}
      />

      {state.answered && (
        <div className={cn(
          "p-4 rounded-xl border flex items-start gap-3",
          state.answered.correct ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          {state.answered.correct ? <CheckCircle2 className="flex-shrink-0 mt-0.5" /> : <XCircle className="flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="font-semibold">{state.answered.correct ? "Corect!" : `Raspuns corect: ${correctText}`}</p>
            {!state.answered.correct && (
              <p className="text-sm mt-1 opacity-90">Ai scris: <em>{state.answered.user}</em></p>
            )}
          </div>
          <Button variant="tts" size="sm" onClick={() => speak(state.current.de)}>
            <Volume2 size={14} />
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center gap-3 flex-wrap">
        <p className="text-xs text-slate-500 italic"><Lightbulb size={11} className="inline mr-1" />Articolele der/die/das sunt optionale; a/o/u accept ä/ö/ü.</p>
        <div className="flex gap-2">
          {!state.answered && <Button variant="primary" onClick={check}>Verifica</Button>}
          {state.answered && <Button variant="primary" onClick={newQuestion}>Urmator →</Button>}
        </div>
      </div>
    </div>
  );
}
