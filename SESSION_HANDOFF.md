# SENWITT — Session Handoff

**Last updated:** 2026-08-01 (post backend features: Supabase / Stripe / Witt LLM / Web Push / bundle trim)  
**Purpose:** Full context for a new agent/session. Do not rename the product (stays **SENWITT**).

---

## 1. What this is

Local-first React brain-training SPA (Elevate / Lumosity / MindRelay–inspired), ~5-minute daily workouts mixing quizzes + interactive drills. Honest claims only — no IQ/brain-age theater, no fake “AI agent” audit panels.

Optional cloud layer (when env vars are set): Supabase magic-link auth + sync, Stripe Premium, server-side Witt LLM, Web Push cron. **With zero env vars the app still runs fully offline** (localStorage only).

| | |
|---|---|
| **App path (git root)** | `/Users/faithinpurple/Downloads/APPDEV/Brain Learning/app` |
| **Parent folder** | `/Users/faithinpurple/Downloads/APPDEV/Brain Learning/` (not a git repo) |
| **Remote** | `https://github.com/willitexpireorg-ctrl/senwitt-ai-arcade.git` |
| **Branch** | `main` (tracking `origin/main`) |
| **Stack** | React 19 + Vite 8 + TypeScript + Tailwind 4 + Lucide + `@supabase/supabase-js` |
| **Server** | Vercel serverless under `api/` (Stripe, Witt, cron push) |
| **Persistence** | `localStorage` primary; optional Supabase `user_data` sync |
| **Dev server** | `npm run dev -- --host 127.0.0.1 --port 5173` → `http://127.0.0.1:5173/` |
| **API locally** | `vercel dev` (needed for `/api/*`) |
| **Build** | `npm run build` (`tsc -b && vite build`) |

### Recent commits (pushed as of last push)

```
d698797 feat: add Focus Track and Route Planner Tier C drills
1bb858b feat: felt difficulty, SW reminders, lazy engines, Synonym Race & Tone Pick
743cde8 feat: Bright Focus UI, Tier A/B engines, mixed daily workouts, and habit UX
```

**Note:** Backend feature work (Phases 1–6 below) may still be **uncommitted** on the working tree — check `git status` before assuming origin is current.

---

## 2. Product positioning

- **Wedge:** 5–7 min practice of *work-relevant* micro-skills (writing, math, code, memory, reading, reasoning).
- **Brand:** SENWITT (do not rename). Coach: **Witt** (deterministic local tips always; LLM for Premium when configured).
- **UI theme:** **Bright Focus** — light teal/coral, Sora/Nunito-style fonts, tactile 3D buttons, centered `page-shell`. Tokens in `src/index.css`.
- **Ethics:** No fake scarcity, no guilt-streak copy. Momentum + grace tokens + streak shields. Free daily plan stays useful.

### Free vs Premium

| Free | Premium (Stripe) |
|------|------------------|
| Daily / coffee workouts, baseline, Progress | Full Games arcade |
| Skill Library | Weekend Deep Set |
| Local Witt tips (`wittLocalReply`) | Witt LLM via `/api/witt-chat` |
| Recommended Games (3) | Full catalog |

---

## 3. Architecture map

### Entry / shell

- `src/main.tsx` — React root + service worker register
- `src/App.tsx` — navigation, session orchestration, auth hydrate, entitlements, workout runner
- `src/index.css` — Bright Focus design system
- `index.html` + `public/manifest.json` + `public/sw.js` (`senwitt-v4`) — PWA + Web Push
- `src/components/lazyPages.tsx` — lazy tabs/modals
- `src/components/engines/lazyEngines.tsx` — lazy drills

### Backend / API (`api/`)

| Route | Role |
|-------|------|
| `api/create-checkout-session.ts` | Stripe Checkout (subscription) |
| `api/billing-portal.ts` | Stripe Customer Portal |
| `api/stripe-webhook.ts` | Sets `profiles.is_premium` |
| `api/witt-chat.ts` | OpenAI `gpt-4o-mini` (premium + JWT) |
| `api/send-reminders.ts` | Cron Web Push sender (`CRON_SECRET`) |
| `api/_lib/auth.ts` | Bearer → Supabase user |
| `api/_lib/supabaseAdmin.ts` | Service-role client |
| `api/_lib/stripe.ts` | Stripe SDK |

`vercel.json`: SPA rewrite excludes `/api/*`; cron `*/15 * * * *` → `/api/send-reminders`.

### Supabase migrations (`supabase/migrations/`)

1. `001_init.sql` — `profiles`, `user_data`, RLS, signup trigger  
2. **`002_lock_premium_columns.sql`** — **must apply before charging** — revokes client write on `is_premium` / `stripe_customer_id`  
3. `003_push_subscriptions.sql` — Web Push endpoints + RLS  

### Core client services

| File | Role |
|------|------|
| `src/services/storage.ts` | Progress, sessions, IRT, workout resume, habits |
| `src/services/supabaseClient.ts` | Browser client or `null` if unconfigured |
| `src/services/authService.ts` | Magic link, session, `getAccessToken` |
| `src/services/syncService.ts` | Debounced push / pullAndMerge (guards empty remote) |
| `src/services/entitlements.ts` | Cached `isPremium` from profile |
| `src/services/wittLocalReply.ts` | Deterministic Witt tips |
| `src/services/webPush.ts` | Subscribe/unsubscribe PushManager → Supabase |
| `src/services/dailyWorkoutPlan.ts` | Mixed quiz ↔ engine plans |
| `src/services/reminderScheduler.ts` | In-tab / SW local reminders |
| `src/services/difficultyFeel.ts` | Felt intensity bands |
| `src/services/sessionInsights.ts` | Momentum, weekly report, cues |

