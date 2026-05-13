// ============================================================
// Core types - strict TypeScript interfaces
// ============================================================

// ===== Vocab =====
export interface VocabEntry {
  ro: string;
  de: string;
  section_ro: string;
  section_de: string;
}

// ===== Phrases =====
export interface Phrase {
  id: number;
  cat: string;
  de: string;
  ro: string;
  grammar?: string;
}

// ===== Grammar =====
export type Difficulty = "Usor" | "Mediu" | "Greu";
export type Level = "A1" | "A2" | "B1";
export type ExerciseTypeRaw =
  | "Lückentext"
  | "Multiple Choice"
  | "Umformung"
  | "Satzbau"
  | "Fehlerkorrektur"
  // Legacy types from older topics:
  | "fill"
  | "choice"
  | "transform"
  | "order"
  | "error";

export interface GrammarExerciseRaw {
  id?: string;
  type: ExerciseTypeRaw;
  difficulty?: Difficulty;
  question?: string;
  prompt?: string; // legacy
  options?: string[] | null;
  correctAnswer?: string;
  answer?: string; // legacy
  explanationRomanian?: string;
  explanation?: string; // legacy
  hint?: string;
}

// Normalized form used everywhere internally
export type ExerciseType = "fill" | "choice" | "transform" | "order" | "error";

export interface NormalizedExercise {
  id: string;
  type: ExerciseType;
  rawType: ExerciseTypeRaw;
  difficulty: Difficulty;
  prompt: string;
  answer: string;
  options: string[] | null;
  explanation: string;
  hint?: string;
}

export interface GrammarTopic {
  id: string;
  level: Level;
  category: string;
  title_de: string;
  title_ro: string;
  summary: string;
  theory: string;
  exercises: GrammarExerciseRaw[];
}

// ===== SRS =====
export interface SrsState {
  interval: number; // days
  reps: number;
  ease: number;
  due: number; // day number since epoch
  lastReviewed: number;
}

export type CardLevel = "hard" | "medium" | "easy";

// ===== Phase 1: Scenario Generator =====
export type ContextPackId =
  | "software-engineering"
  | "switzerland-life"
  | "health-nutrition"
  | "board-games";

export interface ContextPack {
  id: ContextPackId;
  label_ro: string;
  label_en: string;
  description_ro: string;
  emoji: string;
  themes: string[];
  vocabulary_hints: string[]; // German vocabulary hints for the LLM prompt
}

export interface GeneratedExercise {
  id: string;
  type: "Lückentext" | "Multiple Choice" | "Umformung" | "Satzbau" | "Fehlerkorrektur";
  difficulty: Difficulty;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanationRomanian: string;
}

// ===== Phase 1: Grammar Debugger =====
export type GrammarErrorType =
  | "word-order-v2" // V2 rule violated (verb not on position 2)
  | "word-order-verb-end" // Subordinate verb should be at end
  | "case-mismatch" // Wrong article/declension for case
  | "gender-mismatch" // Wrong gender
  | "missing-word" // User omitted a word
  | "extra-word" // User added extra word
  | "spelling" // Misspelled word
  | "unknown"; // Couldn't determine

export interface GrammarFeedbackToken {
  type: "ok" | "wrong" | "missing" | "extra";
  user?: string;
  expected?: string;
}

export interface GrammarAnalysis {
  isCorrect: boolean;
  errorType: GrammarErrorType;
  description: string; // Romanian explanation
  tokens: GrammarFeedbackToken[];
  hint?: string;
  metadata?: {
    verbPosition?: number;
    detectedCase?: "Nominativ" | "Akkusativ" | "Dativ" | "Genitiv";
    detectedGender?: "m" | "f" | "n" | "pl";
  };
}

// ===== Phase 1: Progressive Difficulty =====
export interface DifficultyHistory {
  recent: boolean[]; // last 10 results (true=correct)
  currentLevel: Difficulty;
  totalCorrect: number;
  totalAttempts: number;
}
