// ============================================================
// Context Scenario Generator (Phase 1)
// ------------------------------------------------------------
// Calls a Supabase Edge Function (`generate-grammar`) which holds
// the actual AI API key (LOVABLE_API_KEY) server-side and proxies
// the request to the Lovable AI gateway (Gemini).
//
// Why a server proxy?
//   - The AI key never reaches the client (zero exposure).
//   - We can add rate limiting / quotas later.
//
// Falls back to local mock data if Supabase isn't configured or
// the Edge Function returns an error.
// ============================================================

import type { ContextPack, Difficulty, GeneratedExercise } from "@/types";
import { findPack } from "./contextPacks";
import { getSupabase, hasSupabase } from "@/integrations/supabase/client";

interface GenerateOptions {
  packId: ContextPack["id"];
  difficulty: Difficulty;
  count?: number;
}

const VALID_TYPES = ["Lückentext", "Multiple Choice", "Umformung", "Satzbau", "Fehlerkorrektur"] as const;
const VALID_DIFFICULTIES: readonly Difficulty[] = ["Usor", "Mediu", "Greu"] as const;

function validateExercise(ex: any, idx: number): GeneratedExercise {
  if (!VALID_TYPES.includes(ex?.type)) throw new Error(`Invalid type: ${ex?.type}`);
  if (!VALID_DIFFICULTIES.includes(ex?.difficulty)) throw new Error(`Invalid difficulty: ${ex?.difficulty}`);
  if (!ex?.question || !ex?.correctAnswer || !ex?.explanationRomanian) {
    throw new Error("Exercise missing required fields");
  }
  if (ex.type === "Multiple Choice") {
    if (!Array.isArray(ex.options) || ex.options.length !== 4) {
      throw new Error("Multiple Choice must have exactly 4 options");
    }
    if (!ex.options.includes(ex.correctAnswer)) {
      throw new Error("correctAnswer must be one of the options");
    }
  }
  if (ex.type === "Satzbau" && (!Array.isArray(ex.options) || ex.options.length < 3)) {
    throw new Error("Satzbau requires options (words to reorder)");
  }
  return {
    id: ex.id || `generated-${idx + 1}`,
    type: ex.type,
    difficulty: ex.difficulty,
    question: ex.question,
    options: ex.options ?? null,
    correctAnswer: ex.correctAnswer,
    explanationRomanian: ex.explanationRomanian,
  };
}

