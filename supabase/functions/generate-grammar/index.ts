// ============================================================
// Edge Function: generate-grammar
// ------------------------------------------------------------
// Genereaza exercitii contextuale de gramatica germana A2.
// Apeleaza direct Google Gemini API (free tier).
// Cheia GEMINI_API_KEY traieste server-side, NU in client.
//
// Body JSON:
// {
//   "packId": string,
//   "customContext"?: { "label": string, "description": string, "vocabulary"?: string },
//   "difficulty": "Usor" | "Mediu" | "Greu",
//   "count": number
// }
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PACKS: Record<string, { label: string; description: string; vocab: string[]; themes: string[] }> = {
  "software-engineering": {
    label: "Software Engineering",
    description: "Daily stand-up, code review, deployment, debugging",
    vocab: ["der Code", "die Funktion", "der Fehler", "der Pull Request", "die Besprechung", "das Meeting", "der Build", "die Datenbank", "deploylieren", "testen", "implementieren", "refaktorieren", "der Sprint"],
    themes: ["Daily Stand-up", "Code Review", "Bug fix", "Deployment", "Pair Programming"],
  },
  "switzerland-life": {
    label: "Viata in Elvetia",
    description: "Administratie, chirie, asigurari, transport",
    vocab: ["die Gemeinde", "die Anmeldung", "der Mietvertrag", "die Kaution", "die Krankenkasse", "die Versicherung", "die SBB", "der Personalausweis", "die Aufenthaltsbewilligung"],
    themes: ["Administratie", "Chirie", "Asigurare medicala", "Transport SBB", "Bank"],
  },
  "health-nutrition": {
    label: "Sanatate si Nutritie",
    description: "Sala de sport, retete proteice, alimentatie",
    vocab: ["das Fitnessstudio", "das Training", "die Wiederholung", "das Protein", "die Kohlenhydrate", "die Mahlzeit", "kochen", "die Muskeln", "die Erholung"],
    themes: ["Fitness", "Retete proteice", "Macronutrienti", "Antrenament"],
  },
  "board-games": {
    label: "Board games",
    description: "Reguli, runda, strategie, victorie",
    vocab: ["das Brettspiel", "die Regel", "die Runde", "der Wuerfel", "die Karte", "der Spieler", "die Strategie", "gewinnen", "verlieren"],
    themes: ["Reguli", "Strategie", "Runda", "Carti/zaruri"],
  },
  "restaurant-food": {
    label: "Restaurant & Cafenea",
    description: "Comanda, meniu, plata, rezervare",
    vocab: ["die Speisekarte", "die Bestellung", "der Tisch", "die Rechnung", "das Trinkgeld", "reservieren", "bestellen", "bezahlen", "der Kellner", "vegetarisch"],
    themes: ["Comanda mancare", "Plata", "Rezervare", "Recomandari"],
  },
  "travel-hotel": {
    label: "Calatorie & Hotel",
    description: "Check-in, biletul, atractii turistice",
    vocab: ["der Flug", "die Fahrkarte", "das Hotel", "die Reservierung", "das Doppelzimmer", "die Sehenswuerdigkeit", "das Gepaeck", "umsteigen", "stornieren"],
    themes: ["Check-in hotel", "Bilet tren/avion", "Atractii turistice", "Probleme cazare"],
  },
  "doctor-appointment": {
    label: "La Doctor",
    description: "Simptome, dureri, prescriptie medicala",
    vocab: ["der Arzt", "der Termin", "die Schmerzen", "das Fieber", "die Erkaeltung", "das Medikament", "die Krankschreibung", "das Rezept", "die Apotheke"],
    themes: ["Programare doctor", "Descriere simptome", "Reteta", "Farmacia"],
  },
  "family-home": {
    label: "Familie & Casa",
    description: "Familia, parinti, copii, treburi casnice",
    vocab: ["die Familie", "die Eltern", "die Kinder", "der Haushalt", "kochen", "putzen", "abwaschen", "die Wohnung", "der Geburtstag", "die Schule"],
    themes: ["Membrii familiei", "Treburi casnice", "Mese impreuna", "Cresterea copiilor"],
  },
  "news-politics": {
    label: "Stiri & Actualitate",
    description: "Ziar, evenimente actuale, opinii",
    vocab: ["die Nachrichten", "die Zeitung", "das Ereignis", "die Wahl", "die Regierung", "die Umwelt", "berichten", "die Meinung", "die Politik"],
    themes: ["Stiri zilnice", "Politica", "Mediu", "Tehnologie", "Opinii"],
  },
  "weather-seasons": {
    label: "Vremea & Anotimpurile",
    description: "Prognoza meteo, anotimpuri, activitati",
    vocab: ["das Wetter", "die Sonne", "der Regen", "der Schnee", "warm", "kalt", "windig", "der Sommer", "der Winter", "die Temperatur"],
    themes: ["Prognoza meteo", "Anotimpuri", "Imbracaminte", "Activitati outdoor"],
  },
  "shopping-clothes": {
    label: "Cumparaturi & Haine",
    description: "Magazin, marime, culoare, reduceri",
    vocab: ["das Geschaeft", "die Groesse", "die Farbe", "der Preis", "der Rabatt", "anprobieren", "zurueckgeben", "kaufen", "die Kasse", "online bestellen"],
    themes: ["La magazin", "Marimi", "Reduceri", "Returnari", "Online"],
  },
};

