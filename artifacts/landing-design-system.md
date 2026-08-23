# SENTINEL-CHAIN: 2026 Premium SaaS Design System & Token Architecture

**Specification Version:** 2.0.0  
**Design Persona:** Palantir Foundry / High-End Cyber Defense Aesthetic  
**Aesthetic Family:** Matte Obsidian Void, Precision Telemetry, Restrained Micro-Motion  

---

## 1. Color Token Hierarchy

| Token Name | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--bg-void` | `#07090E` | Root canvas / ultra-deep background |
| `--bg-surface-1` | `#0D1117` | Primary content panels & bento containers |
| `--bg-surface-2` | `#161B22` | Secondary cards, telemetry modules, and drawers |
| `--bg-surface-elevated`| `#21262D` | Hover states, modals, popovers |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Hairline container outlines |
| `--border-focus` | `rgba(99, 102, 241, 0.40)` | Active selection and hover highlight |
| `--text-primary` | `#F0F6FC` | Headings, hero display, key identifiers |
| `--text-secondary` | `#8B949E` | Subheadings, metadata, descriptions |
| `--text-muted` | `#484F58` | Disabled states, timestamps, grid coordinates |
| `--signal-emerald` | `#10B981` | Healthy status, verified patch, 100% extraction |
| `--signal-rose` | `#F43F5E` | P0 Critical exposure alert, active exploit PoC |
| `--signal-amber` | `#F59E0B` | Scraper broken, mutation detected, self-healing |
| `--signal-indigo` | `#6366F1` | Bright Data collector, correlation engine, primary CTA |

---

## 2. Typography Hierarchy

- **Display Font:** Inter / System Display Sans (Weight: 800, Tracking: `-0.04em`, Leading: `1.05`)
- **Body Font:** Inter / SF Pro Text (Weight: 400/500, Tracking: `-0.01em`, Line Height: `1.6`)
- **Monospace Font:** JetBrains Mono / SF Mono / Consolas (Weight: 500/700, Letter Spacing: `0.02em`)

### Type Scale:
- `Hero Display`: `clamp(2.5rem, 5vw, 4.5rem)`
- `Section Heading`: `clamp(1.75rem, 3.5vw, 2.75rem)`
- `Subheading / Feature Title`: `1.25rem` (20px)
- `Body Text`: `0.9375rem` (15px)
- `Badge / Metadata`: `0.6875rem` (11px)

---

## 3. Elevation & Surface Tokens

- **Border Radius:**
  - Containers / Bento Modules: `24px` (`rounded-3xl`)
  - Sub-cards / Buttons: `12px` (`rounded-xl`)
  - Badges / Status Pills: `9999px` (`rounded-full`)
- **Shadows:**
  - Void Glow: `0 20px 40px -15px rgba(0, 0, 0, 0.7)`
  - Active Signal: `0 0 20px -3px rgba(99, 102, 241, 0.25)`
  - Emergency Alert: `0 0 25px -4px rgba(244, 63, 94, 0.30)`

---

## 4. GSAP Motion & Interaction Specs

- **Choreography:** GSAP ScrollTrigger timelines with `scrub: 1` and explicit `pin: true` stages.
- **Section Transition:** Eased fade-and-slide (`y: 30` $\rightarrow$ `0`, `opacity: 0` $\rightarrow$ `1`, `duration: 0.8s`, `ease: "power3.out"`).
- **Reduced Motion:** Automatic fallback to static display when `prefers-reduced-motion: reduce` is active.

---

## 5. Component Hierarchy

1. **Top Global Header:** Sticky frosted glass header with navigation (`Product`, `How It Works`, `Security`, `Architecture`, `Live Cockpit`, `GitHub`) and `Launch System` CTA.
2. **Hero Stage:** Dual-column display with high-density tagline and live interactive Mission Control telemetry viewport.
3. **The 6-Step Pinned Storyline:** Seamless ScrollTrigger sequence detailing the intelligence breakdown and recovery.
4. **Interactive Cockpit Switcher:** Seamless tab toggling between the editorial marketing story and the live product app.
