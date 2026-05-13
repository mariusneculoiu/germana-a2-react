// ============================================================
// Scenario Studio (Phase 1) - Context-aware exercise generator
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import type { ContextPack, Difficulty, GeneratedExercise, NormalizedExercise } from "@/types";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { CONTEXT_PACKS } from "@/services/contextPacks";
import { generateExercises, hasApiKey } from "@/services/scenarioGenerator";
import { normalizeExercise } from "@/services/exerciseNormalizer";
import { ExercisePlayer } from "./ExercisePlayer";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DifficultyHistory } from "@/types";
import { makeHistory, recordResult } from "@/services/difficultyManager";
import { cn } from "@/lib/utils";

interface Props {
  onBack: () => void;
}

export function ScenarioStudio({ onBack }: Props) {
  const [pack, setPack] = useState<ContextPack | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Mediu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"edge-function" | "mock" | null>(null);
  const [exercises, setExercises] = useState<NormalizedExercise[]>([]);
  const [history, setHistory] = useLocalStorage<Record<string, DifficultyHistory>>("scenario_history_v1", {});

  const apiAvailable = hasApiKey();

  const generate = useCallback(async () => {
    if (!pack) return;
    setLoading(true);
    setError(null);
    setExercises([]);
    try {
      const result = await generateExercises({
        packId: pack.id,
        difficulty,
        count: 5,
      });
      const norm = result.exercises.map((ex: GeneratedExercise, i) =>
        normalizeExercise(
          {
            id: ex.id,
            type: ex.type,
            difficulty: ex.difficulty,
            question: ex.question,
            options: ex.options,
            correctAnswer: ex.correctAnswer,
            explanationRomanian: ex.explanationRomanian,
          },
          `${pack.id}-${i}`
        )
      );
      setExercises(norm);
      setSource(result.source);
      if (result.error) setError(result.error);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Generare esuata: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [pack, difficulty]);

  // Auto-difficulty: use saved history for this pack
  useEffect(() => {
    if (pack) {
      const h = history[pack.id] || makeHistory();
      setDifficulty(h.currentLevel);
    }
  }, [pack, history]);

  const handleResult = (_exId: string, correct: boolean) => {
    if (!pack) return;
    setHistory((h) => {
      const cur = h[pack.id] || makeHistory();
      const updated = recordResult(cur, correct);
      // If difficulty was auto-advanced, reflect it in the picker (next batch)
      return { ...h, [pack.id]: updated };
    });
  };

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} /> Inapoi la topicuri
      </Button>

      <header>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Scenario Studio</h1>
        </div>
        <p className="text-slate-500">Exercitii contextuale generate de AI pe domeniul tau preferat. Dificultatea creste automat cand depasesti 80% acuratete.</p>
      </header>

      {!apiAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Mod demo:</strong> Supabase nu este configurat. Se folosesc exercitii preincarcate (mock).
            Pentru generare live, configureaza <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> si <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code className="bg-amber-100 px-1 rounded">.env</code>. Vezi README.
          </div>
        </div>
      )}

      {/* Pack selection */}
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">1. Alege contextul</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONTEXT_PACKS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPack(p)}
              className={cn(
                "text-left p-4 rounded-xl border-2 transition-all",
                pack?.id === p.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{p.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900">{p.label_ro}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.description_ro}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.themes.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    {p.themes.length > 3 && <span className="text-[10px] text-slate-400">+{p.themes.length - 3}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty selection */}
      {pack && (
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">2. Dificultate</div>
          <div className="flex gap-2 flex-wrap items-center">
            {(["Usor", "Mediu", "Greu"] as Difficulty[]).map((d) => (
              <Button key={d} variant={difficulty === d ? "primary" : "ghost"} onClick={() => setDifficulty(d)} className="rounded-full">
                {d}
              </Button>
            ))}
            {history[pack.id] && (
              <Pill tone="violet">
                Recomandat: {history[pack.id].currentLevel} ({history[pack.id].totalCorrect}/{history[pack.id].totalAttempts})
              </Pill>
            )}
          </div>
        </div>
      )}

      {/* Generate */}
      {pack && (
        <Button variant="primary" size="lg" onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Se genereaza...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Genereaza 5 exercitii noi
            </>
          )}
        </Button>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Display exercises */}
      {exercises.length > 0 && (
        <div className="space-y-4 mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Exercitii generate</h2>
            <Pill tone={source === "edge-function" ? "green" : "amber"}>
              {source === "edge-function" ? "AI live (Supabase)" : "Mock"}
            </Pill>
          </div>
          <ExercisePlayer exercises={exercises} onResult={handleResult} />
        </div>
      )}
    </div>
  );
}