// ============================================================
// MOCK DATA - returned when no API key is configured.
// All content is original (kept short - 3 per pack per difficulty).
// ============================================================
const MOCK_BY_PACK: Record<ContextPack["id"], GeneratedExercise[]> = {
  "software-engineering": [
    { id: "se-mock-1", type: "Lückentext", difficulty: "Usor", question: "Ich ___ einen Pull Request für das neue Feature.", options: null, correctAnswer: "öffne", explanationRomanian: "'oeffnen' la persoana 1 singular -> 'ich oeffne'. Verb regulat." },
    { id: "se-mock-2", type: "Multiple Choice", difficulty: "Mediu", question: "Im Daily Stand-up sprechen wir ___ die Aufgaben für heute.", options: ["mit", "über", "auf", "von"], correctAnswer: "über", explanationRomanian: "'sprechen ÜBER + Akk.' = a vorbi DESPRE un subiect. 'sprechen mit' = a vorbi CU cineva." },
    { id: "se-mock-3", type: "Satzbau", difficulty: "Mediu", question: "Ordoneaza cuvintele:", options: ["habe", "den", "Code", "Ich", "gestern", "deployed"], correctAnswer: "Ich habe gestern den Code deployed", explanationRomanian: "Perfekt: haben + Partizip la sfarsit. S + V(aux) + adv + Akk + Partizip." },
    { id: "se-mock-4", type: "Fehlerkorrektur", difficulty: "Greu", question: 'Corecteaza: "Der Bug muss behoben werden bis morgen."', options: null, correctAnswer: "Der Bug muss bis morgen behoben werden", explanationRomanian: "In pasiv cu modal: complement temporal inainte de Partizip + werden. Topica: S + Modal + complement + Partizip + werden." },
    { id: "se-mock-5", type: "Umformung", difficulty: "Mediu", question: 'Trecut (Perfekt): "Ich teste die Funktion."', options: null, correctAnswer: "Ich habe die Funktion getestet", explanationRomanian: "testen + haben. Partizip 'getestet'. Aux. pe poz.2, Partizip la sfarsit." },
  ],
  "switzerland-life": [
    { id: "ch-mock-1", type: "Lückentext", difficulty: "Usor", question: "Ich gehe ___ Gemeinde, um mich anzumelden.", options: null, correctAnswer: "zur", explanationRomanian: "'zu + der' = 'zur' (Dativ feminin). Institutii cer 'zu' + Dat." },
    { id: "ch-mock-2", type: "Multiple Choice", difficulty: "Mediu", question: "Die Krankenkasse ist ___ obligatorisch.", options: ["in der Schweiz", "in die Schweiz", "auf die Schweiz", "in Schweiz"], correctAnswer: "in der Schweiz", explanationRomanian: "Tara cu articol: 'die Schweiz'. 'in' + Dat. pentru loc (wo?) -> 'in der Schweiz'." },
    { id: "ch-mock-3", type: "Fehlerkorrektur", difficulty: "Greu", question: 'Corecteaza: "Ich bezahle die Miete mit Bankueberweisung jeden Monat."', options: null, correctAnswer: "Ich bezahle die Miete jeden Monat mit Bankueberweisung", explanationRomanian: "Topica TeKaMoLo: Temporal (jeden Monat) inainte de Modal (mit Bankueberweisung)." },
    { id: "ch-mock-4", type: "Satzbau", difficulty: "Mediu", question: "Ordoneaza:", options: ["habe", "Mietvertrag", "ich", "einen", "unterschrieben"], correctAnswer: "Ich habe einen Mietvertrag unterschrieben", explanationRomanian: "Perfekt: habe + Akk (einen Mietvertrag) + Partizip (unterschrieben) la sfarsit." },
    { id: "ch-mock-5", type: "Umformung", difficulty: "Mediu", question: 'Inlocuieste cu pronume: "Ich rufe den Vermieter an."', options: null, correctAnswer: "Ich rufe ihn an", explanationRomanian: "den Vermieter (m. Akk.) -> ihn. Verb separabil 'anrufen': prefixul ramane la sfarsit." },
  ],
  "health-nutrition": [
    { id: "hn-mock-1", type: "Lückentext", difficulty: "Usor", question: "Ich ___ jeden Tag ins Fitnessstudio.", options: null, correctAnswer: "gehe", explanationRomanian: "ich + gehen -> ich gehe. Verb regulat." },
    { id: "hn-mock-2", type: "Multiple Choice", difficulty: "Mediu", question: "Nach dem Training trinke ich einen ___.", options: ["Proteinshake", "Proteinshakes", "Proteinshaken", "Proteinshaker"], correctAnswer: "Proteinshake", explanationRomanian: "der Proteinshake (m.) la Akk: einen Proteinshake." },
    { id: "hn-mock-3", type: "Satzbau", difficulty: "Mediu", question: "Ordoneaza:", options: ["esse", "Eier", "ich", "viel", "Protein"], correctAnswer: "Ich esse viel Protein und Eier", explanationRomanian: "Topica simpla: S + V + complement." },
    { id: "hn-mock-4", type: "Fehlerkorrektur", difficulty: "Greu", question: 'Corecteaza: "Ich habe gestern dreimal trainiert weil ich starker werden will."', options: null, correctAnswer: "Ich habe gestern dreimal trainiert, weil ich staerker werden will", explanationRomanian: "weil cere virgula + verb modal 'will' la SFARSIT absolut. Plus 'staerker' (umlaut)." },
    { id: "hn-mock-5", type: "Umformung", difficulty: "Mediu", question: 'Trecut (Perfekt): "Ich koche Huehnchen mit Reis."', options: null, correctAnswer: "Ich habe Huehnchen mit Reis gekocht", explanationRomanian: "kochen + haben. Partizip 'gekocht' la sfarsit." },
  ],
  "board-games": [
    { id: "bg-mock-1", type: "Lückentext", difficulty: "Usor", question: "Wer ___ heute der erste Spieler?", options: null, correctAnswer: "ist", explanationRomanian: "wer = cine, pers. 3 sg. -> ist. 'sein' la persoana a 3-a singular." },
    { id: "bg-mock-2", type: "Multiple Choice", difficulty: "Mediu", question: "Du bist ___ der Reihe.", options: ["an", "auf", "in", "zu"], correctAnswer: "an", explanationRomanian: "'an der Reihe sein' = a fi la rand. Expresie fixa cu 'an + Dat.'." },
    { id: "bg-mock-3", type: "Satzbau", difficulty: "Mediu", question: "Ordoneaza:", options: ["wuerfeln", "muessen", "Wir", "drei", "Mal"], correctAnswer: "Wir muessen drei Mal wuerfeln", explanationRomanian: "Modal pe poz.2 + INFINITIV (wuerfeln) la sfarsit." },
    { id: "bg-mock-4", type: "Fehlerkorrektur", difficulty: "Greu", question: 'Corecteaza: "Ich habe das Spiel gewinnt."', options: null, correctAnswer: "Ich habe das Spiel gewonnen", explanationRomanian: "gewinnen e neregulat -> Partizip 'gewonnen' (nu 'gewinnt'). Cu haben la Perfekt." },
    { id: "bg-mock-5", type: "Umformung", difficulty: "Mediu", question: 'Inlocuieste cu pronume: "Ich ziehe die Karte."', options: null, correctAnswer: "Ich ziehe sie", explanationRomanian: "die Karte (f. Akk.) -> sie. Pronumele Akk feminin singular." },
  ],
};