interface CustomContextBody {
  label?: string;
  description?: string;
  vocabulary?: string;
}

function buildPrompt(
  packLabel: string,
  packDescription: string,
  themes: string[],
  vocab: string[],
  difficulty: string,
  count: number,
): string {
  return `Esti un profesor expert de limba germana care creeaza exercitii structurate de nivel A2 in romana pentru elevi romani.

CONTEXT: ${packLabel} (${packDescription})
TEME: ${themes.join(", ")}
VOCABULAR DE INCORPORAT (foloseste liber, nu fortat pe tot): ${vocab.join(", ")}

Genereaza exact ${count} exercitii de gramatica germana la nivelul de dificultate "${difficulty}".
Fiecare exercitiu trebuie sa fie situat in contextul de mai sus (propozitii realiste, concrete din acest domeniu).
Distribuie tipurile de exercitii peste cele 5 categorii: Lückentext, Multiple Choice, Umformung, Satzbau, Fehlerkorrektur.

CERINTE:
- "question" e in germana (sau instructiune in romana + propozitie germana)
- "correctAnswer" e raspunsul/propozitia corecta in germana
- "explanationRomanian" e o explicatie de 1-2 propozitii IN ROMANA a regulii gramaticale
- Pentru "Multiple Choice", da exact 4 optiuni unde cele gresite sunt capcane comune ale elevilor
- Pentru "Satzbau", "options" trebuie sa fie cuvintele/tokens-urile pentru reordonare
- Pentru "Fehlerkorrektur", "question" contine o propozitie cu exact 1 eroare gramaticala
- Pentru "Lückentext", foloseste "___" in question pentru blank; "correctAnswer" e doar cuvantul lipsa
- Pentru "Umformung", "question" descrie transformarea urmata de propozitie
- ID-uri unice, sufix numeric incremental

Returneaza DOAR JSON valid in formatul cerut. Fara markdown, fara explicatii in afara JSON-ului.`;
}

// Schema for Gemini structured output (responseSchema)
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    exercises: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          type: {
            type: "STRING",
            enum: ["Lückentext", "Multiple Choice", "Umformung", "Satzbau", "Fehlerkorrektur"],
          },
          difficulty: { type: "STRING", enum: ["Usor", "Mediu", "Greu"] },
          question: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctAnswer: { type: "STRING" },
          explanationRomanian: { type: "STRING" },
        },
        required: ["id", "type", "difficulty", "question", "correctAnswer", "explanationRomanian"],
      },
    },
  },
  required: ["exercises"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const { packId, difficulty, count = 5, customContext } = body as {
      packId: string;
      difficulty: string;
      count?: number;
      customContext?: CustomContextBody;
    };

    if (!["Usor", "Mediu", "Greu"].includes(difficulty)) {
      return new Response(JSON.stringify({ error: "Invalid difficulty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const wantCount = Math.max(1, Math.min(10, Number(count) || 5));

    let packLabel: string;
    let packDescription: string;
    let themes: string[];
    let vocab: string[];

    if (packId === "custom") {
      if (!customContext?.description || customContext.description.trim().length < 5) {
        return new Response(JSON.stringify({ error: "Descrierea contextului custom trebuie sa aiba minim 5 caractere." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (customContext.description.length > 500) {
        return new Response(JSON.stringify({ error: "Descrierea e prea lunga (max 500 caractere)." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      packLabel = customContext.label?.trim() || "Custom context";
      packDescription = customContext.description.trim();
      themes = [packLabel];
      vocab = (customContext.vocabulary || "").split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 0);
    } else if (PACKS[packId]) {
      const pack = PACKS[packId];
      packLabel = pack.label;
      packDescription = pack.description;
      themes = pack.themes;
      vocab = pack.vocab;
    } else {
      return new Response(JSON.stringify({ error: `Unknown packId: ${packId}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured on server. Run: supabase secrets set GEMINI_API_KEY=..." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(packLabel, packDescription, themes, vocab, difficulty, wantCount);

    // Call Google Gemini API directly with structured output
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limita Gemini API atinsa - asteapta cateva minute si reincearca." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Cheia GEMINI_API_KEY este invalida sau lipseste permisiuni." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Eroare Gemini (${response.status}): ${errText.substring(0, 200)}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("No text in Gemini response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Raspuns invalid de la Gemini" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-grammar error:", error);
    const message = error instanceof Error ? error.message : "Eroare necunoscuta";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
