// ============================================================
// Grammar Debugger - heuristic analysis of user errors
// ------------------------------------------------------------
// Compares user input against expected answer and tries to
// detect WHY they are wrong (not just THAT they are wrong).
// Designed for German A1-B1 patterns.
// ============================================================

import type {
  GrammarAnalysis,
  GrammarErrorType,
  GrammarFeedbackToken,
} from "@/types";
import { normalizeDE, stripPunct } from "@/lib/utils";

// Common German finite verbs (3rd person & infinitive endings) - a small whitelist
// used to identify the conjugated verb in a sentence heuristically.
const VERBS_HEURISTIC = new Set<string>([
  "bin", "bist", "ist", "sind", "seid",
  "habe", "hast", "hat", "haben", "habt",
  "kann", "kannst", "können", "könnt", "konnte", "konnten",
  "muss", "musst", "müssen", "müsst", "musste", "mussten",
  "will", "willst", "wollen", "wollt", "wollte", "wollten",
  "soll", "sollst", "sollen", "sollt", "sollte", "sollten",
  "darf", "darfst", "dürfen", "dürft", "durfte", "durften",
  "mag", "magst", "mögen", "mögt", "möchte", "möchtest", "möchten",
  "wird", "werden", "wirst", "wurde", "wurden",
  "lerne", "lernst", "lernt", "lernen",
  "gehe", "gehst", "geht", "gehen",
  "komme", "kommst", "kommt", "kommen",
  "spreche", "sprichst", "spricht", "sprechen",
  "esse", "isst", "essen",
  "trinke", "trinkst", "trinkt", "trinken",
  "arbeite", "arbeitest", "arbeitet", "arbeiten",
  "wohne", "wohnst", "wohnt", "wohnen",
  "lese", "liest", "lesen",
  "sehe", "siehst", "sieht", "sehen",
  "schreibe", "schreibst", "schreibt", "schreiben",
  "fahre", "fährst", "fährt", "fahren",
  "macht", "macht", "machen", "mache",
  "rufe", "rufst", "ruft", "rufen",
  "frage", "fragst", "fragt", "fragen",
  "warte", "wartest", "wartet", "warten",
  "helfe", "hilfst", "hilft", "helfen",
]);

// Subordinate-clause connectors after which the verb should go to the END.
const SUB_CONNECTORS = new Set<string>([
  "weil", "wenn", "dass", "obwohl", "damit", "falls", "sobald",
  "während", "nachdem", "bevor", "seitdem", "als", "ob",
  "wo", "wer", "was", "wie", "warum", "welche", "welcher", "welches",
]);

const ARTICLES_DETAILS: Record<string, { gender: "m" | "f" | "n" | "pl"; cases: ReadonlyArray<"Nominativ" | "Akkusativ" | "Dativ" | "Genitiv"> }> = {
  der: { gender: "m", cases: ["Nominativ"] },
  die: { gender: "f", cases: ["Nominativ", "Akkusativ"] }, // also plural
  das: { gender: "n", cases: ["Nominativ", "Akkusativ"] },
  den: { gender: "m", cases: ["Akkusativ"] },
  dem: { gender: "m", cases: ["Dativ"] }, // also neutrum
  des: { gender: "m", cases: ["Genitiv"] },
  ein: { gender: "m", cases: ["Nominativ"] },
  eine: { gender: "f", cases: ["Nominativ", "Akkusativ"] },
  einen: { gender: "m", cases: ["Akkusativ"] },
  einem: { gender: "m", cases: ["Dativ"] },
  einer: { gender: "f", cases: ["Dativ"] },
  eines: { gender: "m", cases: ["Genitiv"] },
};

function tokenize(s: string): string[] {
  return s.trim().split(/\s+/).filter((w) => w.length > 0);
}

/** Find the index of the first finite verb. Returns -1 if not found. */
function findVerbPosition(words: string[]): number {
  for (let i = 0; i < words.length; i++) {
    const w = stripPunct(words[i]).toLowerCase();
    if (VERBS_HEURISTIC.has(w)) return i;
  }
  return -1;
}

/** Build word-by-word diff between expected and user. */
function diffWords(expected: string[], user: string[]): GrammarFeedbackToken[] {
  // Simple position-based diff (good for short sentences).
  const out: GrammarFeedbackToken[] = [];
  const n = Math.max(expected.length, user.length);
  for (let i = 0; i < n; i++) {
    const e = expected[i] ?? "";
    const u = user[i] ?? "";
    if (!e) out.push({ type: "extra", user: u });
    else if (!u) out.push({ type: "missing", expected: e });
    else if (normalizeDE(e) === normalizeDE(u)) out.push({ type: "ok", user: u, expected: e });
    else out.push({ type: "wrong", user: u, expected: e });
  }
  return out;
}

