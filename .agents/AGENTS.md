# Vercel AI Agent Rules & Workspace Guidelines

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
