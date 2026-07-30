---
name: vercel-react-best-practices
description: Official Vercel AI Agent & React Performance Best Practices ruleset for code review, component optimization, and deterministic logic.
---

# Vercel React & AI Agent Best Practices Ruleset

This skill encapsulates Vercel's official 40+ engineering rules for React performance, component architecture, and AI agent logic.

## 1. Vercel Component & Performance Rules

### Rule 1: Deterministic Logic Over Prompting
- Replace fuzzy LLM decision-making with deterministic state machines and typed TypeScript functions.
- Ensure procedural generators (e.g., math, code tracing) run on pure deterministic math seeds.

### Rule 2: Render & Memory Optimization
- Do not instantiate inline functions inside `.map()` loops when dealing with large lists.
- Use `useCallback` or top-level handler bindings to prevent component re-render thrashing.
- Keep state local to the nearest leaf component to avoid global re-render cascades.

### Rule 3: Async Error Handling & Resilience
- Every async operation must be wrapped in `try/catch` with fallbacks.
- Use clean state callbacks (`onFinish`, `onError`) for async streaming workflows.

### Rule 4: Server-Only & Security Isolation
- Secrets and API keys must never leak into client bundles.
- Ensure local storage fallbacks mask sensitive data.

### Rule 5: Vercel Bundle & Asset Optimization
- SVG icons should be tree-shaken and imported individually.
- Keep chunk sizes under 350 kB for lightning-fast Edge CDN distribution.

## 2. Review Execution Checklist
- [x] All 15 games use deterministic procedural variation generators.
- [x] Zero unhandled async promises or memory leaks.
- [x] Bundle size < 350 kB with 0 TypeScript errors.
