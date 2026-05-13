import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Trophy } from "lucide-react";
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
  onStart?: () => void;
}

const DURATION = 60;

export function SpeedQuiz({ entries, onStart }: Props) {
  const [active, setActive] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(DURATION);
  const [current, setCurrent] = useState<{ q: VocabEntry; options: VocabEntry[] } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [best, setBest] = useLocalStorage<number>("vocab_speed_best_v2", 0);
  const timerRef = useRef<number | null>(null);
  const { speak } = useTTS();

  const newQ = useCallback(() => {
    if (entries.length < 4) return;
    const q = pick(entries);
    const wrongs = shuffle(entries.filter((e) => e.de !== q.de)).slice(0, 3);
    const options = shuffle([q, ...wrongs]);
    setCurrent({ q, options });
    setPicked(null);
  }, [entries]);

  const end = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setActive(false);
    setBest((b) => (score > b ? score : b));
  }, [score, setBest]);

  const start = () => {
    if (entries.length < 4) return;
    setScore(0);
    setTime(DURATION);
    setActive(true);
    onStart?.();
    newQ();
    timerRef.current = window.setInterval(() => {
      setTime((t) => {
        if (t <= 1) { end(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const onPick = (o: VocabEntry) => {
    if (!active || !current || picked) return;
    setPicked(o.de);
    const correct = o.de === current.q.de;
    if (correct) setScore((s) => s + 1);
    speak(current.q.de);
    setTimeout(() => active && newQ(), correct ? 250 : 600);
  };

  if (entries.length < 4) {
    return <EmptyState title="Prea putine cuvinte" description="Ai nevoie de cel putin 4 cuvinte active." />;
  }

  if (!active) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={DURATION} label="Secunde" />
          <StatCard value={score} label="Scor" />
          <StatCard value={best} label="Record" />
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-10 text-center border border-blue-200">
          <Trophy size={48} className="text-amber-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Speed Quiz - 60 secunde</h3>
          <p className="text-sm text-slate-600 mb-5">Cate cuvinte poti recunoaste in 1 minut?</p>
          <Button variant="primary" size="lg" onClick={start}>
            <Play size={16} /> Start (60s)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={time} label="Secunde" />
        <StatCard value={score} label="Scor" />
        <StatCard value={best} label="Record" />
      </div>
      {current && (
        <>
          <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-8 text-center">
            <div className="text-3xl md:text-4xl font-bold text-slate-800">{current.q.ro}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {current.options.map((o) => {
              const isCorrect = o.de === current.q.de;
              const isPicked = picked === o.de;
              return (
                <button
                  key={o.de}
                  disabled={!!picked}
                  onClick={() => onPick(o)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-base font-medium transition-all",
                    !picked && "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50",
                    picked && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-800",
                    picked && !isCorrect && isPicked && "border-rose-500 bg-rose-50 text-rose-800",
                    picked && !isCorrect && !isPicked && "opacity-50"
                  )}
                >
                  {o.de}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
