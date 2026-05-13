import { useEffect, useState } from "react";
import { Eye, Lightbulb, AlertCircle, SkipForward, ArrowRight } from "lucide-react";
import type { NormalizedExercise, GrammarAnalysis } from "@/types";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { GrammarFeedback } from "@/components/feedback/GrammarFeedback";
import { analyzeAnswer } from "@/services/grammarAnalyzer";
import { shuffle, normalizeDE } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  exercises: NormalizedExercise[];
  onResult: (exId: string, correct: boolean) => void;
}

const TYPE_LABEL: Record<string, string> = {
  fill: "Completeaza",
  choice: "Alegere multipla",
  transform: "Transforma",
  order: "Ordoneaza cuvintele",
  error: "Gaseste greseala",
};

export function ExercisePlayer({ exercises, onResult }: Props) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GrammarAnalysis | null>(null);
  const [orderPool, setOrderPool] = useState<{ id: number; text: string }[]>([]);
  const [orderBuilt, setOrderBuilt] = useState<{ id: number; text: string }[]>([]);

  // Reset state when current exercise changes
  useEffect(() => {
    setInput("");
    setPicked(null);
    setAnalysis(null);
    const ex = exercises[idx];
    if (!ex) return;
    if (ex.type === "order") {
      const words = (ex.options && ex.options.length ? ex.options : ex.answer.split(/\s+/)).map((w, i) => ({ id: i, text: w }));
      setOrderPool(shuffle(words));
      setOrderBuilt([]);
    }
  }, [idx, exercises]);

  if (!exercises.length) {
    return <EmptyState title="Niciun exercitiu cu filtrul curent" description="Schimba filtrele de mai sus." />;
  }

  // Clamp idx
  if (idx >= exercises.length) {
    setIdx(0);
    return null;
  }
  const ex = exercises[idx];

  const next = () => setIdx((i) => Math.min(i + 1, exercises.length - 1));
  const skip = () => next();

  const checkText = (userText: string) => {
    const a = analyzeAnswer(userText, ex.answer);
    setAnalysis(a);
    onResult(ex.id, a.isCorrect);
  };

  const onSubmit = () => {
    if (analysis) return;
    if (ex.type === "choice") return; // handled by click
    if (ex.type === "order") {
      const userText = orderBuilt.map((b) => b.text).join(" ");
      checkText(userText);
    } else {
      checkText(input);
    }
  };

  const onPickChoice = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const correct = normalizeDE(opt) === normalizeDE(ex.answer);
    setAnalysis({
      isCorrect: correct,
      errorType: correct ? "unknown" : "spelling",
      description: correct ? "Corect!" : `Raspuns corect: ${ex.answer}`,
      tokens: [],
    });
    onResult(ex.id, correct);
  };

  const reveal = () => {
    if (ex.type === "order") {
      const correctWords = ex.answer.split(/\s+/).map((w, i) => ({ id: i, text: w }));
      setOrderBuilt(correctWords);
      setOrderPool([]);
    } else if (ex.type !== "choice") {
      setInput(ex.answer);
    }
    setAnalysis(analyzeAnswer(ex.answer, ex.answer));
  };

  const diffTone = ex.difficulty === "Usor" ? "green" : ex.difficulty === "Mediu" ? "amber" : "rose";

  // For "error" type, try to extract the quoted wrong sentence
  let promptHeader = ex.prompt;
  let wrongQuoted: string | null = null;
  if (ex.type === "error") {
    const m = ex.prompt.match(/[\""]([^\""]+)[\""]/);
    if (m) {
      promptHeader = ex.prompt.substring(0, m.index || 0).replace(/\n/g, " ").trim() || "Gaseste greseala si scrie versiunea corecta:";
      wrongQuoted = m[1];
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Exercitiul {idx + 1} din {exercises.length}
        </span>
        <div className="flex gap-2">
          <Pill tone="blue">{TYPE_LABEL[ex.type] || ex.rawType}</Pill>
          <Pill tone={diffTone}>{ex.difficulty}</Pill>
        </div>
      </div>

      <div className="bg-slate-50 border-l-4 border-blue-500 rounded-xl p-5">
        <p className="text-base md:text-lg text-slate-800 leading-relaxed whitespace-pre-line">{promptHeader}</p>
        {wrongQuoted && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 italic text-rose-800">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{wrongQuoted}</span>
          </div>
        )}
      </div>

      {/* Render input by type */}
      {(ex.type === "fill" || ex.type === "transform" || ex.type === "error") && (
        <input
          type="text"
          value={input}
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          disabled={!!analysis}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={ex.type === "error" ? "Scrie propozitia corecta..." : "Scrie raspunsul..."}
          className={cn(
            "w-full p-4 border-2 rounded-xl outline-none transition-all text-base",
            !analysis && "border-slate-200 focus:border-blue-500",
            analysis?.isCorrect && "border-emerald-500 bg-emerald-50",
            analysis && !analysis.isCorrect && "border-rose-500 bg-rose-50"
          )}
        />
      )}

      {ex.type === "choice" && ex.options && (
        <div className="space-y-2">
          {ex.options.map((o) => {
            const isCorrect = normalizeDE(o) === normalizeDE(ex.answer);
            const isPicked = picked === o;
            return (
              <button
                key={o}
                disabled={!!picked}
                onClick={() => onPickChoice(o)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left text-base transition-all",
                  !picked && "border-slate-200 bg-white hover:border-blue-400",
                  picked && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-800",
                  picked && !isCorrect && isPicked && "border-rose-500 bg-rose-50 text-rose-800",
                  picked && !isCorrect && !isPicked && "opacity-50"
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}

      {ex.type === "order" && (
        <>
          <div className="min-h-[70px] bg-blue-50 border-2 border-blue-300 rounded-xl p-3 flex flex-wrap gap-2 items-start">
            {orderBuilt.length === 0 ? (
              <span className="text-slate-400 italic text-sm self-center">Click pe cuvinte pentru a forma fraza aici</span>
            ) : (
              orderBuilt.map((w, i) => (
                <button
                  key={`${w.id}-${i}`}
                  disabled={!!analysis}
                  onClick={() => {
                    setOrderBuilt(orderBuilt.filter((_, j) => j !== i));
                    setOrderPool([...orderPool, w]);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm"
                >
                  {w.text}
                </button>
              ))
            )}
          </div>
          <div className="min-h-[70px] bg-white border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-wrap gap-2">
            {orderPool.map((w) => (
              <button
                key={w.id}
                disabled={!!analysis}
                onClick={() => {
                  setOrderBuilt([...orderBuilt, w]);
                  setOrderPool(orderPool.filter((p) => p.id !== w.id));
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm"
              >
                {w.text}
              </button>
            ))}
            {!orderPool.length && <span className="text-slate-400 italic text-sm self-center">Toate cuvintele sunt plasate</span>}
          </div>
        </>
      )}

      {/* Smart feedback (Grammar Debugger) */}
      {analysis && <GrammarFeedback analysis={analysis} expected={ex.answer} />}

      {/* Explanation always shown after answer */}
      {analysis && ex.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-2">
          <Lightbulb size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 leading-relaxed"><strong>Explicatie: </strong>{ex.explanation}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {!analysis && ex.type !== "choice" && <Button variant="primary" onClick={onSubmit}>Verifica</Button>}
        {ex.hint && !analysis && (
          <Button variant="warning" size="sm" onClick={() => alert(`Indiciu: ${ex.hint}`)}>
            <Lightbulb size={14} /> Indiciu
          </Button>
        )}
        {!analysis && <Button variant="secondary" size="sm" onClick={reveal}><Eye size={14} /> Arata</Button>}
        {!analysis && <Button variant="ghost" size="sm" onClick={skip}><SkipForward size={14} /> Sari</Button>}
        {analysis && <Button variant="success" onClick={next}>Urmator <ArrowRight size={14} /></Button>}
      </div>
    </div>
  );
}
