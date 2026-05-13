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
  // ------------- Pack-uri noi -------------
  {
    id: "restaurant-food",
    label_ro: "Restaurant & Cafenea",
    label_en: "Restaurant & Cafe",
    description_ro: "Comanda, meniu, plata, rezervare, recomandari.",
    emoji: "🍽️",
    themes: ["Comanda mancare", "Plata", "Rezervare masa", "Plangeri politicoase", "Recomandari"],
    vocabulary_hints: [
      "die Speisekarte", "die Bestellung", "der Tisch", "die Rechnung", "das Trinkgeld",
      "reservieren", "bestellen", "bezahlen", "empfehlen", "das Hauptgericht",
      "die Vorspeise", "das Dessert", "der Kellner", "vegetarisch", "die Allergie",
    ],
  },
  {
    id: "travel-hotel",
    label_ro: "Calatorie & Hotel",
    label_en: "Travel & Hotel",
    description_ro: "Check-in, biletul de tren/avion, atractii turistice, ghid.",
    emoji: "✈️",
    themes: ["Check-in hotel", "Bilet tren/avion", "Atractii turistice", "Probleme la cazare", "Inchiriere masina"],
    vocabulary_hints: [
      "der Flug", "die Fahrkarte", "das Hotel", "die Reservierung", "das Doppelzimmer",
      "die Sehenswuerdigkeit", "das Gepaeck", "der Pass", "die Verspaetung", "umsteigen",
      "stornieren", "einchecken", "die Klimaanlage", "der Empfang", "mieten",
    ],
  },
  {
    id: "doctor-appointment",
    label_ro: "La Doctor",
    label_en: "Doctor Visit",
    description_ro: "Simptome, dureri, prescriptie medicala, programare.",
    emoji: "🩺",
    themes: ["Programare doctor", "Descriere simptome", "Reteta medicala", "Concediu medical", "Farmacia"],
    vocabulary_hints: [
      "der Arzt", "der Termin", "die Schmerzen", "das Fieber", "die Erkaeltung",
      "das Medikament", "die Spritze", "die Krankschreibung", "das Rezept", "die Apotheke",
      "die Tablette", "der Husten", "allergisch", "die Untersuchung", "die Wartezeit",
    ],
  },
  {
    id: "family-home",
    label_ro: "Familie & Casa",
    label_en: "Family & Home",
    description_ro: "Familia, parinti, copii, treburi casnice, viata de zi cu zi acasa.",
    emoji: "🏠",
    themes: ["Membrii familiei", "Treburi casnice", "Mese impreuna", "Cresterea copiilor", "Zile aniversare"],
    vocabulary_hints: [
      "die Familie", "die Eltern", "die Kinder", "der Bruder", "die Schwester",
      "die Großeltern", "der Haushalt", "kochen", "abwaschen", "putzen",
      "die Wohnung", "der Geburtstag", "das Geschenk", "die Schule", "die Hausaufgaben",
    ],
  },
  {
    id: "news-politics",
    label_ro: "Stiri & Actualitate",
    label_en: "News & Current Events",
    description_ro: "Ziar, evenimente actuale, opinii, dezbateri.",
    emoji: "📰",
    themes: ["Stiri zilnice", "Politica europeana", "Mediu", "Tehnologie", "Discutii / opinii"],
    vocabulary_hints: [
      "die Nachrichten", "die Zeitung", "das Ereignis", "die Wahl", "die Regierung",
      "die Umwelt", "die Krise", "die Diskussion", "berichten", "veroeffentlichen",
      "die Meinung", "der Politiker", "das Gesetz", "die Wirtschaft", "die Gesellschaft",
    ],
  },
  {
    id: "weather-seasons",
    label_ro: "Vremea & Anotimpurile",
    label_en: "Weather & Seasons",
    description_ro: "Prognoza meteo, anotimpuri, planuri in functie de vreme.",
    emoji: "🌤️",
    themes: ["Prognoza meteo", "Anotimpuri", "Imbracaminte", "Activitati in aer liber", "Schimbari climatice"],
    vocabulary_hints: [
      "das Wetter", "die Sonne", "der Regen", "der Schnee", "der Wind",
      "warm", "kalt", "windig", "sonnig", "regnerisch",
      "der Sommer", "der Herbst", "der Winter", "der Fruehling", "die Temperatur",
    ],
  },
  {
    id: "shopping-clothes",
    label_ro: "Cumparaturi & Haine",
    label_en: "Shopping & Clothing",
    description_ro: "Magazin, marime, culoare, reduceri, returnari.",
    emoji: "🛍️",
    themes: ["La magazin", "Marimi si culori", "Reduceri", "Returnari", "Cumparaturi online"],
    vocabulary_hints: [
      "das Geschaeft", "die Groesse", "die Farbe", "der Preis", "der Rabatt",
      "anprobieren", "zurueckgeben", "kaufen", "der Kassenbon", "die Quittung",
      "online bestellen", "die Lieferung", "umtauschen", "die Mode", "das Hemd",
    ],
  },
];

export function findPack(id: string): ContextPack | undefined {
  return CONTEXT_PACKS.find((p) => p.id === id);
}
