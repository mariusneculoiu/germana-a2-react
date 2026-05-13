import type { ContextPack } from "@/types";

export const CONTEXT_PACKS: readonly ContextPack[] = [
  {
    id: "software-engineering",
    label_ro: "Software Engineering",
    label_en: "Software Engineering",
    description_ro: "Daily stand-up, code review, pull request, deployment, debugging.",
    emoji: "💻",
    themes: ["Daily Stand-up", "Code Review", "Bug fix", "Deployment", "Pair Programming", "Sprint Planning"],
    vocabulary_hints: [
      "der Code", "die Funktion", "der Fehler", "der Pull Request", "die Besprechung",
      "das Meeting", "der Build", "die Datenbank", "das Repository", "deploylieren",
      "testen", "implementieren", "refaktorieren", "der Sprint", "die Aufgabe",
    ],
  },
  {
    id: "switzerland-life",
    label_ro: "Viata in Elvetia",
    label_en: "Living in Switzerland",
    description_ro: "Administratie, chirie, asigurari, magazine, transport public, banci.",
    emoji: "🇨🇭",
    themes: ["Administratie/Gemeinde", "Chirie/Wohnung", "Asigurare medicala", "Migros/Coop", "Transport SBB", "Bank"],
    vocabulary_hints: [
      "die Gemeinde", "die Anmeldung", "der Mietvertrag", "die Kaution", "die Krankenkasse",
      "die Versicherung", "das Konto", "die SBB", "die Halbtaxabo", "der Coiffeur",
      "die Steuern", "der Lohnausweis", "der Personalausweis", "die Aufenthaltsbewilligung",
    ],
  },
  {
    id: "health-nutrition",
    label_ro: "Sanatate si Nutritie",
    label_en: "Health & Nutrition",
    description_ro: "Sala de sport, retete proteice, alimentatie, sanatate.",
    emoji: "💪",
    themes: ["Fitness/Gym", "Retete proteice", "Macronutrienti", "Antrenament", "Recuperare"],
    vocabulary_hints: [
      "das Fitnessstudio", "das Training", "die Wiederholung", "der Satz", "die Protein",
      "die Kohlenhydrate", "die Mahlzeit", "das Rezept", "kochen", "braten",
      "die Muskeln", "die Erholung", "der Schmerz", "gesund", "das Gemuese",
    ],
  },
  {
    id: "board-games",
    label_ro: "Board games / Strategie",
    label_en: "Board Games / Strategy",
    description_ro: "Reguli, runda, strategie, victorie, jocuri cu prieteni.",
    emoji: "🎲",
    themes: ["Regulile jocului", "Strategie", "Runda", "Castig/pierdere", "Carti/zaruri", "Jocuri populare"],
    vocabulary_hints: [
      "das Brettspiel", "die Regel", "die Runde", "der Zug", "der Wuerfel",
      "die Karte", "der Spieler", "der Gegner", "die Strategie", "gewinnen",
      "verlieren", "die Punkte", "die Figur", "das Spielfeld", "der Sieg",
    ],
  },
];

export function findPack(id: string): ContextPack | undefined {
  return CONTEXT_PACKS.find((p) => p.id === id);
}
