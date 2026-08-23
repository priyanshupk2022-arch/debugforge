# SENTINEL-CHAIN: Cinematic Visual Design System & Token Architecture

**Specification Version:** 3.0.0  
**Design Archetype:** Precision Cyber Defense & Developer Infrastructure  
**Core Aesthetic:** Obsidian Void (`#07090E`), Brushed Gunmetal Surfaces, Hairline Zinc Borders, High Information Density, Restrained Micro-Motion.

---

## 1. Color Palette & Token Architecture

| Semantic Token | Hex / RGBA Value | Role / Purpose | Contrast Ratio (vs BG) |
| :--- | :--- | :--- | :--- |
| `--bg-void` | `#07090E` | Root canvas / ultra-deep background | Base (0:1) |
| `--bg-surface-1` | `#0D1117` | Primary content panels & Bento cards | 1.15:1 |
| `--bg-surface-2` | `#161B22` | Inner telemetry cards, drawers, code blocks | 1.35:1 |
| `--bg-surface-elevated`| `#21262D` | Hover states, modals, popovers | 1.85:1 |
| `--border-hairline` | `rgba(255, 255, 255, 0.08)` | Structural card outlines & dividers | N/A |
| `--border-focus` | `rgba(99, 102, 241, 0.40)` | Interactive focus states & active cards | N/A |
| `--text-primary` | `#F0F6FC` | Headings, hero display, key identifiers | 16.8:1 (AAA) |
| `--text-secondary` | `#8B949E` | Subheadings, descriptions, body copy | 7.4:1 (AAA) |
| `--text-muted` | `#484F58` | Timestamps, coordinate labels, footers | 3.2:1 (Large text) |
| `--signal-emerald` | `#10B981` | Restored health, 100% extraction, verified patch | 8.2:1 (AAA) |
| `--signal-rose` | `#F43F5E` | P0 Critical exposure alert, active exploit PoC | 6.5:1 (AA) |
| `--signal-amber` | `#F59E0B` | Mutation detected, scraper broken, auto-healing | 9.1:1 (AAA) |
| `--signal-indigo` | `#6366F1` | Bright Data collector, correlation engine, primary CTA | 5.8:1 (AA) |

---

## 2. Typography & Hierarchy Scale

- **Display Headline Font:** Inter / System Display Sans (`font-black`, tracking `-0.04em`, leading `1.05`)
- **Body / Interface Font:** Inter / SF Pro Text (`font-normal` / `font-medium`, tracking `-0.01em`, leading `1.6`)
- **Monospace Telemetry Font:** JetBrains Mono / Consolas (`font-medium` / `font-bold`, tracking `0.02em`)

### Type Scale Breakdown:
- **Hero Title:** `clamp(2.75rem, 6vw, 5rem)` — `leading-[1.02]`
- **Section Heading:** `clamp(1.875rem, 3.5vw, 2.75rem)` — `leading-tight`
- **Card Subheading:** `1.125rem` (18px) — `font-bold`
- **Body Copy:** `0.9375rem` (15px) — `text-[#8B949E]`
- **Telemetry & Badges:** `0.6875rem` (11px) — `font-mono tracking-wider uppercase`

---

## 3. Surface Elevations & Radius Scale

- **Border Radius:**
  - Bento Modules / Root Panels: `24px` (`rounded-3xl`)
  - Internal Cards / Buttons: `12px` (`rounded-xl`)
  - Status Indicators / Filter Pills: `9999px` (`rounded-full`)
- **Lighting & Shadows:**
  - Ambient Void Glow: `0 25px 50px -12px rgba(0, 0, 0, 0.75)`
  - Active Signal Accent: `0 0 25px -4px rgba(99, 102, 241, 0.25)`
  - Critical Alert Glow: `0 0 30px -4px rgba(244, 63, 94, 0.35)`

---

## 4. GSAP Motion & Interaction Choreography

- **Choreography Model:** ScrollTrigger pinned storyline with timeline scrub.
- **Micro-Interactions (Emil Kowalski Philosophy):**
  - Buttons: `active:scale-[0.98]` with `150ms ease-out` transition.
  - Cards: Hairline border illumination on hover (`border-white/[0.08]` $\rightarrow$ `border-white/[0.2]`).
  - Modal Backdrop: Blur `backdrop-blur-md` with `fade-in` 200ms.
- **Accessibility & Reduced Motion:**
  - CSS `@media (prefers-reduced-motion: reduce)` automatically disables scroll pinning and transitions to static grid layouts.

---

## 5. Viewport Breakpoint Matrix

- **Desktop Ultrawide / Large (1440px+):** 12-column Bento grids, split-screen interactive terminals.
- **Standard Desktop (1280px):** 12-column Bento grids, max content width 1200px.
- **Tablet Landscape (1024px):** 2-column stacked modules, collapsible sidebar.
- **Tablet Portrait (768px):** Single-column stacked cards, full-width telemetry viewers.
- **Mobile (390px):** Single-column fluid cards, sticky navigation bar, full-screen inspection drawers.
