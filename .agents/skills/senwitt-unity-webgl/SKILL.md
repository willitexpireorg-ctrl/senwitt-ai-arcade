---
name: senwitt-unity-webgl
description: >-
  Build and embed SENWITT arcade drills as Unity WebGL inside the React/Vite app.
  Use when working on Unity games, WebGL builds, Spatial Memory Grid Unity trial,
  unity/ folder, VITE_UNITY_SPATIAL, or replacing HTML engines with Unity.
---

# SENWITT × Unity WebGL

Read [`SESSION_HANDOFF.md`](../../../SESSION_HANDOFF.md) first. Product stays **SENWITT**. Bright Focus palette (teal `#0f766e` / `#14b8a6`, coral `#ff5c3a`, mist `#eef3f8`). No IQ / clinical theater.

## Companion skills (install / already in `.agents/skills/`)

| Skill | When |
|-------|------|
| `unity-cli` | Install Unity editor, headless project/build |
| `new-unity-project` | Bootstrap a Unity 6 / 6.5 project |
| `unity-csharp-scripting` | MonoBehaviour lifecycle, coroutines |
| `unity-build-pipeline` | Player / WebGL build settings |
| `unity-package-management` | UPM packages |
| `senwitt-game-quality` | Fairness, scoring, result shape |

**Editor target:** Unity **6.5** (`6000.5.x`) with **WebGL Build Support**.

Skip ads/IAP skills (`levelplay-*`, `implement-in-app-purchases`) unless user asks.

## Trial scope (current)

**Only Spatial Memory Grid** (`mechanicType: visual_grid`) is the Unity pilot.

| Path | Role |
|------|------|
| `unity/SpatialMemoryGrid/` | Unity project sources (C#, scenes notes) |
| `public/unity/spatial-memory/` | Built WebGL output (gitignored until first build) |
| `src/components/UnitySpatialMemoryHost.tsx` | React loader + JS↔C# bridge |
| `src/components/SpatialMemoryGame.tsx` | HTML fallback (always kept) |
| `VITE_UNITY_SPATIAL=true` | Prefer Unity host when build files exist |

## Result contract (must match HTML)

Unity must post the same shape the React app already expects:

```ts
{ scoreEarned: number; correctCount: number; totalItems: number; totalTimeMs: number }
```

Rules parity with HTML Spatial Memory:

- `MAX_ROUNDS = 4`
- Sequence length = `round + 2`
- No consecutive duplicate tiles
- Points: `round * 30` per cleared round; `+50` bonus if all 4 clear
- Fail finishes with `correctCount = roundsCleared` (HTML: `round - 1`)
- Exit ≠ complete (cancel from React chrome)

## Bridge protocol

**Unity → JS** (`Application.ExternalCall` / `.jslib`):

- `senwittUnityReady()` when playable
- `senwittUnityComplete(jsonString)` with result contract
- `senwittUnityCancel()` if in-game exit (optional; React Exit preferred)

**JS → Unity** (`unityInstance.SendMessage`):

- `GameRoot`, `Configure`, `{"gridSize":3|4}`
- `GameRoot`, `StartGame`, ``

## Build steps (human + agent)

1. Install **Unity Hub** + **Unity 6.5** with **WebGL Build Support**.
2. Prefer: Hub **New 2D project** on 6.5, then copy `unity/SpatialMemoryGrid/Assets/*` in (see README).
3. Scene: GameObject `GameRoot` + `SpatialMemoryGameController` → Play in Editor to smoke-test.
4. Build WebGL → `app/public/unity/spatial-memory/` (`Build/*.{loader.js,framework.js,data,wasm}`).
5. Set `VITE_UNITY_SPATIAL=true` in `.env` → `npm run dev` → Spatial Memory from arcade.

If WebGL build is missing, React **must** fall back to HTML engine (never blank screen).

## Anti-patterns

- Replacing all engines before Spatial pilot proves load time / mobile memory
- Shipping multi‑hundred‑MB uncompressed builds (use Brotli/gzip; strip unused modules)
- Breaking freemium / workout wiring
- Commit/push huge `Library/` or `Temp/` Unity folders — gitignore them

## Agent checklist

- [ ] Read `unity-csharp-scripting` for script style
- [ ] Keep HTML fallback working
- [ ] Match result contract + fairness rules
- [ ] Bright Focus colors in Unity materials/UI
- [ ] Document build output path in handoff when first WebGL lands
