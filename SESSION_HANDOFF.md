# SENWITT — Master Session Handoff

**Last updated:** 2026-08-01  
**Purpose:** Canonical context for new Cursor sessions. Read this first. Do **not** rename the product (**SENWITT**).

Related Cursor rule (always apply): [`.cursor/rules/senwitt-handoff.mdc`](.cursor/rules/senwitt-handoff.mdc)

---

## 0. TL;DR for the next agent

1. App lives at `/Users/faithinpurple/Downloads/APPDEV/Brain Learning/app` (this is the **git root**).
2. Remote: `https://github.com/willitexpireorg-ctrl/senwitt-ai-arcade.git` · branch `main`.
3. Latest **pushed** commit: `233f4a3` — Supabase sync, Stripe freemium, Witt LLM API, Web Push cron.
4. **Uncommitted locally** (as of handoff): `VITE_TEST_MODE` unlock for playtesting (entitlements + Navbar badge + `.env.example`). Local `.env` has `VITE_TEST_MODE=true` (gitignored).
5. User does **not** have Supabase/Stripe accounts yet — cloud features stay dormant; app must keep working local-only.
6. Prefer **orchestrator → implementer → reviewer** for larger features. Commit/push only when asked.
7. Claims ethics: no IQ / brain-age / clinical theater; free daily plan must stay useful.

```bash
cd "/Users/faithinpurple/Downloads/APPDEV/Brain Learning/app"
git status -sb
npm run dev -- --host 127.0.0.1 --port 5173
# API routes need: vercel dev
npm run build
```

---

## 1. Product

Local-first React brain-training SPA (Elevate / Lumosity / MindRelay–inspired). ~5-minute daily workouts mixing handcrafted MCQs + interactive drills.

| | |
|---|---|
| **Stack** | React 19, Vite 8, TypeScript, Tailwind 4, Lucide, `@supabase/supabase-js` |
| **UI** | **Bright Focus** — teal/coral, Sora/Nunito tokens in `src/index.css` |
| **Coach** | Witt — local tips always; LLM for Premium when server configured |
| **Persistence** | `localStorage` primary; optional Supabase `user_data` sync |
| **Server** | Vercel `api/*` (Stripe, Witt chat, cron push) |

### Free vs Premium (when freemium is live)

| Free | Premium |
|------|---------|
| Daily / coffee workouts, baseline, Progress | Full Games arcade |
| Skill Library | Weekend Deep Set |
| Local Witt (`wittLocalReply`) | Witt LLM (`/api/witt-chat`) |
| Recommended Games (3) | Full catalog |

**Test unlock (current local setup):** `VITE_TEST_MODE=true` treats client as Premium for arcade + weekend (no Stripe). Orange “Test mode” pill in Navbar. Turn off before real launch.

---

## 2. Journey / history (what was built and why)

### Phase A — Grounding (early)
- Removed fake “AI agent” theater, procedural “1500 variations,” Three.js background, Agent Studio.
- Fixed MCQ cheat (correct answer always first) via shuffle + bank reorder.
- Reset progress defaults; honest copy.

### Phase B — Bright Focus UI
- Duolingo / Elevate / Lumosity–inspired redesign (not purple-glow AI slop).
- Fixed broken CTA clicks (`transform` pulse → box-shadow/filter).
- Fixed corner-pushed layout / truncated text; CSS reset moved into `@layer base`.

### Phase C — Next-level product
- Handcrafted bank ~150 items; baseline assessment + skip → 2-min coffee.
- Momentum / grace tokens / streak shields; evidence panels; session insights.
- Mixed daily plan (`dailyWorkoutPlan.ts`): quiz ↔ engine steps.
- PWA (`manifest`, `sw.js`); habit anchors + in-app reminders.

### Phase D — Competitive games
- Tier A: Brevity Cut, Quick Purchase, Sequence Order, RSVP Reader.
- Tier B: Speed Match, Signal Sweep, Pattern Shift.
- Tier C: Synonym Race, Tone Pick, **Focus Track**, **Route Planner**.
- Folded into daily plan + arcade with unique Lucide icons.

