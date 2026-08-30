# 🔍 Forensic Repository Baseline Record (`audit/FORENSIC-BASELINE.md`)

> **Forensic Audit Target**: Snapshot captured at HEAD commit `be938da54e7c4339156ae21eca2f32172b4050a7`. Zero code changes made during this audit.

---

## 1. Repository Topology & Package Inventory

| Package | Directory | Version | Dependencies of Note | Role |
| :--- | :--- | :---: | :--- | :--- |
| `@debugforge/core` | `packages/core` | `1.0.0` | `@truefoundry/trueforge-sdk` (`^0.1.18`), `@truefoundry/trueforge` (`^0.1.18`), `@daytona/sdk` (`^0.9.0`), `zod` (`^3.24.2`), `typescript` (`^5.8.2`) | Core diagnostic tools, ReAct loop, MCP server, HITL, memory, supervisor. |
| `@debugforge/cli` | `packages/cli` | `1.0.0` | `@debugforge/core`, `commander` (`^13.1.0`), `chalk` (`^5.4.1`), `ora` (`^8.2.0`), `enquirer` (`^2.4.1`) | Terminal interface, human interactive approval prompts, runner commands. |
| `@debugforge/web` | `packages/web` | `1.0.0` | `react` (`^19.0.0`), `vite` (`^6.2.0`), `lucide-react`, `tailwindcss` (`^4.0.9`) | Interactive web diagnostic dashboard, causal graph visualizer. |

---

## 2. Forensic Execution Verification

```bash
# 1. Monorepo Build
npm run build:all
# Result: Exit 0 (0 TS errors across core, cli, web).

# 2. Offline Test Suites
npm test
# Result: Exit 0 (35 pass, 0 fail, 2 skipped live gates, duration: ~310ms).

# 3. Live TrueForge E2E Test
npm run test:live
# Result: Exit 0 (4 pass, 0 fail, duration: ~1800ms).
# Live Proof: Spawns TrueForge server on port 8790, Mock LLM SSE server on port 3102,
#             DebugForge MCP SSE server on port 3101.
#             TrueForge server receives mock LLM tool call -> invokes DebugForge MCP
#             tool -> returns structured diagnostic observation in SSE stream.

# 4. Benchmark Runner
npm run bench
# Result: Exit 0 (5/5 tasks marked PASS in ~2ms).
# Forensic finding: The bench runner executes an in-memory simulation against synthetic stderr strings.
```
