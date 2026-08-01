# SENWITT — Session Handoff

**Last updated:** 2026-07-31 (post Tier C track/route)  
**Purpose:** Full context for a new agent/session. Do not rename the product (stays **SENWITT**).

---

## 1. What this is

Local-first React brain-training SPA (Elevate / Lumosity / MindRelay–inspired), ~5-minute daily workouts mixing quizzes + interactive drills. Honest claims only — no IQ/brain-age theater, no fake “AI agent” audit panels.

| | |
|---|---|
| **App path (git root)** | `/Users/faithinpurple/Downloads/APPDEV/Brain Learning/app` |
| **Parent folder** | `/Users/faithinpurple/Downloads/APPDEV/Brain Learning/` (not a git repo) |
| **Remote** | `https://github.com/willitexpireorg-ctrl/senwitt-ai-arcade.git` |
| **Branch** | `main` (tracking `origin/main`) |
| **Stack** | React 19 + Vite 8 + TypeScript + Tailwind 4 + Lucide |
| **Persistence** | `localStorage` only (no backend/auth yet) |
| **Dev server** | `npm run dev -- --host 127.0.0.1 --port 5173` → `http://127.0.0.1:5173/` |
| **Build** | `npm run build` (`tsc -b && vite build`) |

### Recent commits (pushed)

```
1bb858b feat: felt difficulty, SW reminders, lazy engines, Synonym Race & Tone Pick
743cde8 feat: Bright Focus UI, Tier A/B engines, mixed daily workouts, and habit UX
b9f4e06 fix: ground content validity, cut fake AI theater, and simplify the app
```

As of handoff, working tree should be clean and synced with `origin/main`.

---

## 2. Product positioning

- **Wedge:** 5–7 min practice of *work-relevant* micro-skills (writing, math, code, memory, reading, reasoning) — closer to Elevate + MindRelay than pure abstract “brain games.”
- **Brand:** SENWITT (do not rename). Coach character: **Witt** (canned tips, not LLM).
- **UI theme:** **Bright Focus** — light teal/coral, Sora/Nunito-style fonts, tactile 3D buttons, centered `page-shell` layouts. Tokens in `src/index.css`. Avoid purple-glow / dark-mode AI slop.
- **Ethics:** No fake scarcity, no guilt-streak copy. Momentum (5 days/week) + grace tokens + streak shields preferred over anxiety.

---

## 3. Architecture map

### Entry / shell

- `src/main.tsx` — React root + service worker register
- `src/App.tsx` — navigation, session orchestration, arcade launch, workout runner, baseline gate
- `src/index.css` — Bright Focus design system
- `index.html` + `public/manifest.json` + `public/sw.js` (`senwitt-v3`) — PWA

### Core data / services

| File | Role |
|------|------|
| `src/types/index.ts` | `UserProgress`, `SessionResult`, `ExerciseItem`, baseline + habit fields |
| `src/data/exerciseBank.ts` | Core MCQs + `getDailySetForMode` / `getSkillPracticeSet` (shuffled options) |
| `src/data/exerciseBankExtra.ts` | Extra handcrafted MCQs (~150 total with core) |
| `src/data/exerciseEvidence.ts` | “What this practises” cards |
| `src/services/storage.ts` | Progress, sessions, IRT, active workout resume, habit prefs, baseline defer |
| `src/services/dailyWorkoutPlan.ts` | Date-stable mixed quiz ↔ engine daily plans |
| `src/services/researchAgent.ts` | `GameSpec` catalog + `mechanicType` union |
| `src/services/irtAdaptiveEngine.ts` | Theta / Glicko calibration |
| `src/services/phase2Orchestrator.ts` | Flow-state queue filter + persisted ability |
| `src/services/difficultyFeel.ts` | User-facing intensity bands / session difficulty copy |
| `src/services/reminderScheduler.ts` | Notification permission + SW reminder posts |
| `src/services/sessionInsights.ts` | Momentum, weekly report, application cues |
| `src/services/sound.ts` | Click/correct/incorrect/fanfare (try/catch safe) |

### Key UI

