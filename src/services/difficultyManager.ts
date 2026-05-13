// ============================================================
// Progressive Difficulty Manager
// ------------------------------------------------------------
// Tracks last 10 results per topic/scope and auto-advances level
// when success rate >= 80%, demotes when <= 30%.
// ============================================================

import type { Difficulty, DifficultyHistory } from "@/types";

const LEVELS: readonly Difficulty[] = ["Usor", "Mediu", "Greu"] as const;
const WINDOW = 10;
const PROMOTE_THRESHOLD = 0.8;
const DEMOTE_THRESHOLD = 0.3;

/** Returns a fresh, empty history at the lowest level. */
export function makeHistory(): DifficultyHistory {
  return {
    recent: [],
    currentLevel: "Usor",
    totalCorrect: 0,
    totalAttempts: 0,
  };
}

/** Compute success rate of the last N results (1.0 if no data). */
export function recentSuccessRate(h: DifficultyHistory): number {
  if (h.recent.length === 0) return 0;
  const correct = h.recent.filter(Boolean).length;
  return correct / h.recent.length;
}

/** Record a result and possibly advance/demote difficulty. */
export function recordResult(h: DifficultyHistory, correct: boolean): DifficultyHistory {
  const recent = [...h.recent, correct].slice(-WINDOW);
  let level = h.currentLevel;
  if (recent.length >= WINDOW) {
    const rate = recent.filter(Boolean).length / recent.length;
    if (rate >= PROMOTE_THRESHOLD) {
      const idx = LEVELS.indexOf(level);
      if (idx < LEVELS.length - 1) {
        level = LEVELS[idx + 1];
      }
    } else if (rate <= DEMOTE_THRESHOLD) {
      const idx = LEVELS.indexOf(level);
      if (idx > 0) {
        level = LEVELS[idx - 1];
      }
    }
  }
  return {
    recent,
    currentLevel: level,
    totalCorrect: h.totalCorrect + (correct ? 1 : 0),
    totalAttempts: h.totalAttempts + 1,
  };
}

/** Should we promote next time? Useful for UI hints. */
export function isCloseToPromote(h: DifficultyHistory): boolean {
  if (h.recent.length < WINDOW - 2) return false;
  return recentSuccessRate(h) >= PROMOTE_THRESHOLD - 0.1;
}

/** Reset history but keep totals. */
export function softReset(h: DifficultyHistory): DifficultyHistory {
  return { ...h, recent: [] };
}
