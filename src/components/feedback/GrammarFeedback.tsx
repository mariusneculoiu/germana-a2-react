// ============================================================
// Grammar Feedback Component
// Visual breakdown of why an answer is wrong (Phase 1).
// ============================================================

import { motion } from "motion/react";
import { CheckCircle2, XCircle, AlertTriangle, Lightbulb } from "lucide-react";
import type { GrammarAnalysis } from "@/types";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

interface Props {
  analysis: GrammarAnalysis;
  expected: string;
  className?: string;
}

export function GrammarFeedback({ analysis, expected, className }: Props) {
  const correct = analysis.isCorrect;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border-2 p-5",
        correct ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", correct ? "text-emerald-600" : "text-rose-600")}>
          {correct ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn("font-bold text-base", correct ? "text-emerald-800" : "text-rose-800")}>
              {correct ? "Corect!" : "Hai sa vedem greseala"}
            </h4>
            {!correct && analysis.errorType !== "unknown" && (
              <Pill tone="rose">{labelForError(analysis.errorType)}</Pill>
            )}
          </div>

          {!correct && (
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">{analysis.description}</p>
          )}

          {/* Token-level diff */}
          {!correct && analysis.tokens.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Comparatie cuvant cu cuvant
              </div>
              <div className="flex flex-wrap gap-1.5 leading-loose">
                {analysis.tokens.map((t, i) => {
                  if (t.type === "ok") {
                    return (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-sm">
                        {t.user}
                      </span>
                    );
                  }
                  if (t.type === "missing") {
                    return (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-sm border border-dashed border-amber-400">
                        lipseste: {t.expected}
                      </span>
                    );
                  }
                  if (t.type === "extra") {
                    return (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-sm line-through">
                        {t.user}
                      </span>
                    );
                  }
                  return (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-sm border border-rose-300">
                      <span className="line-through opacity-70">{t.user}</span>
                      <span className="mx-1">→</span>
                      <span className="font-semibold">{t.expected}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual hint - especially for word order errors */}
          {!correct && analysis.errorType === "word-order-v2" && analysis.metadata?.verbPosition && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <strong>Regula V2:</strong> in propozitia principala, verbul conjugat este intotdeauna pe pozitia 2.
                Tu ai pus verbul pe pozitia {analysis.metadata.verbPosition}.
              </div>
            </div>
          )}
          {!correct && analysis.errorType === "word-order-verb-end" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <strong>Subordonata:</strong> dupa weil/wenn/dass/obwohl/... verbul conjugat trece la SFARSIT.
              </div>
            </div>
          )}
          {!correct && (analysis.errorType === "case-mismatch" || analysis.errorType === "gender-mismatch") && analysis.metadata?.detectedCase && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Lightbulb size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <strong>Caz necesar:</strong> {analysis.metadata.detectedCase}
                {analysis.metadata.detectedGender && ` - gen ${humanGender(analysis.metadata.detectedGender)}`}.
              </div>
            </div>
          )}

          {analysis.hint && !correct && (
            <p className="mt-3 text-xs italic text-slate-500">
              <Lightbulb size={12} className="inline mr-1" />
              {analysis.hint}
            </p>
          )}

          {!correct && (
            <div className="mt-3 pt-3 border-t border-rose-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 mb-1">Versiunea corecta</div>
              <p className="font-mono text-sm text-slate-800">{expected}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function labelForError(t: GrammarAnalysis["errorType"]): string {
  switch (t) {
    case "word-order-v2": return "Ordinea V2";
    case "word-order-verb-end": return "Verb la sfarsit";
    case "case-mismatch": return "Caz gresit";
    case "gender-mismatch": return "Gen gresit";
    case "missing-word": return "Cuvant lipsa";
    case "extra-word": return "Cuvant in plus";
    case "spelling": return "Ortografie";
    default: return "Eroare";
  }
}

function humanGender(g: "m" | "f" | "n" | "pl"): string {
  return { m: "masculin", f: "feminin", n: "neutru", pl: "plural" }[g];
}