### Key UI

| Component | Role |
|-----------|------|
| `Dashboard.tsx` | Daily CTA; weekend gated for free |
| `GamesArcade.tsx` | 3 recommended free; rest Premium-locked |
| `AccountModal.tsx` | Magic link, sync, Free/Premium, push toggle |
| `UpgradeModal.tsx` | Stripe Checkout / Portal |
| `WittChatModal.tsx` | Local tips; Premium → LLM with fallback |
| `WorkoutRunner.tsx` | Multi-step daily set |
| `DailyReminderBanner.tsx` | In-app reminder (secondary to Web Push) |

### Nav tabs

Train (`dashboard`) · Games (`arcade`) · Skills (`skills`) · Progress (`progress`)

---

## 4. Environment variables

Copy [`.env.example`](.env.example). Never commit `.env`.

**Client (`VITE_*`):**

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY` (optional / reserved)
- `VITE_VAPID_PUBLIC_KEY`

**Server (Vercel only — never `VITE_`):**

- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` (falls back to `VITE_SUPABASE_URL`)
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (same pair as client public)
- `CRON_SECRET` (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`)

Generate VAPID: `npx web-push generate-vapid-keys`.

---

## 5. Daily workout plan

| Mode | Steps | ~Time | Access |
|------|-------|-------|--------|
| `coffee_break` | 1 quiz + 1 engine | ~2 min | Free |
| `daily` | 2 quiz + 2 engines | ~5 min | Free |
| `weekend_long` | 3 quiz + 3 engines | ~10 min | Premium |

- Date-seeded PRNG; soft baseline bias  
- Exit pauses (Continue CTA); arcade must not clear paused workout  

---

## 6. Game engines (mechanic types)

Live: `visual_grid`, `dual_nback`, `stroop`, `logic_deduction`, `voice_drill`, `brief_recall`, `clearer_sentence`, `number_sense`, `brevity_cut`, `quick_purchase`, `sequence_order`, `rsvp_reader`, `speed_match`, `signal_sweep`, `pattern_shift`, `synonym_race`, `tone_pick`, `attention_track`, `route_plan`, plus `choice_quiz` wrappers.

Result shape: `{ scoreEarned, correctCount, totalItems, totalTimeMs }`.

---

## 7. Habit / UI psychology (shipped)

Zeigarnik continue, endowed progress bar, peak-end done-for-today, Hick recommended vs browse, Tiny Habits anchors + reminders, commitment chips, reciprocity install prompt, B=MAP skip→coffee, felt difficulty (no IQ claims).

---

## 8. What’s done vs pending

### Done

- Content validity, Bright Focus UI, baseline, evidence, Tier A/B/C engines  
- Mixed daily workouts + UI psych + felt difficulty  
- Lazy engines + lazy pages/modals (main ~601KB after page splits; vendor still heavy)  
- **Supabase** magic-link auth + `user_data` sync + Account UI  
- **Stripe** Checkout / Portal / webhook + freemium gates  
- **Witt LLM** (`/api/witt-chat`) + `wittLocalReply` fallback  
- **Web Push** subscriptions + cron `/api/send-reminders` + SW `senwitt-v4`  
- Migrations `001`–`003` + premium column lock  

### Pending / next

1. **Deploy + wire secrets** — Vercel project env, apply SQL migrations (esp. `002`), Stripe webhook URL, run smoke tests  
2. **Further vendor split** — main still ~600KB (React + supabase-js dominate); optional manualChunks  
3. **Rename** — deferred  
4. Playtest / polish after real-user deploy  

---

## 9. Known pitfalls

- Apply **`002_lock_premium_columns.sql`** before any real charges (RLS column revoke).  
- Empty remote `user_data` `{}` must not import over local (`pullAndMerge` requires `progress`).  
- Stamp `clientUpdatedAt` even when signed out (syncService).  
- After sync import, refresh `abilityOrchestrator.setAbilityProfile`.  
- `ExercisePlayer` `attemptsRef` for 1-item quiz steps.  
- Arcade complete must not `clearActiveWorkout` unless WorkoutRunner finished.  
- Timed drills: `finishingRef` / `activeRef`; clear timers on cancel.  
- Modal Suspense fallbacks must be `fixed inset-0` (see `lazyPages.tsx`).  
- CTA pulse: box-shadow/filter, not `transform` scale.  
- CSS reset must stay in `@layer base`.  
- macOS `Icon\r` junk — delete, don’t commit.  
- Web Push DST: `timezone_offset_minutes` captured at subscribe; re-toggle after DST if fire time drifts.  

---

## 10. Quick start

```bash
cd "/Users/faithinpurple/Downloads/APPDEV/Brain Learning/app"
git status -sb
cp .env.example .env   # fill when testing cloud features
npm run dev -- --host 127.0.0.1 --port 5173
# API routes: vercel dev
npm run build
```

**Apply migrations** in Supabase SQL editor (001 → 002 → 003).  
**Stripe test:** `stripe listen --forward-to localhost:3000/api/stripe-webhook` with `vercel dev`.  
**Cron test:** `curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/send-reminders`

**Transcript:**  
`/Users/faithinpurple/.cursor/projects/Users-faithinpurple/agent-transcripts/9f358621-e62e-4bba-8330-3d2a96720d96/`

**Research dump:** `/Users/faithinpurple/Downloads/brain_app_game.md`

---

## 11. Suggested next questions

- Deploy to Vercel + apply migrations + smoke Stripe/Witt/Push?  
- Commit/push the uncommitted backend work?  
- Vendor chunk splitting for main &lt;400KB?  
- Playtest / UX polish?

---

*End of handoff.*
