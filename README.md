# Brain-Scan DSA — V1 MVP

**Students don't quit DSA — they quit because they can't think, yet.**

A web-first, text-only learning app. Brain Scan (50 questions) → Brain Type → Personalized Roadmap → Thinking Workouts → DSA chunks, chunk by chunk. DSA only in V1.

## How to run (free)

```bash
npm install --no-audit --no-fund
npm run dev     # open http://localhost:5173
npm run build   # creates dist/ for Cloudflare Pages
npm run preview # preview the production build
```

No account, no keys, no payment needed to run it. Without Supabase keys it works fully in `localStorage` under key `brainscan-v1`.

## Tech stack (₹0)

- **Frontend:** React + Vite + Tailwind CSS v3 (SPA, no SSR)
- **Hosting:** Cloudflare Pages — connect the repo, build command `npm run build`, output `dist/`. Free tier: unlimited bandwidth, 500 builds/mo, no card.
- **Backend / DB / Auth:** Supabase Free, ready but optional. See `supabase/schema.sql`.
- **Content:** Markdown/JSON-style data in `src/data/` — no CMS.
- **AI:** Light, rule-based adaptive engine in `src/lib/adaptive.js`. No LLM, no API keys, no live C++ execution in V1. MCQ + trace + typed logic answers checked in the browser.

## Supabase setup (optional, placeholders only)

1. Create a free project at https://supabase.com/dashboard
2. In SQL Editor, run `supabase/schema.sql` (tables: profiles, brain_scan_results, attempts, roadmaps, lessons_progress)
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Restart `npm run dev`. The app syncs scan results best-effort; if it fails, local progress still works.

Never commit a real `.env` — it is in `.gitignore`.

## What is in V1

- Home / landing, Brain Scan (50 Qs, 3 rounds 15+15+20), Brain Type result (5 types), Personalized Roadmap (Foundation → Thinking → Mastery), Thinking Workouts (10), DSA Learn (18 chunks, 3 per topic: Arrays, Strings, Two Pointers, Hashing, Stack/Queue, Linked List basics), Weekly Re-scan (10 Qs), Dashboard (streak, XP, level, mastery).
- Adaptive engine: `scoreScan()` → profile + brain type + starting level, `generateRoadmap()`, `updateMastery()` (Elo-like, +12 fast-correct / +8 correct / +5 slow-correct / -4 slow-wrong / -7 fast-wrong), `nextChunk()`. Pure functions, deterministic, no React in that file.

## What is NOT in V1

- No video lectures (text only, by design)
- No live C++ code execution (Piston public API closed Feb 2026; JDoodle free is 20 runs/day — too small)
- No payments / ads. Free vs Pro ₹99/mo is shown as a placeholder only. Razorpay later: 2% + GST, no setup fee.
- No other subjects (SQL, DBMS, OS, CN come later)
- No real user accounts until Supabase Auth is wired in V2

## File structure

```
src/App.jsx               # state routing + all pages (Home, Scan, Result, Roadmap, Workouts, Learn, Re-scan, Dashboard)
src/main.jsx
src/index.css
src/lib/adaptive.js       # light AI — pure functions
src/lib/store.js          # localStorage + Supabase wrapper (falls back to local)
src/data/scanQuestions.js # 50 scan Qs + 10 re-scan Qs
src/data/thinkingWorkouts.js # 10 workouts
src/data/dsaChunks.js     # 18 DSA chunks
src/components/ChunkPlayer.jsx # MCQ / typed player with instant explanation
src/components/Scan.jsx  # 50-Q flow, round breaks, per-question timing
supabase/schema.sql
.env.example
```
