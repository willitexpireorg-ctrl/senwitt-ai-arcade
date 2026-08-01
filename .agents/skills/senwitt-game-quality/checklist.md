# Game quality checklist

Use per engine before calling it done.

## Correctness

- [ ] No double `onComplete` (button + timer + keyboard)
- [ ] `finishingRef` / `activeRef` on timed drills; clear timers on cancel/unmount
- [ ] Selection synced to refs before timer-expiry scoring
- [ ] Stale closures: prefer refs for score/attempts used inside effects
- [ ] `onComplete` not forced into effect deps unless identity is stable

## Content

- [ ] Bank size ≥12 for MCQ/round banks (or procedural with many distinct seeds)
- [ ] Session samples without obvious immediate repeats when possible
- [ ] Explanations honest and short on misses
- [ ] Options shuffled or authored so correct answer isn’t always first
- [ ] Workplace-relevant English; no clinical claims

## Feel / a11y

- [ ] One clear prompt; primary action obvious
- [ ] Tap targets ≥44px
- [ ] Keyboard path matches click fairness (if keyboard supported)
- [ ] Bright Focus tokens; sounds via existing `sound.ts` helpers
- [ ] EvidencePanel only where already used / skill evidence exists

## Integration

- [ ] Arcade launch path in `App.tsx`
- [ ] Lazy export in `lazyEngines.tsx`
- [ ] `GameSpec` in `researchAgent.ts`
- [ ] Icon/art in `GamesArcade.tsx` `GAME_VISUALS`
- [ ] Daily plan mechanic list if engine should mix into workouts
- [ ] Result shape matches storage/session pipeline

## Regression

- [ ] Arcade complete does **not** `clearActiveWorkout` unless mixed workout finished
- [ ] `npm run build` green
