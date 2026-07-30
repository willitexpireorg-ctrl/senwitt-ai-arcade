---
name: code-review-and-refine
description: Systematic multi-subagent code review, accessibility audit, performance optimization, and UI polish protocol for web applications.
---

# Code Review and Refine Skill Protocol

This skill provides a systematic multi-subagent protocol for auditing, refining, and polishing web applications.

## 1. Audit Dimensions

### A. Performance & Render Optimization
- Inspect React component render loops and state setters.
- Verify zero unnecessary re-renders during state updates.
- Ensure production bundle builds cleanly in < 300ms.

### B. UI & Micro-Animation Polish
- Audit visual hierarchy, glassmorphism contrast ratio, and dynamic border stokes.
- Ensure interactive buttons have hover scale transitions (`scale-[1.02]`), active press states, and clear focal CTAs.
- Verify fluid CSS keyframes and glassmorphic depth perception.

### C. Accessibility & Focus States
- Add ARIA attributes (`aria-label`, `aria-expanded`, `role="button"`) to interactive elements.
- Ensure focus outline rings (`focus:outline-none focus:ring-2 focus:ring-indigo-500`) are visible for keyboard users.
- Ensure minimum 48px touch targets for mobile viewports.

### D. Data Integrity & Resilience
- Verify in-memory fallbacks when storage mechanisms throw.
- Ensure date calculations use local wall-clock formatting (`getLocalDateString`).
- Guard mathematical calculations against `NaN` or zero-division edge cases.

## 2. Execution Verification
Always run build and static analysis commands:
```bash
npx tsc --noEmit && npm run build
```
Verify zero TypeScript compilation warnings or unused imports before final sign-off.
