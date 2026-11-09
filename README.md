# SochCode — V1 MVP

**Soch pehle, code baad mein. / Think first, then code.**

Minimal, text-only learning app. Students quit DSA because they cannot think — SochCode teaches how to think first, then DSA gets a grip. DSA only in V1.

## Flow (minimal, by design)

1. **Landing = login / signup only.** Nothing else. No hero, no cards, no Free vs Pro.
   Local demo auth in V1: email + password, Continue with Google (placeholder, asks name/email, continues locally — no real Google OAuth yet), or Continue as guest (first name only). No password is stored.
2. **After login → 50-question Brain Scan, straight away.** 3 rounds (15+15+20), one at a time, MCQ + typed, timer recorded.
3. **After scan → Brain Type result → "See your roadmap".** Only then do Roadmap / Think / Learn / Re-scan / Dashboard appear, in a minimal top nav.

Everything else stays behind the scan: adaptive engine, 10 Thinking Workouts, 18 DSA chunks (3 per topic: Arrays, Strings, Two Pointers, Hashing, Stack/Queue, Linked List basics), Weekly Re-scan (10 Qs).

## How to run (free)

```bash
npm install --no-audit --no-fund
npm run dev     # open http://localhost:5173
npm run build   # creates dist/ for Cloudflare Pages / GitHub Pages
npm run preview # preview the production build
```

No account, no keys, no payment needed to run it. Without Supabase keys it works fully in `localStorage` under key `brainscan-v1` (user + progress).

## Tech stack (₹0)

- **Frontend:** React + Vite + Tailwind CSS v3 (SPA, no SSR), Vite base `./`
- **Hosting:** Cloudflare Pages — connect the repo, build command `npm run build`, output `dist/`. Also deploys to GitHub Pages from `dist/` on the `gh-pages` branch.
- **Backend / DB / Auth:** Supabase Free, ready but optional. See `supabase/schema.sql`. V1 login is local only.
- **Content:** Data in `src/data/` — no CMS, no videos.
- **AI:** Light, rule-based adaptive engine in `src/lib/adaptive.js`. No LLM, no API keys, no live C++ execution in V1. MCQ + trace + typed logic answers checked in the browser.

## Supabase setup (optional, placeholders only)

1. Create a free project at https://supabase.com/dashboard
2. In SQL Editor, run `supabase/schema.sql` (tables: profiles, brain_scan_results, attempts, roadmaps, lessons_progress)
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Restart `npm run dev`. The app syncs scan results best-effort; if it fails, local progress still works.

Never commit a real `.env` — it is in `.gitignore`.

## What is NOT in V1

- No video lectures (text only, by design)
- No live C++ code execution (Piston public API closed Feb 2026; JDoodle free is 20 runs/day — too small)
- No payments / ads
- No other subjects (SQL, DBMS, OS, CN come later)
- No real user accounts until Supabase Auth is wired in V2

## File structure

```
src/App.jsx               # minimal gating: Auth only -> Scan only -> Result + nav
src/main.jsx
src/index.css             # white, minimal
src/components/Auth.jsx  # login / signup / Google placeholder / guest (local only)
src/components/Scan.jsx  # 50-Q flow, round breaks, per-question timing
src/components/ChunkPlayer.jsx # MCQ / typed player with instant explanation
src/lib/adaptive.js       # light AI — pure functions
src/lib/store.js          # localStorage (brainscan-v1, incl. user) + Supabase wrapper
src/data/scanQuestions.js # 50 scan Qs + 10 re-scan Qs
src/data/thinkingWorkouts.js # 10 workouts
src/data/dsaChunks.js     # 18 DSA chunks
supabase/schema.sql
.env.example
```

Repo name on GitHub stays `brain-scan-dsa-app` for now. App name is SochCode.
