# 🔍 DebugForge Architecture Gap Audit (`audit/ARCHITECTURE-GAP-AUDIT.md`)

> **Auditor Principle**: Never trust filenames, docstrings, or claims of completion. Trace actual execution flows across the codebase.

---

## 1. Subsystem Classification Matrix

| Subsystem | Audit Status | Code Path Inspected | Actual Runtime Reality & Gaps |
| :--- | :--- | :--- | :--- |
| **TrueForge SDK & Server Harness** | **PASS ✅** | `packages/core/src/mcp/trueforge-runtime.ts` | Real `@truefoundry/trueforge-sdk` client; creates server sessions, provisions agents, streams turns via SSE, registers MCP servers. Fail-closed on missing config in required mode. |
| **Model Context Protocol (MCP)** | **PASS ✅** | `packages/core/src/mcp/server.ts`, `http-server.ts` | Streamable HTTP/SSE MCP server with 5 registered diagnostics tools (`debugforge_ingest_error`, `debugforge_reproduce_in_sandbox`, etc.) validated with Zod schemas. |
| **Daytona Sandbox Isolation** | **PASS ✅** | `packages/core/src/daytona/sandbox.ts` | Genuine `@daytona/sdk` workspace creation and execution; fail-closed enforcement when `DAYTONA_MODE=required`. Local fallback clearly marked. |
| **Provider Abstraction** | **PASS ✅** | `packages/core/src/agent/provider.ts` | Schema-validated manifests across all 9 official TrueForge providers (OpenAI, Anthropic, Google Gemini, DeepSeek/Custom, Together, Fireworks, Alibaba, Moonshot, Zai). Fail-closed on invalid providers. |
| **Bug Reproduction Test (BRT)** | **PASS ✅** | `packages/core/src/tools/reproduce-test.ts` | Synthesizes deterministic reproduction scripts; pre-patch gate requires exit != 0 with bug signature match; post-patch gate requires exit == 0. |
| **Anti-Gaming Sentinel** | **PASS ✅** | `packages/core/src/security/anti-gaming.ts` | Captures SHA-256 baseline trees for protected files; scans diffs for exception swallowing, test skipping, assertion weakening, and hardcoded cheats. |
| **Triple-Lock Verification** | **PASS ✅** | `packages/core/src/tools/verify-fix.ts` | Evaluates Lock 1 (BRT fix), Lock 2 (regression tests), and Lock 3 (concurrency/stress load invariants). |
| **Human-in-the-Loop (HITL)** | **PASS ✅** | `packages/core/src/hitl/approval.ts`, `diagnose.ts` | Nonce-backed HMAC-SHA256 signature verification; anti-replay protection; patch hash tamper protection; actual disk write via `applyPatch()` on approval. |
| **Dynamic AST Slicing (PDG)** | **PARTIAL ⚠️** | `packages/core/src/tools/trace-analyze.ts` | Uses stack frame demangling and heuristic causal step sequencing rather than full compiler-level interprocedural AST program dependence graphs. |
| **Mutation Testing Oracle** | **MISSING ❌** | N/A | Automated mutant injection (Stryker-style AST mutation) is not yet integrated into the Triple-Lock pipeline. |
| **CI / Qodo Review Trail** | **PASS ✅** | `.github/workflows/ci.yml`, `README.md` | Public PR review trail on PR #2 via Qodo PR-Agent; clean lint/test/live CI workflow. |

---

## 2. Structural Gaps & Technical Debt Summary

1. **RCA Engine**: Causal tracing currently uses stack frame analysis and heuristics. To reach institutional grade (Tier 3), it will need a lightweight AST data-flow tracker.
2. **Mutation Testing**: Current verification checks regression suites and load invariants, but does not yet mutate patched code to measure mutation kill score.
3. **Execution Safety**: All core security boundaries (nonce anti-replay, sandbox timeouts, fail-closed provider keys) are verified by automated adversarial tests (`adversarial.test.ts`).