/** Detect article-case mismatch (e.g., "der" used where "den" is expected). */
function detectCaseMismatch(
  tokens: GrammarFeedbackToken[]
): { errorType: GrammarErrorType; description: string; metadata?: GrammarAnalysis["metadata"] } | null {
  for (const t of tokens) {
    if (t.type !== "wrong") continue;
    const u = stripPunct(t.user ?? "").toLowerCase();
    const e = stripPunct(t.expected ?? "").toLowerCase();
    const eInfo = ARTICLES_DETAILS[e];
    const uInfo = ARTICLES_DETAILS[u];
    if (eInfo && uInfo) {
      const expectedCase = eInfo.cases[0];
      const usedCase = uInfo.cases[0];
      return {
        errorType: "case-mismatch",
        description: `Articolul gresit: ai folosit '${u}' (${usedCase}, ${uInfo.gender}), dar contextul cere '${e}' (${expectedCase}, ${eInfo.gender}).`,
        metadata: { detectedCase: expectedCase, detectedGender: eInfo.gender },
      };
    }
    if (eInfo && !uInfo) {
      return {
        errorType: "gender-mismatch",
        description: `Asteptat: '${e}' (${eInfo.gender}, ${eInfo.cases[0]}). 'der/die/das' depinde de genul substantivului.`,
        metadata: { detectedCase: eInfo.cases[0], detectedGender: eInfo.gender },
      };
    }
  }
  return null;
}

/** Detect word order violations. */
function detectWordOrder(
  expected: string[],
  user: string[]
): { errorType: GrammarErrorType; description: string; metadata?: GrammarAnalysis["metadata"] } | null {
  if (user.length < 2 || expected.length < 2) return null;
  const userLow = user.map((w) => stripPunct(w).toLowerCase());

  // Detect subordinate clause: if first word is a sub-connector, verb should be last
  if (SUB_CONNECTORS.has(userLow[0])) {
    const verbPos = findVerbPosition(user);
    if (verbPos !== -1 && verbPos < user.length - 1) {
      return {
        errorType: "word-order-verb-end",
        description: `In subordonata (dupa '${user[0]}'), verbul conjugat ('${user[verbPos]}') ar trebui sa fie la SFARSITUL propozitiei. Acum este pe pozitia ${verbPos + 1} din ${user.length}.`,
        metadata: { verbPosition: verbPos + 1 },
      };
    }
  }

  // Detect V2 in main clause: verb should be on position 2 (index 1)
  // Only check if the first word is NOT a sub-connector.
  if (!SUB_CONNECTORS.has(userLow[0])) {
    const verbPos = findVerbPosition(user);
    if (verbPos > 1) {
      return {
        errorType: "word-order-v2",
        description: `Regula V2: verbul conjugat ('${user[verbPos]}') trebuie pe pozitia 2. Acum este pe pozitia ${verbPos + 1}.`,
        metadata: { verbPosition: verbPos + 1 },
      };
    }
  }
  return null;
}

/** Main entry point. */
export function analyzeAnswer(userAnswer: string, expectedAnswer: string): GrammarAnalysis {
  const expectedWords = tokenize(expectedAnswer);
  const userWords = tokenize(userAnswer);
  const tokens = diffWords(expectedWords, userWords);

  const isCorrect = normalizeDE(userAnswer) === normalizeDE(expectedAnswer);
  if (isCorrect) {
    return {
      isCorrect: true,
      errorType: "unknown",
      description: "Corect!",
      tokens,
    };
  }

  // Try to determine specific error type, in order of specificity
  const wo = detectWordOrder(expectedWords, userWords);
  if (wo) {
    return {
      isCorrect: false,
      errorType: wo.errorType,
      description: wo.description,
      tokens,
      metadata: wo.metadata,
      hint: "Verifica unde sta verbul conjugat in propozitia ta.",
    };
  }

  const cm = detectCaseMismatch(tokens);
  if (cm) {
    return {
      isCorrect: false,
      errorType: cm.errorType,
      description: cm.description,
      tokens,
      metadata: cm.metadata,
      hint: "Atentie la genul substantivului si la cazul cerut de verb/prepozitie.",
    };
  }

  // Count missing/extra/wrong
  const missing = tokens.filter((t) => t.type === "missing").length;
  const extra = tokens.filter((t) => t.type === "extra").length;
  const wrong = tokens.filter((t) => t.type === "wrong").length;
  if (missing > 0 && extra === 0) {
    return {
      isCorrect: false,
      errorType: "missing-word",
      description: `Lipseste cel putin un cuvant (${missing} ${missing === 1 ? "cuvant" : "cuvinte"} omise).`,
      tokens,
      hint: "Recompara cu fraza asteptata si adauga cuvintele lipsa.",
    };
  }
  if (extra > 0 && missing === 0) {
    return {
      isCorrect: false,
      errorType: "extra-word",
      description: `Ai cuvinte in plus fata de fraza asteptata (${extra}).`,
      tokens,
    };
  }
  if (wrong > 0) {
    return {
      isCorrect: false,
      errorType: "spelling",
      description: `Cateva cuvinte sunt scrise/alese gresit. Verifica diferentele evidentiate.`,
      tokens,
    };
  }

  return {
    isCorrect: false,
    errorType: "unknown",
    description: "Raspunsul difera de cel asteptat. Verifica fiecare cuvant.",
    tokens,
  };
}
