# Vercel AI Agent Rules & Workspace Guidelines

> **Project memory (read first):** [`../SESSION_HANDOFF.md`](../SESSION_HANDOFF.md)  
> Cursor always-apply rule: [`.cursor/rules/senwitt-handoff.mdc`](../.cursor/rules/senwitt-handoff.mdc)  
> If this file conflicts with the handoff on product direction (e.g. Three.js backgrounds, procedural generators), **follow SESSION_HANDOFF.md**.  
> **Game quality agent/skill:** [`.agents/skills/senwitt-game-quality/SKILL.md`](skills/senwitt-game-quality/SKILL.md) (+ `agent.md`) — use when improving arcade/daily drills.  
> **Unity WebGL pilot:** [`.agents/skills/senwitt-unity-webgl/SKILL.md`](skills/senwitt-unity-webgl/SKILL.md) — Spatial Memory only; also use `unity-cli`, `unity-csharp-scripting`, `unity-build-pipeline`, `new-unity-project`.

All AI coding subagents working in this codebase MUST strictly follow Vercel's Official React & AI Agent Best Practices:

## 1. Deterministic Logic Over Prompting
- Replace prompt-based decision-making with deterministic functions, typed schemas, and state machines wherever possible.
- Procedural exercise generators (`proceduralGenerator.ts`, `gameVariationsFactory.ts`) must remain 100% deterministic and pure.

## 2. Component Performance
- Keep state local to leaf components to prevent full-tree re-rendering.
- Ensure event handlers inside long loops use memoized handlers or inline-safe bindings.
- Keep Vite production bundle chunks under 350 kB.

## 3. Resilience & Security
- Wrap all LocalStorage operations in safe fallback wrappers.
- Never expose sensitive keys in client bundles.

## 4. Mandatory Frontend Design & UI Excellence
- For ALL frontend web applications, HTML/CSS, React, Vue, UI components, and layout tasks: ALWAYS activate and strictly enforce the `frontend-design` skill (`.agents/skills/frontend-design/SKILL.md`).
- NEVER build generic, plain, or "AI slop" interfaces (isolated small floating boxes on empty backgrounds).
- ALWAYS create full-bleed, responsive, tactile 3D, high-contrast, visually stunning web experiences with 3D WebGL/Canvas backgrounds, 3D press-depth buttons, and rich micro-interactions.
