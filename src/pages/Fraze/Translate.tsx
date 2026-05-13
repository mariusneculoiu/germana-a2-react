import { useEffect, useState } from "react";
import { Volume2, Eye } from "lucide-react";
import type { Phrase } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { pick, normalizeDE } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTTS } from "@/hooks/useTTS";
import { GrammarFeedback } from "@/components/feedback/GrammarFeedback";
import { analyzeAnswer } from "@/services/grammarAnalyzer";
import type { GrammarAnalysis } from "@/types";
import { cn } from "@/lib/utils";

interface Props { phrases: Phrase[]; onAnswer?: () => void; }

export function FraTranslate({ phrases, onAnswer }: Props) {
  const [stats, setStats] = useLocalStorage("fra_tr_stats_v2", { correct: 0, total: 0 });
  const [current, setCurrent] = useState<Phrase | null>(null);
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<GrammarAnalysis | null>(null);
  const { speak } = useTTS();

  const newQ = () => {
    if (!phrases.length) return;
    const p = pick(phrases);
    setCurrent(p);
    setInput("");
    setAnalysis(null);
  };

  useEffect(newQ, [phrases]);

  if (!phrases.length) return <EmptyState title="Nicio fraza" description="Schimba categoria." />;
  if (!current) return null;

  const check = () => {
    const a = analyzeAnswer(input, current.de);
    setAnalysis(a);
    // Consider "close enough" if 70%+ words match
    const closeEnough = a.tokens.filter((t) => t.type === "ok").length / Math.max(a.tokens.length, 1) >= 0.7;
    const correct = a.isCorrect || closeEnough;
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
        <div className="text-xs text-slate-500 uppercase mb-1 tracking-wider">Tradu in germana - {current.cat}</div>
        <div className="text-xl font-medium text-slate-800 leading-relaxed">{current.ro}</div>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!!analysis}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") check(); }}
        autoFocus
        rows={3}
        placeholder="Scrie aici traducerea in germana..."
        className={cn(
          "w-full p-4 border-2 rounded-xl outline-none transition-all text-base",
          !analysis && "border-slate-200 focus:border-blue-500",
          analysis?.isCorrect && "border-emerald-500 bg-emerald-50",
          analysis && !analysis.isCorrect && "border-rose-500 bg-rose-50"
        )}
      />

      {analysis && <GrammarFeedback analysis={analysis} expected={current.de} />}

      <div className="flex flex-wrap justify-center gap-2">
        {!analysis && <Button variant="primary" onClick={check}>Verifica</Button>}
        <Button variant="warning" size="sm" onClick={() => { setInput(current.de); setAnalysis(analyzeAnswer(current.de, current.de)); }}>
          <Eye size={14} /> Arata
        </Button>
        <Button variant="tts" size="sm" onClick={() => speak(current.de)}><Volume2 size={14} /> Audio</Button>
        <Button variant="primary" onClick={newQ}>Fraza noua →</Button>
      </div>
      <p className="text-xs text-slate-400 text-center italic">Cel mai dificil exercitiu, dar cel mai eficient pentru memorare.</p>
    </div>
  );
}