| Component | Role |
|-----------|------|
| `Dashboard.tsx` | Hero + daily workout CTA, done-for-today, habit cues, continue/resume |
| `WorkoutRunner.tsx` + `WorkoutProgressBar.tsx` | Multi-step mixed session (quiz + engines) |
| `ExercisePlayer.tsx` | MCQ player (`attemptsRef` critical for 1-item steps) |
| `GamesArcade.tsx` | Recommended + Browse all; unique icons per game |
| `BaselineAssessment.tsx` | Optional onboarding; skip → 2-min workout |
| `SessionSummaryModal.tsx` | Peak-end celebration + habit/reminder commitment + difficulty card |
| `AnalyticsPage.tsx` | Progress, momentum, intensity band, Zeigarnik CTA |
| `WittCompanion.tsx` | Primary = Start/Continue daily; secondary = skill practice |
| `InstallPrompt.tsx` | Only after first completed session (reciprocity) |
| `DailyReminderBanner.tsx` | In-app reminder when opt-in time passed |
| `EvidencePanel.tsx` | Expandable evidence copy on drills |
| `engines/lazyEngines.tsx` | `React.lazy` wrappers for drills |

### Nav tabs

Daily Set (`dashboard`) · Games (`arcade`) · Skill Library (`skills`) · Progress (`progress`)

---

## 4. Daily workout plan (important)

**Not MCQ-only.** `buildDailyWorkoutPlan(mode)` alternates quiz ↔ engine:

| Mode | Steps | ~Time |
|------|-------|-------|
| `coffee_break` | 1 quiz + 1 engine | ~2 min |
| `daily` | 2 quiz + 2 engines | ~5 min |
| `weekend_long` | 3 quiz + 3 engines | ~10 min |

- Date-seeded PRNG → stable for the calendar day
- Soft bias toward baseline weak areas
- Exit **pauses** (Zeigarnik Continue CTA); Start over discards
- Resume: `getActiveWorkout` / `saveActiveWorkout` / `clearActiveWorkout` in storage
- Arcade solo games still complete their own session via `handleCustomGameComplete` and must **not** wipe a paused daily workout

---

## 5. Game engines (mechanic types)

### Live interactive engines

| mechanicType | Title | Category | Notes |
|--------------|-------|----------|-------|
| `visual_grid` | Spatial Memory Grid | memory | Adaptive grid size |
| `dual_nback` | Dual N-Back | memory | Adaptive n |
| `stroop` | Stroop Speed Drill | reasoning | Adaptive trials |
| `logic_deduction` | Logic Deduction | reasoning | |
| `voice_drill` | Speech Fluency Drill | writing | Mic rewrite |
| `brief_recall` | Brief Recall | memory | Passage → facts |
| `clearer_sentence` | Clearer Sentence | writing | Rewrite MCQ |
| `number_sense` | Number Sense | math | |
| `brevity_cut` | Brevity Cut | writing | Tier A — tap fillers |
| `quick_purchase` | Quick Purchase | math | Tier A — money math |
| `sequence_order` | Sequence Order | memory | Tier A — reorder steps |
| `rsvp_reader` | RSVP Reader | reading | Tier A — flash WPM |
| `speed_match` | Speed Match | reasoning | Tier B — same/different |
| `signal_sweep` | Signal Sweep | reasoning | Tier B — selective attention |
| `pattern_shift` | Pattern Shift | reasoning | Tier B — rule switch |
| `synonym_race` | Synonym Race | writing | Tier C starter |
| `tone_pick` | Tone Pick | writing | Tier C starter |
| `attention_track` | Focus Track | reasoning | Tier C — divided attention / lanes |
| `route_plan` | Route Planner | reasoning | Tier C — pathfinding puzzles |

Plus `choice_quiz` entries per skill (MCQ bank wrappers) in Games.

Engine files live under `src/components/engines/`. Result shape for arcade/workout:

```ts
{ scoreEarned: number; correctCount: number; totalItems: number; totalTimeMs: number }
```

---

## 6. Habit / UI psychology (shipped)

Installed agent skills (global → `~/.cursor/skills/`):  
`cognitive-psychology-ux`, `improve-retention`, `influence-psychology`, `ui-ux-design-patterns`

**In-product patterns (ethical, not dark):**

