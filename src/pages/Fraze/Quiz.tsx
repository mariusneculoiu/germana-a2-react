import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Volume2 } from "lucide-react";
import type { Phrase } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { pick, shuffle } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

interface Props { phrases: Phrase[]; onAnswer?: () => void; }

export function FraQuiz({ phrases, onAnswer }: Props) {
  const [stats, setStats] = useLocalStorage("fra_quiz_stats_v2", { correct: 0, total: 0 });
  const [state, setState] = useState<{ q: Phrase; options: Phrase[]; askDe: boolean; picked: Phrase | null } | null>(null);
  const { speak } = useTTS();

  const newQ = useMemo(() => () => {
    if (phrases.length < 4) return null;
    const q = pick(phrases);
    const wrongs = shuffle(phrases.filter((p) => p.id !== q.id)).slice(0, 3);
    const options = shuffle([q, ...wrongs]);
    const askDe = Math.random() < 0.5;
    return { q, options, askDe, picked: null };
  }, [phrases]);

  useEffect(() => { setState(newQ()); }, [newQ]);

  if (phrases.length < 4) return <EmptyState title="Prea putine fraze" description="Ai nevoie de minim 4 fraze in categoria curenta." />;
  if (!state) return null;

  const promptKey = state.askDe ? "de" : "ro";
  const answerKey = state.askDe ? "ro" : "de";

  const onPick = (p: Phrase) => {
    if (state.picked) return;
    const correct = p.id === state.q.id;
    setState({ ...state, picked: p });
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    onAnswer?.();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.correct} label="Corecte" />
        <StatCard value={stats.total} label="Total" />
        <StatCard value={`${stats.total ? Math.round(100 * stats.correct / stats.total) : 0}%`} label="Acuratete" />
      </div>

      <div className="bg-slate-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="text-xs text-slate-500 uppercase mb-1 tracking-wider">
          {state.askDe ? "Tradu in romana" : "Tradu in germana"} - {state.q.cat}
        </div>
        <div className="text-xl font-medium text-slate-800 leading-relaxed">{state.q[promptKey]}</div>
      </div>

      <div className="grid gap-3">
        {state.options.map((o) => {
          const isCorrect = o.id === state.q.id;
          const isPicked = state.picked?.id === o.id;
          return (
            <button
              key={o.id}
              disabled={!!state.picked}
              onClick={() => onPick(o)}
              className={cn(
                "p-4 rounded-xl border-2 text-left text-base transition-all",
                !state.picked && "border-slate-200 bg-white hover:border-blue-400",
                state.picked && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-800",
                state.picked && !isCorrect && isPicked && "border-rose-500 bg-rose-50 text-rose-800",
                state.picked && !isCorrect && !isPicked && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                {state.picked && isCorrect && <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />}
                {state.picked && !isCorrect && isPicked && <XCircle size={18} className="text-rose-600 flex-shrink-0" />}
                <span className="flex-1">{o[answerKey]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {state.picked && (
        <div className="flex justify-between items-center gap-3">
          <Button variant="tts" onClick={() => speak(state.q.de)}><Volume2 size={14} /> Audio</Button>
          <Button variant="primary" onClick={() => setState(newQ())}>Intrebare noua →</Button>
        </div>
      )}
    </div>
  );
}
