import { useEffect, useRef, useState } from "react";
import { Volume2, Lightbulb, Eye } from "lucide-react";
import type { Phrase } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { pick, stripPunct, normalizeDE } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

interface Props { phrases: Phrase[]; onAnswer?: () => void; }

// Words we prefer to blank out (connectors, articles, common verbs/pronouns)
const PRIORITY_WORDS = new Set([
  "weil", "wenn", "dass", "obwohl", "denn", "deshalb", "deswegen", "damit", "falls",
  "sobald", "während", "nachdem", "bevor", "seitdem", "als", "ob", "sondern",
  "trotzdem", "aber", "oder", "und", "sowohl", "weder", "noch", "zwar",
  "der", "die", "das", "dem", "den", "des", "denen", "dessen", "deren",
  "ein", "eine", "einer", "einen", "einem", "eines",
  "mein", "meine", "meiner", "meinen", "meinem", "meines",
  "kein", "keine", "keiner", "keinen", "keinem",
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mich", "dich", "ihn", "uns", "euch",
  "mir", "dir", "ihm", "ihnen",
  "an", "auf", "in", "von", "zu", "bei", "mit", "nach", "für", "um", "über",
  "ist", "sind", "bin", "bist", "seid", "war", "waren",
  "habe", "hast", "hat", "haben", "habt", "hatte", "hatten",
  "kann", "kannst", "können", "könnt", "muss", "musst", "müssen", "müsst",
  "will", "willst", "wollen", "wollt", "möchte", "möchtest", "möchten",
  "wo", "wann", "wer", "was", "wie", "warum", "welche", "welcher", "welches",
]);

interface BlankToken {
  tokenIndex: number;
  word: string;
}

function tokenize(s: string): string[] {
  return s.split(/(\s+)/).filter((t) => t.length > 0);
}

function pickBlanks(phrase: Phrase): { tokens: string[]; blanks: BlankToken[] } {
  const tokens = tokenize(phrase.de);
  const candidates: { tokenIndex: number; word: string; priority: number }[] = [];
  tokens.forEach((tok, i) => {
    if (/\s+/.test(tok)) return;
    const clean = stripPunct(tok);
    if (clean.length < 2 || /^\d+$/.test(clean)) return;
    let priority = 1;
    if (PRIORITY_WORDS.has(clean.toLowerCase())) priority = 3;
    else if (clean.length >= 6) priority = 2;
    candidates.push({ tokenIndex: i, word: clean, priority });
  });
  if (!candidates.length) return { tokens, blanks: [] };
  const n = candidates.length;
  let target = n <= 4 ? 1 : n <= 7 ? 2 : n <= 12 ? 3 : 4;
  candidates.sort((a, b) => b.priority - a.priority || Math.random() - 0.5);
  const picked = candidates.slice(0, target).sort((a, b) => a.tokenIndex - b.tokenIndex);
  return { tokens, blanks: picked.map(({ tokenIndex, word }) => ({ tokenIndex, word })) };
}

function normFib(s: string): string {
  return normalizeDE(s);
}

export function FraMultiBlank({ phrases, onAnswer }: Props) {
  const [stats, setStats] = useLocalStorage("fra_mb_stats_v2", { correct: 0, total: 0 });
  const [current, setCurrent] = useState<Phrase | null>(null);
  const [data, setData] = useState<{ tokens: string[]; blanks: BlankToken[] } | null>(null);
  const [values, setValues] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ allCorrect: boolean; per: boolean[]; revealed: boolean } | null>(null);
  const { speak } = useTTS();
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const newQ = () => {
    if (!phrases.length) return;
    const p = pick(phrases);
    const d = pickBlanks(p);
    setCurrent(p);
    setData(d);
    setValues(d.blanks.map(() => ""));
    setFeedback(null);
  };

  useEffect(newQ, [phrases]);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [current]);

  if (!phrases.length) return <EmptyState title="Nicio fraza" description="Schimba categoria." />;
  if (!current || !data) return null;

  const check = () => {
    const per = data.blanks.map((b, i) => normFib(values[i] || "") === normFib(b.word));
    const allCorrect = per.every(Boolean);
    setFeedback({ allCorrect, per, revealed: false });
    setStats((s) => ({ correct: s.correct + (allCorrect ? 1 : 0), total: s.total + 1 }));
    onAnswer?.();
  };

  const reveal = () => {
    setValues(data.blanks.map((b) => b.word));
    setFeedback({ allCorrect: false, per: data.blanks.map(() => true), revealed: true });
  };

  let blankIdx = 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.correct} label="Corecte" />
        <StatCard value={stats.total} label="Total" />
        <StatCard value={data.blanks.length} label="Spatii" />
      </div>

      <div className="bg-slate-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="text-xs text-slate-500 uppercase mb-1 tracking-wider">{current.cat}</div>
        <div className="text-sm text-slate-600 italic mb-3">Hint romana: {current.ro}</div>
        <div className="text-lg leading-loose text-slate-800">
          {data.tokens.map((tok, ti) => {
            if (/\s+/.test(tok)) return <span key={ti}>{tok}</span>;
            const blank = data.blanks.find((b) => b.tokenIndex === ti);
            if (blank) {
              const i = blankIdx++;
              const ok = feedback?.per[i];
              const tail = tok.length > blank.word.length ? tok.substring(blank.word.length) : "";
              return (
                <span key={ti}>
                  <input
                    ref={i === 0 ? firstInputRef : null}
                    value={values[i]}
                    disabled={!!feedback && !feedback.revealed}
                    onChange={(e) => {
                      const next = values.slice();
                      next[i] = e.target.value;
                      setValues(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") check();
                    }}
                    style={{ minWidth: `${Math.max(60, blank.word.length * 12 + 30)}px` }}
                    className={cn(
                      "inline-block px-2 py-1 mx-1 border-b-2 outline-none bg-slate-100 rounded-t",
                      !feedback && "border-blue-500 focus:bg-white",
                      feedback && ok && "border-emerald-500 bg-emerald-50 text-emerald-800",
                      feedback && !ok && "border-rose-500 bg-rose-50 text-rose-800"
                    )}
                  />
                  {tail.trim()}
                </span>
              );
            }
            return <span key={ti}>{tok}</span>;
          })}
        </div>
      </div>

      {feedback && (
        <div className={cn(
          "rounded-xl p-4 border",
          feedback.allCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          {feedback.allCorrect ? (
            <p className="font-semibold">Corect tot! Fraza completa: {current.de}</p>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold">Mai incearca! Raspunsuri corecte:</p>
              <ul className="text-sm space-y-1">
                {data.blanks.map((b, i) => (
                  <li key={i}>
                    {feedback.per[i] ? "✓" : "✗"} <strong>{b.word}</strong>
                    {!feedback.per[i] && values[i] && <span className="opacity-70"> (ai scris: {values[i]})</span>}
                  </li>
                ))}
              </ul>
              <p className="text-sm pt-2 border-t border-rose-200">Fraza completa: <strong>{current.de}</strong></p>
            </div>
          )}
          {current.grammar && (
            <p className="text-xs mt-2 italic opacity-90"><Lightbulb size={11} className="inline mr-1" />{current.grammar}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!feedback && <Button variant="primary" onClick={check}>Verifica</Button>}
        <Button variant="warning" size="sm" onClick={reveal}><Eye size={14} /> Arata</Button>
        <Button variant="tts" size="sm" onClick={() => speak(current.de)}><Volume2 size={14} /> Audio</Button>
        <Button variant="secondary" size="sm" onClick={newQ}>Fraza noua</Button>
      </div>
    </div>
  );
}