- Zeigarnik: continue workout, Progress CTA if not trained
- Endowed progress on workout bar
- Peak-end: “done for today”, summary celebration, “last step”
- Hick: fixed daily plan; Games “Recommended” vs “Browse all”
- Tiny Habits: habit anchor + opt-in reminder time
- Commitment: baseline minutes 2/5/10; summary remind tomorrow
- Reciprocity: install prompt only after first workout
- B=MAP Ability: skip baseline → 2-min coffee workout
- Felt difficulty: intensity band from IRT theta (no IQ claims)

**UserProgress habit-related fields:**  
`habitAnchor`, `dailyMinutesGoal`, `reminderEnabled`, `reminderTime`, `reminderLastShownDate`, `earnedInstallPrompt`, plus baseline/grace/momentum fields.

---

## 7. Workflow conventions for agents

User prefers **orchestrator + implementer + reviewer** subagents for larger features.

Also installed globally (various sessions): Vercel React best practices, Matt Pocock-style skills, Karpathy guidelines — under `~/.agents/skills/` / `~/.cursor/skills/`.

**Frontend design rules (user):** Bright Focus already set — when designing, avoid purple-on-white, cream+terracotta clichés, card-heavy heroes; brand-first; full-bleed heroes on landing-like surfaces.

**Git rules:** Only commit/push when asked. Repo is `app/`, not the parent folder. Never force-push main. No `--no-verify` unless asked.

**Do not revive:** deleted hype modules (`uiPsychologyAgents`, procedural “1500 variations,” Three.js background, Agent Studio). Keep claims grounded.

---

## 8. What’s done vs pending

### Done (do not re-do)

- Content validity fix (shuffled MCQs), cut fake AI theater
- Bright Focus UI redesign + polish
- Baseline + skip; momentum / grace / shields
- Evidence panels + application cues
- Tier A + B engines + fold into daily plan
- UI psych skill pass across Dashboard/Games/Summary/Witt
- Felt difficulty UI
- SW reminders v3 + scheduler
- Lazy-loaded engines (main ~448KB gz ~136KB)
- Synonym Race + Tone Pick
- Focus Track (`attention_track`) + Route Planner (`route_plan`) — wired into arcade, daily plan, WorkoutRunner
- Pushed through `1bb858b` (Tier C track/route may still be local-only until next commit)

### Pending / next (priority order)

1. **Ship path** — real deploy (Vercel already has `vercel.json`), accounts/sync, optional freemium.
2. **True closed-app push** — needs push server; today reminders need tab/SW context.
3. **Real Witt coach** — still keyword/canned; LLM would need API + privacy story.
4. **Further bundle trim** — main still ~448KB; more lazy routes possible.
5. **Rename** — explicitly deferred.

---

## 9. Known pitfalls (reviewer-found before)

- `ExercisePlayer` must use `attemptsRef` when finishing (stale state drops 1-item quiz attempts).
- Arcade/skill session complete must not `clearActiveWorkout` unless mixed `WorkoutRunner` finished.
- Signal Sweep / timed drills: guard double-finish with refs; sync selection on timer expiry.
- Cancel mid-feedback: clear timers + `activeRef` so `onComplete` doesn’t fire after Exit.
- Install prompt: capture `beforeinstallprompt` early; UI gated on `earnedInstallPrompt`.
- Reminder notify: dedupe with localStorage day flags; avoid double show (page + SW).
- CSS: universal reset must stay in `@layer base` or Tailwind spacing breaks.
- CTA pulse: prefer box-shadow/filter, not `transform` scale (broke clicks once).
- macOS junk `Icon\r` zero-byte files sometimes appear — delete, don’t commit.

---

## 10. Quick start for new session

```bash
cd "/Users/faithinpurple/Downloads/APPDEV/Brain Learning/app"
git status -sb
npm run dev -- --host 127.0.0.1 --port 5173
# verify: npm run build
```

**Transcript (prior chat):**  
`/Users/faithinpurple/.cursor/projects/Users-faithinpurple/agent-transcripts/9f358621-e62e-4bba-8330-3d2a96720d96/`

**Research dump user shared:**  
`/Users/faithinpurple/Downloads/brain_app_game.md` (competitive / product research)

---

## 11. Suggested first questions for next session

- Continue Tier C (track / route planning)?
- Deploy to Vercel + production smoke test?
- Accounts/sync design?
- Or bugfix / UX polish pass after user playtest?

---

*End of handoff.*
