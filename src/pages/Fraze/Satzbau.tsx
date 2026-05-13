import { useEffect, useState } from "react";
import { Volume2, Eraser, Eye } from "lucide-react";
import type { Phrase } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { pick, shuffle, normalizeDE } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

interface Props { phrases: Phrase[]; onAnswer?: () => void; }

function tokenizeNoWhitespace(s: string): string[] {
  return s.split(/\s+/).filter((w) => w.length > 0);
}

export function FraSatzbau({ phrases, onAnswer }: Props) {
  const [stats, setStats] = useLocalStorage("fra_sb_stats_v2", { correct: 0, total: 0 });
  const [current, setCurrent] = useState<Phrase | null>(null);
  const [pool, setPool] = useState<{ id: number; text: string }[]>([]);
  const [built, setBuilt] = useState<{ id: number; text: string }[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; expected: string } | null>(null);
  const { speak } = useTTS();

  const newQ = () => {
    if (!phrases.length) return;
    const usable = phrases.filter((p) => {
      const n = tokenizeNoWhitespace(p.de).length;
      return n >= 4 && n <= 14;
    });
    const p = pick(usable.length ? usable : phrases);
    const words = tokenizeNoWhitespace(p.de).map((w, i) => ({ id: i, text: w }));
    setCurrent(p);
    setPool(shuffle(words));
    setBuilt([]);
    setFeedback(null);
  };

  useEffect(newQ, [phrases]);

  if (!phrases.length) return <EmptyState title="Nicio fraza" description="Schimba categoria." />;
  if (!current) return null;

  const check = () => {
    const userText = built.map((w) => w.text).join(" ");
    const correct = normalizeDE(userText) === normalizeDE(current.de);
    setFeedback({ correct, expected: current.de });
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    onAnswer?.();
  };

  const reveal = () => {
    const correctWords = tokenizeNoWhitespace(current.de).map((w, i) => ({ id: i, text: w }));
    setBuilt(correctWords);
    setPool([]);
    setFeedback({ correct: false, expected: current.de });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.correct} label="Corecte" />
        <StatCard value={stats.total} label="Total" />
        <StatCard value={`${stats.total ? Math.round(100 * stats.correct / stats.total) : 0}%`} label="Acuratete" />
      </div>

      <div className="bg-slate-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="text-xs text-slate-500 uppercase mb-1 tracking-wider">{current.cat}</div>
        <div className="text-sm text-slate-600 italic">Hint romana: {current.ro}</div>
      </div>

      {/* Built area */}
      <div className="min-h-[80px] bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex flex-wrap gap-2 items-start">
        {built.length === 0 ? (
          <span className="text-slate-400 italic text-sm self-center">Click pe cuvinte ca sa le adaugi aici</span>
        ) : (
          built.map((w, i) => (
            <button
              key={w.id}
              onClick={() => {
                if (feedback) return;
                setBuilt(built.filter((_, idx) => idx !== i));
                setPool([...pool, w]);
              }}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm hover:bg-emerald-700 transition-colors"
            >
              {w.text}
            </button>
          ))
        )}
      </div>

      {/* Pool area */}
      <div className="min-h-[80px] bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-wrap gap-2 items-start">
        {pool.length === 0 ? (
          <span className="text-slate-400 italic text-sm self-center">Toate cuvintele sunt plasate</span>
        ) : (
          pool.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                if (feedback) return;
                setBuilt([...built, w]);
                setPool(pool.filter((p) => p.id !== w.id));
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors"
            >
              {w.text}
            </button>
          ))
        )}
      </div>

      {feedback && (
        <div className={cn(
          "rounded-xl p-4 border",
          feedback.correct ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          <p className="font-semibold">
            {feedback.correct ? "Corect!" : "Aproape! Versiunea corecta:"}
          </p>
          {!feedback.correct && <p className="text-sm mt-1">{feedback.expected}</p>}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {!feedback && <Button variant="primary" onClick={check}>Verifica</Button>}
        <Button variant="secondary" size="sm" onClick={() => { setBuilt([]); setPool(shuffle([...pool, ...built])); setFeedback(null); }}>
          <Eraser size={14} /> Sterge ce ai pus
        </Button>
        <Button variant="warning" size="sm" onClick={reveal}><Eye size={14} /> Arata</Button>
        <Button variant="tts" size="sm" onClick={() => speak(current.de)}><Volume2 size={14} /> Audio</Button>
        <Button variant="primary" onClick={newQ}>Fraza noua →</Button>
      </div>
    </div>
  );
}
