import { useEffect, useRef, useState } from "react";
import { Volume2, Lightbulb, Eye } from "lucide-react";
import type { Phrase } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { pick, normalizeDE } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

interface Props { phrases: Phrase[]; onAnswer?: () => void; }

interface DiffToken {
  type: "ok" | "wrong" | "missing" | "extra";
  expected?: string;
  user?: string;
}

function diffWords(expected: string, user: string): DiffToken[] {
  const exp = expected.split(/\s+/);
  const usr = user.split(/\s+/);
  const out: DiffToken[] = [];
  const n = Math.max(exp.length, usr.length);
  for (let i = 0; i < n; i++) {
    const e = exp[i] || "";
    const u = usr[i] || "";
    if (!u) out.push({ type: "missing", expected: e });
    else if (!e) out.push({ type: "extra", user: u });
    else if (normalizeDE(e) === normalizeDE(u)) out.push({ type: "ok", user: u });
    else out.push({ type: "wrong", user: u, expected: e });
  }
  return out;
}

export function FraDiktat({ phrases, onAnswer }: Props) {
  const [stats, setStats] = useLocalStorage("fra_dk_stats_v2", { correct: 0, total: 0 });
  const [current, setCurrent] = useState<Phrase | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; tokens: DiffToken[] } | null>(null);
  const { speak } = useTTS();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const newQ = () => {
    if (!phrases.length) return;
    const usable = phrases.filter((p) => p.de.split(/\s+/).length <= 12);
    const p = pick(usable.length ? usable : phrases);
    setCurrent(p);
    setInput("");
    setFeedback(null);
    setTimeout(() => {
      speak(p.de);
      inputRef.current?.focus();
    }, 250);
  };

  useEffect(newQ, [phrases]);

  if (!phrases.length) return <EmptyState title="Nicio fraza" description="Schimba categoria." />;
  if (!current) return null;

  const check = () => {
    const correct = normalizeDE(input) === normalizeDE(current.de);
    const tokens = diffWords(current.de, input);
    setFeedback({ correct, tokens });
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    onAnswer?.();
  };

  const reveal = () => {
    setInput(current.de);
    const tokens = diffWords(current.de, current.de);
    setFeedback({ correct: false, tokens });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.correct} label="Corecte" />
        <StatCard value={stats.total} label="Total" />
        <StatCard value={`${stats.total ? Math.round(100 * stats.correct / stats.total) : 0}%`} label="Acuratete" />
      </div>

      <div className="bg-slate-50 border-l-4 border-violet-500 rounded-xl p-5">
        <div className="text-xs text-slate-500 uppercase mb-2 tracking-wider">Asculta si scrie - {current.cat}</div>
        <Button variant="tts" onClick={() => speak(current.de)} size="lg">
          <Volume2 size={16} /> Asculta din nou
        </Button>
      </div>

      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!!feedback}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") check();
        }}
        rows={3}
        placeholder="Scrie aici ce ai auzit..."
        className={cn(
          "w-full p-4 border-2 rounded-xl outline-none transition-all text-base",
          !feedback && "border-slate-200 focus:border-blue-500",
          feedback?.correct && "border-emerald-500 bg-emerald-50",
          feedback && !feedback.correct && "border-rose-500 bg-rose-50"
        )}
      />

      {feedback && (
        <div className={cn(
          "rounded-xl p-4 border",
          feedback.correct ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          <p className="font-semibold mb-2">{feedback.correct ? "Perfect!" : "Aproape!"}</p>
          {!feedback.correct && (
            <>
              <p className="text-sm">Versiunea corecta: <strong>{current.de}</strong></p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {feedback.tokens.map((t, i) => {
                  if (t.type === "ok") return <span key={i} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">{t.user}</span>;
                  if (t.type === "missing") return <span key={i} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs border border-dashed border-amber-400">lipseste: {t.expected}</span>;
                  if (t.type === "extra") return <span key={i} className="px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded text-xs line-through">{t.user}</span>;
                  return <span key={i} className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-xs"><span className="line-through opacity-60">{t.user}</span> → <strong>{t.expected}</strong></span>;
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {!feedback && <Button variant="primary" onClick={check}>Verifica</Button>}
        <Button variant="warning" size="sm" onClick={reveal}><Eye size={14} /> Arata</Button>
        <Button variant="primary" onClick={newQ}>Fraza noua →</Button>
      </div>

      <p className="text-xs text-slate-400 italic text-center">
        <Lightbulb size={11} className="inline mr-1" />
        Comparatia accepta a/o/u in loc de ä/ö/ü. Ctrl+Enter verifica rapid.
      </p>
    </div>
  );
}
