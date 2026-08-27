# UI/UX Specification Document
## Project Name: ZeroShield
### Autonomous Cyber Red-Team & Exploit Immunizer Engine
**Document Version:** 1.0.0  
**Design Philosophy:** Clean, Hacker-Grade Minimalist, Accessible (No Clutter)  
**Date:** 2026-08-27  

---

## 1. Design Principles
1. **High Signal-to-Noise Ratio:** Zero unnecessary visual noise; every element represents an actionable security metric or state transition.
2. **Deterministic Evidence Visualization:** Clear before/after contrasts showing the exact exploit response versus the immunized blocked response.
3. **Frictionless HITL Decision Making:** 1-click review and approval flows with readable unified diffs.
4. **Accessible Hacker Aesthetics:** High-contrast dark mode with crisp typography (JetBrains Mono / Inter), clean status badges (Emerald Green, Crimson Red, Amber Yellow, Slate Grey).

---

## 2. User Journey & Navigation Flow

```
[Start Scan] ──► [Live Radar & AST Hunter] ──► [Daytona Exploit Arena (Red)]
                                                           │
                                                           ▼
[Qodo PR Verified] ◄── [HITL Approval Modal] ◄── [Dual-Pass Immunization (Blue)]
```

---

## 3. Interface Surfaces

### 3.1 Interactive Hacker-Grade CLI TUI (`packages/cli`)
The CLI provides developer-first terminal execution with animated spinners, live log streaming, and formatted diffs:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🛡️  ZEROSHIELD v1.0.0 — Autonomous Red-Team & Exploit Immunizer        │
│ Target: https://github.com/org/vulnerable-payment-api                  │
├────────────────────────────────────────────────────────────────────────┤
│ [1/4] 🔍 AST SINK SCAN                                                 │
│       ├─ Scanned: 34 files in 420ms                                    │
│       └─ 🚨 CRITICAL SINK FOUND: CWE-78 (OS Command Injection)         │
│          Location: src/routes/invoice.ts:38 (child_process.exec)       │
│                                                                        │
│ [2/4] 🔴 RED AGENT EXPLOIT ARENA (Daytona Sandbox)                     │
│       ├─ Provisioning ephemeral sandbox container... [DONE in 6.2s]   │
│       ├─ Launching target server on localhost:48291... [ONLINE]        │
│       ├─ Firing payload: POST /api/invoice { id: "1; cat /etc/passwd" }│
│       └─ 💥 EXPLOIT CONFIRMED! (Status 200 OK)                         │
│          Proof: "root:x:0:0:root:/root:/bin/bash..."                   │
│                                                                        │
│ [3/4] 🔵 BLUE AGENT IMMUNIZATION (NVIDIA AVO Loop)                     │
│       ├─ Synthesized AST Patch (Swapped to execFile + Zod validation)  │
│       ├─ Re-firing Red Agent Exploit: 🛡️ BLOCKED (HTTP 400 Bad Request)│
│       └─ Running repository test suite: ✅ 24/24 PASSED (Exit Code 0)  │
│                                                                        │
│ [4/4] 🛑 CRYPTOGRAPHIC HITL GATEWAY                                    │
│       ├─ CVSS Threat Level: 9.8 [CRITICAL] ──► 0.0 [CLEAN IMMUNIZED]   │
│       └─ Unified Patch Diff: +12 lines / -4 lines                      │
│                                                                        │
│ ? Authorize security patch & dispatch Qodo-reviewed PR? (Y/n) [Y]      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Web Security Command Center (`packages/web`)
A modern, responsive React dashboard built with `@truefoundry/trueforge-ui` and Tailwind CSS:

#### Key Dashboard Screens:
1. **Security Radar & Repo Selector:**
   - Input for GitHub Repository URL or Local Directory path.
   - Pre-configured demo target switcher: `Vulnerable Payment API (Command Injection)`, `User Auth Service (JWT Flaw)`, `Config Merging Microservice (Prototype Pollution)`.
2. **Live Red/Blue Split Terminal:**
   - **Left Panel (Red Agent):** Shows raw HTTP request/response headers, active exploit payload string, and exfiltrated proof evidence with red border highlight.
   - **Right Panel (Blue Agent):** Shows live Daytona sandbox compile logs, applied AST patch diff, and unit test pass confirmation with green border highlight.
3. **CVSS Threat Gauge & Risk Differential:**
   - Animated SVG radial gauge showing the baseline risk dropping from **9.8 Critical (Red)** to **0.0 Clean (Green)**.
4. **HITL Review Modal & Qodo PR Action:**
   - Full-width side-by-side AST diff viewer with line-by-line syntax highlighting.
   - Prominent **"Approve & Create Qodo PR"** action button.
   - Displays live GitHub PR link and automated Qodo Code Quality Badge upon merge.

---

## 4. Design System Tokens

| Token | Value | Purpose |
|---|---|---|
| `--color-bg-primary` | `#0B0F17` (Deep Obsidian) | Main application canvas |
| `--color-bg-card` | `#111827` (Dark Slate) | Surface panels and terminals |
| `--color-accent-red` | `#EF4444` (Crimson) | Red Agent exploit alerts & critical CVEs |
| `--color-accent-green` | `#10B981` (Emerald) | Blue Agent verified patches & test passes |
| `--color-accent-blue` | `#3B82F6` (Electric Blue) | Daytona sandbox status & AVO loop steps |
| `--font-mono` | `JetBrains Mono, Fira Code, monospace` | AST diffs, terminal outputs, payload traces |
| `--font-sans` | `Inter, -apple-system, sans-serif` | Headings, metrics, buttons, body text |
