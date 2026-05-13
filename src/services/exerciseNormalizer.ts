// ============================================================
// Normalize exercises (legacy format + new format) to common shape.
// ============================================================

import type { GrammarExerciseRaw, NormalizedExercise, ExerciseType, ExerciseTypeRaw, Difficulty } from "@/types";

const TYPE_MAP: Record<ExerciseTypeRaw, ExerciseType> = {
  "Lückentext": "fill",
  "Multiple Choice": "choice",
  "Umformung": "transform",
  "Satzbau": "order",
  "Fehlerkorrektur": "error",
  fill: "fill",
  choice: "choice",
  transform: "transform",
  order: "order",
  error: "error",
};

export function normalizeExercise(ex: GrammarExerciseRaw, fallbackId: string): NormalizedExercise {
  const internalType: ExerciseType = TYPE_MAP[ex.type] || "fill";
  return {
    id: ex.id || fallbackId,
    type: internalType,
    rawType: ex.type,
    difficulty: (ex.difficulty as Difficulty) || "Mediu",
    prompt: ex.question ?? ex.prompt ?? "",
    answer: ex.correctAnswer ?? ex.answer ?? "",
    options: ex.options ?? null,
    explanation: ex.explanationRomanian ?? ex.explanation ?? "",
    hint: ex.hint,
  };
}
