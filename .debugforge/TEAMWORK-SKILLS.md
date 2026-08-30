# 🧰 Antigravity Teamwork Skills Discovery (`.debugforge/TEAMWORK-SKILLS.md`)

This document records all workspace and global Antigravity skills discovered, why each was selected, and where each was applied during the DebugForge Next-Gen autonomous debugging harness campaign.

---

## 1. Discovered Relevant Skills

| Skill Name | Path | Purpose / Selection Rationale | Application in DebugForge |
| :--- | :--- | :--- | :--- |
| **`using-superpowers`** | `C:\Users\priya\.gemini\config\skills\using-superpowers\SKILL.md` | Core process enforcement: invoke relevant skills before action, prevent rationalization. | Operating model coordination for all subagents. |
| **`test-driven-development`** | `C:\Users\priya\.gemini\config\skills\test-driven-development\SKILL.md` | Enforce test-first implementation for BRT, task memory, and supervisor modules. | Unit tests written alongside implementation for all 6 new core subsystems. |
| **`security-and-hardening`** | `C:\Users\priya\.gemini\config\plugins\agent-skills\skills\security-and-hardening\SKILL.md` | Defense-in-depth against prompt injection, shell injection, path traversal, and anti-gaming attacks. | Hardening `anti-gaming.ts`, `auto-patch.ts`, and `approval.ts`. |
| **`systematic-debugging`** | `C:\Users\priya\.gemini\config\skills\systematic-debugging\SKILL.md` | Scientific root cause analysis: isolate crash site vs proximate cause vs infection origin. | Causal provenance engine and dynamic backward dependency tracing. |
| **`code-review-and-quality`** | `C:\Users\priya\.gemini\config\plugins\agent-skills\skills\code-review-and-quality\SKILL.md` | Multi-axis evaluation (correctness, architecture, security, readability, performance). | Independent Critic & Challenger review in `audit/`. |
| **`cli-developer`** | `C:\Users\priya\.gemini\config\skills\cli-developer\SKILL.md` | Clean terminal UI, progress indicators, status bars, and argument parsing. | CLI commands (`diagnose`, `watch`, `agent`, `bench`). |
| **`verification-before-completion`** | `C:\Users\priya\.gemini\config\skills\verification-before-completion\SKILL.md` | Evidence-before-assertions: verify actual command exits, no green-washing. | Execution of `npm run build:all`, `npm test`, `npm run test:live`, and `npm run bench`. |
| **`git-workflow-and-versioning`** | `C:\Users\priya\.gemini\config\plugins\agent-skills\skills\git-workflow-and-versioning\SKILL.md` | Strict commit hygiene, clean branch management, and PR audit trails. | Feature commits and Qodo review integration. |

---

## 2. Skill Execution Policy
- No skill is used purely for cosmetic adherence.
- Every skill dictates strict verifiable contracts (e.g., tests fail closed, nonces expire, diffs are hashed, benchmarks report real timings).