### Phase E — UI psychology
- Skills: cognitive-psychology-ux, improve-retention, influence-psychology, ui-ux-design-patterns.
- Zeigarnik continue, endowed progress, peak-end, Hick (recommended vs browse), Tiny Habits, reciprocity install prompt, felt difficulty (IRT → intensity band, no IQ).

### Phase F — Backend features (pushed `233f4a3`)
1. Supabase magic-link + sync (`AccountModal`, `syncService`).
2. Stripe Checkout / Portal / webhook + freemium gates.
3. `/api/witt-chat` (OpenAI gpt-4o-mini) + `wittLocalReply` fallback.
4. Web Push + cron `/api/send-reminders` (`senwitt-v4` SW).
5. Lazy pages/modals (`lazyPages.tsx`); engines already lazy.
6. Docs: `.env.example`, this handoff.

### Phase G — Test mode (uncommitted)
- `VITE_TEST_MODE` in entitlements unlocks all Premium client gates for playtesting.

### Phase H — Game quality pass (content volume + feel, uncommitted)
Full pass across all live arcade/daily engines: grow thin banks, tighten procedural feel/fairness, add one new engine. No deploy/rename/commit.

**Bank expansions (session sampling added where the engine previously iterated the whole bank):**

| Engine | Before (bank / session) | After (bank / session) | Notes |
|---|---|---|---|
| Quick Purchase | 4 / 4 | 12 / 6 | Added `pickItems` session sampling |
| Number Sense | 4 / 4 | 12 / 6 | Added `pickItems` session sampling |
| Clearer Sentence | 4 / 4 | 12 / 6 | Added `pickItems` session sampling |
| Tone Pick | 5 / 5 | 12 / 6 | Added `pickItems`; fixed stray `ITEMS` refs after rename |
| Brevity Cut | 5 / 5 | 13 / 6 | Renamed `ROUNDS`→`ROUND_BANK`; added `pickRounds`; fixed redundant-word indices for new items |
| Synonym Race | 12 / 9 | 16 / 9 | Bank grown; session size unchanged |
| Brief Recall | 3 / 1 | 12 / 1 | Bank grown; already samples one scenario/session |
| Sequence Order | 3 / all | 12 / 4 | Renamed `SCENARIOS`→`SCENARIO_BANK`; added `pickScenarios` (was iterating full bank every time) |
| Logic Inference | 12 / 4 | 16 / 5 | Bank + session size both grown |
| Route Planner | 8 / 5 | 14 / 5 | Bank grown; session size unchanged |
| RSVP Reader | 3 / all | 12 / 4 | Renamed `PASSAGES`→`PASSAGE_BANK`; added `pickPassages` (was iterating full bank every time) |
| Signal Sweep | 5 round templates | 8 round templates / 5 per session | `buildRounds` now samples from `ROUND_RECIPES` instead of using every template every run |

All new items are workplace-relevant (email triage, incident response, expense/travel policy, etc.), have honest plain-English explanations, and `correctIndex` is varied across options (no "always option A" pattern).

**Procedural engine review (feel / fairness / double-finish guards):**
- `DualNBackGame`, `SpatialMemoryGame`, `StroopDrill`: added `activeRef` unmount guard around the delayed `onComplete` call (matches the `finishingRef`/`activeRef` pattern already used in `SignalSweepDrill` / `BrevityCutDrill`).
- `SpeedMatchDrill`, `PatternShiftDrill`, `FocusTrackDrill`: audited — already have `activeRef`/`finishingRef` guards, difficulty ramps (streak speedup, rule-switch banner, concurrent-lane ramp), and lure-quality distractors. No changes needed.
- `RsvpReaderDrill`: already had an adaptive WPM knob (speeds up on correct, slows on miss); left as-is, bank grown to 12 passages.
- Voice Fluency (`voiceFluencyEngine.ts` / `VoiceFluencyDrill.tsx`): renamed `brocaActivationLevel` → `fluencyLevel` (was pseudo-clinical naming); added an 8-item `VERBOSE_PROMPTS` pool with random selection instead of one fixed prompt.

