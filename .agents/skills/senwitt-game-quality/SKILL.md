---
name: senwitt-game-quality
description: >-
  Improves SENWITT arcade/daily drill quality and content volume: item banks,
  fairness, feel, adaptive pacing, and new practical games. Use when the user
  asks to improve games, expand the arcade, playtest polish engines, add drills,
  or run the game-quality agent/subagent.
---

# SENWITT Game Quality

Read [`SESSION_HANDOFF.md`](../../../SESSION_HANDOFF.md) first. Product name stays **SENWITT**. Bright Focus UI. Local-first. No IQ / brain-age / clinical theater. No Three.js / fake AI theater / procedural “1500 variations” generators.

Agent persona (when orchestrating): [agent.md](agent.md)  
Deep checklist: [checklist.md](checklist.md)

## Mission

Raise **feel**, **fairness**, and **replay value** across every live `mechanicType`, then grow **content volume** (and new engines only when a real skill gap remains).

## Live engines (must cover)

`visual_grid`, `dual_nback`, `stroop`, `logic_deduction`, `voice_drill`, `brief_recall`, `clearer_sentence`, `number_sense`, `brevity_cut`, `quick_purchase`, `sequence_order`, `rsvp_reader`, `speed_match`, `signal_sweep`, `pattern_shift`, `synonym_race`, `tone_pick`, `attention_track`, `route_plan`, plus `choice_quiz` bank-backed drills.

Wire any new engine into: component + `lazyEngines.tsx` + `App.tsx` arcade map + `researchAgent.ts` GameSpec + `GamesArcade` visuals + `dailyWorkoutPlan.ts` when appropriate.

## Quality bar (every engine)

1. **Honest skill** — trains a bounded real-world micro-skill (recall, filtering, brevity, estimation, rule-switch, route planning). Copy states practice, not cure.
2. **Content volume** — static banks large enough that same-day replay rarely repeats the exact same set. Prefer ≥12 distinct items/rounds where the mechanic is bank-driven; date-stable or seeded shuffle OK.
3. **Fairness** — no double-finish; timer vs tap races use `finishingRef` + selection refs; Exit ≠ `onComplete`; late taps after deadline rejected; ≥44px targets.
4. **Scoring** — result shape `{ scoreEarned, correctCount, totalItems, totalTimeMs }`; scoring logic explainable in one sentence.
5. **Feel** — clear prompt, one job per screen, immediate correct/incorrect feedback, short explanation on miss when MCQ-like; Bright Focus tokens; no card-soup hero patterns.
6. **Adaptation** — respect existing level/theta hooks when present; change one difficulty knob at a time (speed, distractors, n-level, grid size).
7. **Variety** — rotate workplace-relevant English contexts; avoid trivia for trivia’s sake.
8. **Lazy + build** — engines stay code-split; `npm run build` green.

## Improvement priority

1. Fix correctness / double-score / unfair timer bugs.
2. Expand thin banks (e.g. 4-item drills → 12–20).
3. Improve feedback, pacing, and difficulty curves.
4. Add **one** new engine only if categories are thin after bank expansion (prefer practical knowledge-worker skills from research dump).

## Anti-patterns

- Fake “AI-generated infinite levels” without real content
- Procedural nonsense that fails the honest-skill bar
- IQ / percentile / brain-age theater
- Breaking freemium: free daily plan must stay useful
- Stripe / deploy / rename scope creep
- Committing unless the user asked

## Workflow

```
Task Progress:
- [ ] Inventory each engine: bank size, session length, known pitfalls
- [ ] Fix fairness/scoring bugs
- [ ] Expand banks + improve feel/copy
- [ ] Wire arcade/daily plan if new or changed labels
- [ ] npm run build
- [ ] Note changes in SESSION_HANDOFF.md
```

## Return format (to orchestrator)

- Per-engine: before → after (bank size / feel / bugs fixed)
- New engines (if any): wiring checklist
- Build status
- Left for later
