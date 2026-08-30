# 📋 Next Gap Audit (`audit/NEXT-GAP-AUDIT.md`)

> **Audit Baseline**: Commit `58ab177`. Evaluated against the 22 Next-Gen requirements.

---

## 1. Capability Classification Matrix

| Subsystem / Capability | Status | Current Reality in Codebase | Action Plan for Next Phase |
| :--- | :--- | :--- | :--- |
| **TrueForge SDK & MCP Harness** | **A (Implemented & Proven)** | Real `@truefoundry/trueforge-sdk` client, streamable SSE MCP server with 5 tools. | Preserve existing working contracts. |
| **Daytona Sandbox Isolation** | **A (Implemented & Proven)** | Real `@daytona/sdk` workspace creation and execution with fail-closed timeout boundaries. | Maintain isolation layers. |
| **BRT / MRE Generator** | **A (Implemented & Proven)** | Generates deterministic reproduction scripts; pre-patch non-zero exit gate; post-patch exit 0 gate. | Upgrade with semantic oracles and negative tests. |
| **Anti-Gaming Sentinel** | **A (Implemented & Proven)** | SHA-256 baseline test snapshots; diff scanner detecting exception masking, `.skip`, and cheats. | Strengthen with trajectory-level repetition checks. |
| **Provider Abstraction** | **A (Implemented & Proven)** | Schema-validated manifests across 9 official TrueForge providers; fail-closed on invalid providers. | Verified and complete. |
| **Persistent Task Memory** | **C (Missing) ➔ BUILD NOW** | State currently stored only within local loop variables during a single turn. | **Implement `packages/core/src/memory/task-memory.ts`** with structured fact/attempt isolation. |
| **Autonomous Supervisor** | **C (Missing) ➔ BUILD NOW** | No watchdog currently monitors stagnation, oscillating patches, or repetitive failure loops. | **Implement `packages/core/src/supervisor/supervisor.ts`** with 3x repetition trigger and strategy reset. |
| **Unified Variation Operator** | **C (Missing) ➔ BUILD NOW** | Patches are unified diffs; no formal typed mutation operator (`insert`, `replace`, `delete`, `rollback`). | **Implement `packages/core/src/tools/variation-operator.ts`** with AST-aware line replacements. |
| **Runtime Probing & Log Injection** | **C (Missing) ➔ BUILD NOW** | Diagnostics rely on static logs; no reversible tracepoint / assertion injector exists. | **Implement `packages/core/src/probing/runtime-probe.ts`** with auto-cleanup of injected probes. |
| **Causal Provenance / Def-Use** | **B (Partially Implemented) ➔ UPGRADE** | Basic stack frame parser; lacks variable-level def-use dependency tracking. | **Implement `packages/core/src/causal/provenance.ts`** for dynamic backward slicing. |
| **Context Selector Engine** | **C (Missing) ➔ BUILD NOW** | Agent receives entire file contexts rather than selective call-chain slices. | **Implement `packages/core/src/agent/context-selector.ts`**. |
| **Cross-Language Interfaces** | **C (Missing) ➔ BUILD NOW** | TypeScript-specific types; lacks language-agnostic abstractions for Python/C++. | **Implement `packages/core/src/interfaces/language-adapter.ts`**. |
| **Concurrency Schedule Perturbation** | **C (Missing) ➔ BUILD NOW** | Race conditions tested by multiple sequential runs; no microsecond delay injection. | **Implement `packages/core/src/concurrency/schedule-perturbation.ts`**. |
| **DebugForge-Bench v0 Runner** | **C (Missing) ➔ BUILD NOW** | Benchmarks described in markdown; no automated runner (`npm run bench`). | **Implement `packages/core/src/bench/bench-runner.ts`** with 30 tasks. |
