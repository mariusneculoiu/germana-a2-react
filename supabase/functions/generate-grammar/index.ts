// ============================================================
// Edge Function: generate-grammar
// ------------------------------------------------------------
// Genereaza exercitii contextuale de gramatica germana A2.
// Cheia AI (LOVABLE_API_KEY) traieste aici, NU in client.
//
// Body JSON expected:
// {
//   "packId": "software-engineering" | "switzerland-life" | "health-nutrition" | "board-games",
//   "difficulty": "Usor" | "Mediu" | "Greu",
//   "count": 5
// }
//
// Returns: { exercises: GeneratedExercise[] }
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same context packs as the React client (kept in sync manually).
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
};

function buildPrompt(packId: string, difficulty: string, count: number): string {
  const pack = PACKS[packId];
  if (!pack) throw new Error(`Unknown pack: ${packId}`);
  return `You are a German language teacher creating A2-level exercises in Romanian for a learner.

CONTEXT: ${pack.label} (${pack.description})
THEMES: ${pack.themes.join(", ")}
VOCABULARY TO INCORPORATE: ${pack.vocab.join(", ")}

Generate exactly ${count} German grammar exercises at difficulty level "${difficulty}".
Each exercise must be situated in the chosen context (realistic, concrete sentences from this domain).
Distribute exercise types across the 5 categories: Lückentext, Multiple Choice, Umformung, Satzbau, Fehlerkorrektur.

REQUIREMENTS:
- "question" is in German (or instruction in Romanian + German sentence)
- "correctAnswer" is the German answer/corrected sentence/word
- "explanationRomanian" is a 1-2 sentence explanation IN ROMANIAN of the grammar rule
- For "Multiple Choice", provide exactly 4 options where wrong ones are common learner mistakes (capcane)
- For "Satzbau", "options" must be the words/tokens to reorder
- For "Fehlerkorrektur", "question" contains the sentence with exactly 1 grammar error
- For "Lückentext", use "___" in the question; "correctAnswer" is just the missing word(s)
- For "Umformung", "question" describes the transformation followed by the sentence
- IDs: "${packId}-${difficulty.toLowerCase()}-1" through "${packId}-${difficulty.toLowerCase()}-${count}"`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { packId, difficulty, count = 5 } = await req.json();

    if (!packId || !PACKS[packId]) {
      return new Response(JSON.stringify({ error: "Invalid packId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["Usor", "Mediu", "Greu"].includes(difficulty)) {
      return new Response(JSON.stringify({ error: "Invalid difficulty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const wantCount = Math.max(1, Math.min(10, Number(count) || 5));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured on server" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      "Esti un profesor expert de limba germana care creeaza exercitii structurate de nivel A2 in romana pentru elevi romani. Returnezi DOAR JSON valid.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildPrompt(packId, difficulty, wantCount) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_exercises",
              description: "Returneaza array de exercitii structurate",
              parameters: {
                type: "object",
                properties: {
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: {
                          type: "string",
                          enum: ["Lückentext", "Multiple Choice", "Umformung", "Satzbau", "Fehlerkorrektur"],
                        },
                        difficulty: {
                          type: "string",
                          enum: ["Usor", "Mediu", "Greu"],
                        },
                        question: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                        },
                        correctAnswer: { type: "string" },
                        explanationRomanian: { type: "string" },
                      },
                      required: ["id", "type", "difficulty", "question", "correctAnswer", "explanationRomanian"],
                    },
                  },
                },
                required: ["exercises"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_exercises" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Prea multe cereri. Incearca in cateva momente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credit AI epuizat." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: `Eroare la serviciul AI (${response.status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Raspuns invalid de la AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);
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