function filterByDifficulty(exs: GeneratedExercise[], d: Difficulty): GeneratedExercise[] {
  return exs.filter((e) => e.difficulty === d);
}

export interface GenerationResult {
  exercises: GeneratedExercise[];
  source: "edge-function" | "mock";
  error?: string;
}

/**
 * Main entry. Tries the Supabase Edge Function, falls back to local mocks on any error.
 */
export async function generateExercises(opts: GenerateOptions): Promise<GenerationResult> {
  const pack = findPack(opts.packId);
  if (!pack) throw new Error(`Unknown pack id: ${opts.packId}`);
  const count = opts.count ?? 5;

  // 1. Try Supabase Edge Function
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke("generate-grammar", {
        body: { packId: opts.packId, difficulty: opts.difficulty, count },
      });
      if (error) throw error;
      if (!data?.exercises || !Array.isArray(data.exercises)) {
        throw new Error("Edge function returned invalid shape");
      }
      const validated = (data.exercises as unknown[]).map((ex, i) => validateExercise(ex, i));
      return { exercises: validated, source: "edge-function" };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      // Fall through to mock
      const fallback = filterByDifficulty(MOCK_BY_PACK[opts.packId], opts.difficulty).slice(0, count);
      const final = fallback.length ? fallback : MOCK_BY_PACK[opts.packId].slice(0, count);
      return {
        exercises: final,
        source: "mock",
        error: `Edge function failed (${err}). Se folosesc exercitii preincarcate.`,
      };
    }
  }

  // 2. No Supabase configured at all - use mock with a hint
  const mocks = MOCK_BY_PACK[opts.packId];
  const filtered = filterByDifficulty(mocks, opts.difficulty).slice(0, count);
  return {
    exercises: filtered.length ? filtered : mocks.slice(0, count),
    source: "mock",
    error: "Supabase nu este configurat - se folosesc exercitii preincarcate (mock). Vezi README pentru setup.",
  };
}

/** Whether the Edge Function path is available. */
export function hasApiKey(): boolean {
  return hasSupabase();
}
