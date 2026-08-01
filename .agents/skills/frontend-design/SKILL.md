---
name: frontend-design
description: Design leadership skill for SENWITT — Elevate × Lumosity bright cognitive-training UI. Combats generic AI slop, enforces brand-first heroes, tactile controls, and a light optimistic visual system.
---

# Frontend Design & UI Excellence Skill

Use this skill whenever creating, updating, or reviewing any frontend component, page layout, or CSS style system for SENWITT.

## 1. Aesthetic Direction — Bright Focus (Elevate × Lumosity)

**Chosen language:** Light, optimistic cognitive gym — not cyberpunk glass, not purple neon dark mode.

- **Canvas:** Cool mist backgrounds (`#eef3f8`), white surfaces, soft blue-gray atmosphere
- **Brand / primary:** Teal (`#0f766e` → `#14b8a6`) — Lumosity energy without clinical coldness
- **Energy / CTA:** Coral (`#ff5c3a`) — Elevate-style motivation for primary actions and streaks
- **Typography:** `Sora` (display/brand) + `Nunito` (UI body) + `IBM Plex Mono` (scores/timers). Never Inter/Roboto/Arial as the identity stack.
- **Motion:** Hero drift, CTA pulse (box-shadow only), staggered tile entrance — 2–3 intentional motions, no glow spam

## 2. Core Principles

1. **Brand first on home:** First viewport must read as SENWITT. Brand name is hero-level, not a nav-only mark.
2. **Center the composition:** Hero copy, training card, section headers, chips, and grids are centered in `.page-shell` — never left-pinned into a dead corner.
3. **Elevate overlap pattern:** Compact full-bleed `.hero-plane` + overlapping white `.training-card` (ring + primary CTA). Stats and secondary workouts sit below, centered.
4. **Lumosity tiles:** `.game-tile` + `.tile-art` color wells; titles/descriptions/targets wrap fully — no `truncate` / mid-word clipping.
5. **Tactile 3D buttons:** `btn-3d` coral/teal. Never animate `transform` on clickable controls (breaks hit-testing). Pulse via box-shadow only.
6. **No AI slop defaults:** Avoid purple-on-white, cream+terracotta broadsheet, dark neon glassmorphism, glow stacks.

## 3. Layout & Components

- Container: `.page-shell` (`max-w-6xl` centered)
- Home: `.training-card` overlap; stats via `.stat-pill`
- Games/Skills: `.tile-art` wells + wrapping `.tile-title` / `.tile-desc` / `.tile-target`
- Mobile: fixed bottom tabs with full labels; hide during workouts
- Desktop: compact top segmented nav

## 4. Implementation Checklist

- [ ] Light theme tokens from `index.css` (`--bg-primary`, `--accent-teal`, `--accent-coral`)
- [ ] Brand readable without the nav; hero content centered
- [ ] Primary CTA is coral or teal tactile button; pulse without transform
- [ ] No truncated tile/nav copy; descriptions wrap 2–3 lines
- [ ] Responsive: 390 / 768 / 1440
- [ ] Focus rings visible (`focus-ring`)
- [ ] No purple neon / dark glass regression; light surfaces use `--text-primary` / `--text-secondary` (not leftover dark-theme gray/white)
