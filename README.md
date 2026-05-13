# Germana A2 - React

Aplicatie completa de invatare a germanei A1-B1, scrisa in React 19 + TypeScript + Tailwind v4 + Vite, cu **Supabase Edge Functions** ca proxy AI server-side.

**Demo live (dupa primul deploy):** https://mariusneculoiu.github.io/germana-a2-react/

## Continut

| Pagina | Continut |
|--------|----------|
| **Vocabular** | 1254 cuvinte cu 7 moduri: flashcards (TTS, shuffle), SRS (Anki SM-2), MC quiz, Type quiz, Speed quiz (60s), filtru pe sectiuni, lista |
| **Fraze** | 427 fraze cu 7 moduri: flashcards (TTS), quiz, multi-blank, Satzbau, Diktat, Traducere, lista |
| **Gramatica** | 16 topicuri / 710 exercitii + **Scenario Studio** (AI prin Supabase Edge Function) + **Grammar Debugger** + **Progressive Difficulty** |

## Arhitectura AI (Phase 1)

```
Browser (publishable key, public)
   ↓ HTTPS
Supabase Edge Function (LOVABLE_API_KEY = secret server-side)
   ↓ HTTPS
Lovable AI Gateway (gemini-2.5-flash)
   ↓
JSON structurat validat -> client
```

**De ce un proxy server-side?**
- Cheia AI reala (LOVABLE_API_KEY) **nu ajunge niciodata in browser**
- Putem adauga rate limiting, quote, autentificare ulterior
- Mock-ul local din `scenarioGenerator.ts` ramane fallback daca Edge Function-ul nu raspunde

## Setup local

```bash
npm install
cp .env.example .env             # contine deja Supabase URL + publishable key
npm run dev                       # http://localhost:3000
```

> Daca vrei sa folosesti propriul proiect Supabase, modifica `.env`.

## Deploy pe GitHub Pages (cu Supabase)

Repo-ul are deja workflow de deploy configurat (`.github/workflows/deploy.yml`). Iata pasii:

### 1. Creeaza repo pe GitHub

https://github.com/new → nume `germana-a2-react` → **Public** → fara README → Create.

### 2. Push sursele

```bash
cd germana-a2-react
git init -b main
git add .
git commit -m "Initial commit: Germana A2 React app with Supabase"
git remote add origin https://github.com/mariusneculoiu/germana-a2-react.git
git push -u origin main
```

### 3. Adauga Supabase secrets in GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://tpekplhavhysekrsvkem.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Cheia anon din `.env.example` (sau a propriului proiect) |

> Aceste valori sunt **publice oricum** (publishable key = anon key in Supabase). GitHub Secrets e folosit doar pentru organizare - nu pentru ascundere.

### 4. Activeaza Pages

Settings → **Pages** → Source: **GitHub Actions** → Save.

### 5. Astepti deploy-ul

Tab **Actions** → workflow "Deploy to GitHub Pages" ruleaza → bifa verde in ~2 min.

Site live la: **https://mariusneculoiu.github.io/germana-a2-react/**

## Deploy Edge Function pe Supabase

Pentru ca generarea AI sa functioneze cu adevarat, trebuie sa deploy-ezi Edge Function-ul `generate-grammar` in proiectul tau Supabase.

### Optiunea A - Cu Supabase CLI (recomandat)

**Instaleaza CLI:**

```bash
# Mac (brew)
brew install supabase/tap/supabase

# Windows (scoop)
scoop install supabase

# Linux / alternativ - vezi https://supabase.com/docs/guides/cli
```

**Login + link la proiect:**

```bash
cd germana-a2-react
supabase login
supabase link --project-ref tpekplhavhysekrsvkem
```

**Seteaza secret-ul AI:**

```bash
supabase secrets set LOVABLE_API_KEY=sk-...   # cheia ta de la Lovable AI / OpenAI compatible
```

**Deploy function:**

```bash
supabase functions deploy generate-grammar --no-verify-jwt
```

Functia e acum la `https://tpekplhavhysekrsvkem.supabase.co/functions/v1/generate-grammar` si Scenario Studio o va folosi automat.

### Optiunea B - Din Supabase Dashboard (manual)

1. https://supabase.com/dashboard → proiectul tau → **Edge Functions**
2. **Deploy a new function** → name: `generate-grammar`
3. Copiezi continutul `supabase/functions/generate-grammar/index.ts` din repo
4. Deploy
5. **Settings** → **Secrets** → adauga `LOVABLE_API_KEY`

## Despre cheia AI

- **`VITE_SUPABASE_PUBLISHABLE_KEY`** - anon key Supabase. Publica by design (e prefixata `VITE_`). Safe in client si in repo.
- **`LOVABLE_API_KEY`** - cheia AI Lovable Gateway. Server-side only - traieste doar ca Supabase secret. **Niciodata in repo sau in `.env` local.**
- Daca Edge Function-ul nu raspunde sau lipseste, aplicatia foloseste automat **mock data** (5 exercitii originale per pack).

## Phase 1 - implementari recente

### 1. Scenario Generator (`src/services/scenarioGenerator.ts` + `supabase/functions/generate-grammar/index.ts`)

- 4 Context Packs: Software Engineering, Viata in Elvetia, Sanatate & Nutritie, Board Games
- Client cheama Edge Function via `@supabase/supabase-js` (`functions.invoke`)
- Edge Function (Deno) cheama Lovable AI Gateway cu schema JSON strict
- Validare runtime per exercitiu
- Fallback la mock data daca Edge Function lipseste

### 2. Grammar Debugger (`src/services/grammarAnalyzer.ts` + `src/components/feedback/GrammarFeedback.tsx`)

Feedback care detecteaza: word order V2, verb la sfarsit in subordonate, caz si gen articol, cuvinte lipsa / extra / gresite. Diff vizual cuvant cu cuvant.

### 3. Progressive Difficulty (`src/services/difficultyManager.ts`)

Algoritm cu fereastra de 10 rezultate. Avansare automata la ≥80%, regres la ≤30%. Persistat per topic.

## Structura

```
src/
├── App.tsx, main.tsx, index.css
├── types/                          # Interfete TypeScript strict
├── data/                           # 1254 vocab + 427 fraze + 710 exercitii
├── hooks/                          # useLocalStorage, useTTS, useSrs, useStreak
├── integrations/
│   └── supabase/client.ts          # Supabase client singleton
├── services/
│   ├── grammarAnalyzer.ts          # Phase 1: feedback inteligent
│   ├── difficultyManager.ts        # Phase 1: avansare automata
│   ├── scenarioGenerator.ts        # Phase 1: cheama Edge Function
│   ├── contextPacks.ts             # 4 context packs (sincronizat cu Edge)
│   └── exerciseNormalizer.ts       # Legacy + new format
├── components/{ui, feedback}/
└── pages/
    ├── Vocabular/  (7 sub-pages)
    ├── Fraze/      (7 sub-pages)
    └── Gramatica/  (TopicList, TopicDetail, ScenarioStudio, ExercisePlayer)

supabase/
├── config.toml
└── functions/generate-grammar/index.ts   # Edge Function (Deno) - proxy AI
```

## Licenta

MIT - vezi `LICENSE`.