**New engine — Inbox Triage** (`inbox_triage`, fills a "prioritization judgment" gap — reply now / schedule / delegate / archive on 12 realistic work emails, 6 per session). Fully wired:
- `src/components/engines/InboxTriageDrill.tsx` (new)
- `lazyEngines.tsx` → `LazyInboxTriageDrill`
- `researchAgent.ts` → `mechanicType: 'inbox_triage'` + `GameSpec` (`game-inbox-triage`)
- `GamesArcade.tsx` → `GAME_VISUALS['game-inbox-triage']` (Inbox icon) + `LIVE_MECHANIC_TYPES`
- `App.tsx` → `ArcadeMode`, `ARCADE_SKILL`, `mechanicToMode`, `arcadeOnComplete.inbox_triage`, render branch
- `WorkoutRunner.tsx` → `case 'inbox_triage'` (so it can appear in mixed daily/coffee/weekend plans)
- `dailyWorkoutPlan.ts` → `WorkoutEngineMechanic`, `ENGINE_LABELS`, `ENGINE_CATEGORY`, `ALL_ENGINES`
- Result shape: `{ scoreEarned, correctCount, totalItems, totalTimeMs }` (standard)

**Build:** `npm run build` passes (`tsc -b && vite build`, no errors).

**Reviewer pass (SHIP, one fix applied):** Full read-through of every changed engine (correctness of every new bank item's `correctIndex`/`redundantIndices`, InboxTriage wiring, dailyWorkoutPlan, activeRef guards, VoiceFluency rename). All content and wiring checked out correct.
- `RoutePlannerDrill.tsx` (`route-10`): the hand-authored `targetMoves: 18` for the 4-corner puzzle was mathematically unreachable — the true minimum simple path visiting all 4 corners from center is 19 moves (Manhattan TSP lower bound, verified with an explicit 19-move path), so no player could ever earn the "Optimal route" band on that puzzle. Fixed to `targetMoves: 19` (kept `generousMoves: 22`).
- Medium, not fixed (pre-existing, not introduced this pass): several bank-driven MCQ engines (`QuickPurchaseDrill`, `ClearerSentenceDrill`, `NumberSenseDrill`, `RsvpReaderDrill`, `SequenceOrderDrill`, `BriefRecallDrill`, `LogicInferenceDrill`) call `onComplete` from `handleNext`'s final-item branch without a `finishedRef` guard, unlike `BrevityCutDrill`/`TonePickDrill`/`SignalSweepDrill`/`InboxTriageDrill`/`RoutePlannerDrill`/`SynonymRaceDrill`/`FocusTrackDrill` which all have one. A very fast double-tap on "Finish drill" could double-record a session. Worth a follow-up pass to port the same guard for consistency.

**Deferred / not touched this pass:** Dual N-Back / Stroop / Spatial bank content (they're procedural, not bank-driven, so out of scope for "content volume"); no second new engine added (existing bank/feel work was prioritized per mission instructions, and one solid new engine covers the clearest remaining gap). Nothing deployed, committed, pushed, or renamed.

**Reviewer follow-up (Medium, closed):** RoutePlanner route-10 `targetMoves` fixed by reviewer. Added the missing `finishedRef` double-finish guard (TonePick/InboxTriage/BrevityCut pattern) to the final-item `handleNext`/`onComplete` path in `QuickPurchaseDrill`, `ClearerSentenceDrill`, `NumberSenseDrill`, `RsvpReaderDrill`, `SequenceOrderDrill`, `BriefRecallDrill`, `LogicInferenceDrill` — these are simple click-driven (not timer-driven) drills, but rapid double-clicks on the final "Finish drill" button could still double-fire `onComplete`. No scoring/content changes. Build re-verified green.

---

## 3. Architecture map

### Critical paths (keep eager)
`Dashboard`, `Navbar`, `ExercisePlayer`, `WorkoutRunner`, `ErrorBoundary`

### Lazy
`lazyPages.tsx` — Analytics, Games, Skills, modals  
`lazyEngines.tsx` — all drills + baseline  
Modal Suspense fallbacks must be `fixed inset-0` (not inline page skeleton).

### Services worth knowing

| File | Role |
|------|------|
| `storage.ts` | Progress, sessions, IRT, workout resume, habits |
| `dailyWorkoutPlan.ts` | Date-stable mixed plans |
| `supabaseClient.ts` / `authService.ts` / `syncService.ts` | Optional cloud |
| `entitlements.ts` | Premium + **test mode** |
| `wittLocalReply.ts` | Deterministic coach |
| `webPush.ts` | PushManager → Supabase |
| `reminderScheduler.ts` | In-tab / SW local reminders |
| `difficultyFeel.ts` | Intensity copy from theta |

### API (`api/`)
`create-checkout-session`, `billing-portal`, `stripe-webhook`, `witt-chat`, `send-reminders`  
`_lib/auth`, `_lib/supabaseAdmin`, `_lib/stripe`

### Migrations (`supabase/migrations/`)
1. `001_init.sql` — profiles, user_data, RLS, signup trigger  
2. **`002_lock_premium_columns.sql`** — **required before charging** (revoke client write on `is_premium` / `stripe_customer_id`)  
3. `003_push_subscriptions.sql` — Web Push rows + RLS  

`vercel.json`: rewrite excludes `/api/*`; cron every 15m → `send-reminders`.

---

## 4. Daily workout

| Mode | Steps | Access |
|------|-------|--------|
| `coffee_break` | 1q + 1e | Free |
| `daily` | 2q + 2e | Free |
| `weekend_long` | 3q + 3e | Premium (or test mode) |

Exit **pauses** workout (Zeigarnik). Arcade/skill complete must **not** `clearActiveWorkout` unless mixed `WorkoutRunner` finished.

---

## 5. Engines (`mechanicType`)

`visual_grid`, `dual_nback`, `stroop`, `logic_deduction`, `voice_drill`, `brief_recall`, `clearer_sentence`, `number_sense`, `brevity_cut`, `quick_purchase`, `sequence_order`, `rsvp_reader`, `speed_match`, `signal_sweep`, `pattern_shift`, `synonym_race`, `tone_pick`, `attention_track`, `route_plan`, `inbox_triage`, + `choice_quiz` wrappers.

Result: `{ scoreEarned, correctCount, totalItems, totalTimeMs }`.

---

## 6. Env vars (see `.env.example`)

**Client:** `VITE_TEST_MODE`, `VITE_SUPABASE_*`, `VITE_VAPID_PUBLIC_KEY`, optional `VITE_STRIPE_PUBLISHABLE_KEY`  
**Server (Vercel only):** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `OPENAI_API_KEY`, `VAPID_*`, `CRON_SECRET`  

App runs with **zero** env vars (local-only). Never commit `.env`.

---

## 7. Remaining work (priority)

### Must do soon (process)
1. **Commit/push `VITE_TEST_MODE`** changes when user asks.
2. When user has accounts: apply SQL `001→002→003`, set Vercel env, deploy, smoke Checkout / Witt / Push.
3. Before production freemium: **`VITE_TEST_MODE=false`** (or unset) on all deploys.

### Product / eng backlog
1. **Deploy + secrets wiring** (user-blocked on accounts) — skipped until user has Supabase/Stripe.
2. **Playtest polish** after user exercises all games in test mode.
3. **Rename** — explicitly deferred.
4. Optional: real LLM for free tier never; keep free = local tips only.

### Done recently (local, may be uncommitted)
- **Unity pilot (Spatial Memory only):** Editor **6000.5.6f1** + WebGL installed. Live project: `unity/SenwittSpatialMemory/` (batch menu `SENWITT/Build WebGL`). First WebGL build in `public/unity/spatial-memory/Build/` (~9MB gzip). React: `VITE_UNITY_SPATIAL=true` + `UnitySpatialMemoryHost` (handles `.gz` URLs). HTML fallback remains if build missing.
- **Brand art wiring** (uncommitted): ChatGPT assets from `../SENWITT-web-image-assets` optimized into `public/images/` (~1.5MB). Hero photo on Train, brand mark in Navbar, arcade game covers, install/onboarding illustrations, PWA jpeg icons. Map in `src/assets/brandImages.ts`. Note: source `game-02-dual-n-back` / `game-08-brevity-cut` PNGs are unusually small — regenerate if covers look weak.
- **Phase UI polish** (uncommitted): visual/motion pass over Bright Focus system — no new brand, no purple/dark-glass, no `transform` added to any clickable CTA.
  - `src/index.css`: ambient `.app-atmosphere` (3 fixed, blurred, slow-drifting blobs behind content, `prefers-reduced-motion` respected) + richer body background gradients; `.game-tile`/`.stat-pill`/`.glass-panel` hover lift (`translateY`, non-CTA elements only); `.game-tile--recommended` / `.game-tile--locked` classes (replaced inline `transform: scale` on tiles so hover lift composes correctly); `.tile-art` inset depth + diagonal sheen + icon hover pop (scale/rotate on the icon glyph, not the Play button); `.progress-fill` shimmer sweep (applied to Skill Library bars, `ExercisePlayer` rep bar, `WorkoutProgressBar` endowed-progress bar); gradient underline accent under `.section-header`/`.section-header-center` `h1`; `.animate-modalPop` panel pop-in + backdrop fade for modal shells; `.animate-answer-correct` / `.animate-answer-incorrect` (pop / shake — only ever applied to already-`disabled` post-answer option buttons in `ExercisePlayer`, so click hit-testing is unaffected); extended `.stagger-children` nth-child delays from 6 → 10+ for larger grids (arcade/skills).
  - `App.tsx`: mounts the `.app-atmosphere` blob layer once at root (fixed, `z-0`, `pointer-events: none`, behind `Navbar`/`main`).
  - `GamesArcade.tsx`: recommended/locked tile styling moved from inline `style={{ transform: ... }}` to CSS classes.
  - `SkillCatalog.tsx`, `ExercisePlayer.tsx`, `WorkoutProgressBar.tsx`: added `progress-fill` class to progress bars; `WorkoutProgressBar` current-step chip gets a subtle `animate-breathe` (box-shadow only, not transform).
  - `AccountModal.tsx`, `UpgradeModal.tsx`, `SessionSummaryModal.tsx`, `SessionHistoryModal.tsx`, `WittChatModal.tsx`: backdrop fade-in + panel pop-in on open.
  - Build verified green (`tsc -b && vite build`, no errors) after every change. Not committed.
- `VITE_TEST_MODE` unlock for playtesting.
- **Vendor chunk split** via Vite 8 `rolldownOptions.output.codeSplitting` (`vendor-react`, `vendor-supabase`, `vendor`) — main entry ~185KB gzip-friendly; no 500KB warning.
- **Push DST:** `refreshWebPushTimezone` on visibility + 6h interval while reminders on.
- **Cron pagination:** `send-reminders` pages `push_subscriptions` past 1k and chunks `user_data` `.in()` lookups.
- **Engine correctness fixes (full-arcade audit, all engines read):**
  - `DualNBackGame`: the step-loop `useEffect` had `score` in its dependency array, so every scored tap re-ran the effect, reset both match flags back to `false`, and restarted the 2400ms step timer — letting a player spam-click Position/Letter match for repeated points on the same step. Now reads score via a `scoreRef` and no longer depends on `score`.
  - `StroopDrill`: `handleAnswer` (button click path) didn't guard the post-answer feedback window the way the keyboard handler already did, so rapid clicks during the ~300–450ms feedback pause could score the same trial multiple times or double-fire `onComplete` on the last trial. Added the same `feedback !== null` guard + disabled the answer buttons during feedback.
  - `BrevityCutDrill`: `finishRound` (Lock-in button vs. round-timer expiry) had no double-finish guard and read `selected` state directly instead of a ref — same class of race already fixed in `SignalSweepDrill`. Ported the `finishingRef` + `selectedRef` pattern over.
- **Reviewer follow-ups (post-SHIP, Medium):**
  - `App.tsx`: arcade/custom-game `onComplete` props were fresh inline lambdas (`(s) => handleCustomGameComplete(s, 'dual_nback')`, etc.) on every render. Several engines (`DualNBackGame`, `FocusTrackDrill`, `PatternShiftDrill`, `SpeedMatchDrill`) list `onComplete` in an effect/`useCallback` dependency array, so an App re-render (e.g. any parent state change while a game is active) could re-run those effects mid-step and reset timers/flags. Added a `handleCustomGameCompleteRef` + a `useMemo(() => ({...}), [])` map (`arcadeOnComplete.<mode>`) that hands each arcade mode one stable callback for the component's lifetime while still always calling the latest `handleCustomGameComplete` closure. `onCancel` wasn't touched (no engine has it in an effect dep array).
  - `BrevityCutDrill`: `handleNext`'s final-round `onComplete` call didn't have the `activeRef` unmount guard `SignalSweepDrill` uses (guards against calling `onComplete` after the component has been unmounted, e.g. user exits right as the fanfare/last-round transition fires). Added the same `activeRef` effect + `if (!activeRef.current) return;` check for 1:1 parity.

### Spotted, not fixed (left for a follow-up pass)
- `UpgradeModal` "Manage billing" / "Continue to Stripe" will hit real `/api/*` routes and error out under `VITE_TEST_MODE` (no Stripe wired) — expected while accounts/Stripe are still user-blocked; out of scope for this pass.
- `DailyReminderBanner` intentionally hides the banner on a fresh tab/reload later the same day once already shown once (`alreadyMarkedToday && !shownThisTab`) — reads as correct "don't spam" behavior per its own comment, but worth a UX gut-check during playtesting since a user who closes and reopens the app won't see the nudge again that day.

---

## 8. Hard-won learnings (do not re-break)

### Data / sync
- Empty remote `user_data` `{}` must **not** import over local — require `payload.progress`.
- Stamp `clientUpdatedAt` even when signed out (`pushSoon`), or first login can lose local progress to older remote.
- After pull import: refresh React state **and** `abilityOrchestrator.setAbilityProfile`.

### Freemium / security
- Client must not be able to `update({ is_premium: true })` — migration `002` column revoke.
- Server re-checks premium on Witt / Stripe paths; never trust client-only flags for LLM spend.
- Webhook uses raw body + signature; match user via `metadata.user_id` / `stripe_customer_id`.

### Game engines
- `ExercisePlayer`: use `attemptsRef` when finishing 1-item quiz steps (stale state drops attempts).
- Timed drills: `finishingRef` + `activeRef`; clear timers on cancel so Exit ≠ `onComplete`.
- Signal Sweep: sync selection refs on timer expiry; guard double-finish.
- Focus Track: ≥44px tap targets; reject taps after deadline.

### UI / CSS
- Universal reset **inside** `@layer base` or Tailwind spacing dies.
- Infinite CTA pulse: **no** `transform: scale` (broke clicks).
- Modal lazy fallbacks: fixed backdrop, not in-flow skeleton.
- Delete macOS `Icon\r` zero-byte files; never commit them.

### Reminders / push
- Dedupe OS notify with localStorage day flags; avoid page + SW double fire.
- Cron: check `last_notified_date` write errors or same-day duplicates return.
- Disable reminder → `unsubscribeWebPush`.

### Workflow
- Git root is `app/`, not parent folder.
- User prefers multi-agent orchestration for larger work.
- Do not revive deleted hype modules (`uiPsychologyAgents`, procedural generators, Three.js bg, Agent Studio).

---

## 9. Agent workflow conventions

- **Orchestrator** stays in chat; spawn implementer then reviewer for multi-file features.
- Skills often used: frontend-design, Vercel React best practices, Matt Pocock / Karpathy style, UI psychology skills under `~/.cursor/skills/`.
- Frontend design user rules: brand-first, avoid purple/cream-terracotta AI clichés, no card-heavy heroes, full-bleed hero on landing-like surfaces.
- Only commit/push when asked; no force-push main; no `--no-verify` unless asked.

---

## 10. Transcripts & research

| Resource | Path |
|----------|------|
| Prior chat transcript | `/Users/faithinpurple/.cursor/projects/Users-faithinpurple/agent-transcripts/9f358621-e62e-4bba-8330-3d2a96720d96/` |
| Competitive research dump | `/Users/faithinpurple/Downloads/brain_app_game.md` |

---

## 11. Suggested first moves for next session

1. Read this file + `git status` (commit test mode + vendor/push polish when asked).  
2. Ask user for playtest findings under `VITE_TEST_MODE`, or wait for deploy/accounts.  
3. If deploying: walk through migrations + `.env.example` server vars (exclude until asked).  
4. If polishing: fix issues found during full-arcade playtest under test mode.  

---

*End of master handoff. Update this file when major milestones land.*
