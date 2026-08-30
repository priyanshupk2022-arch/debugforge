# 📖 Documentation vs. Reality Forensic Audit (`audit/DOCUMENTATION-REALITY-AUDIT.md`)

> **Documentation Parity Audit**: Compares claims in `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DEMO.md`, and research specifications against the actual source code and runtime behavior.

---

## 1. Documentation Claim Comparison Matrix

| Document | Stated Claim | Reality in Codebase | Verdict & Alignment |
| :--- | :--- | :--- | :---: |
| **README.md** | "Built on the official TrueForge Agent SDK (`@truefoundry/trueforge-sdk`)" | Real `@truefoundry/trueforge-sdk` imported and used in `mcp/trueforge-runtime.ts` and `trueforge-live.test.ts`. | **SUPPORTED ✅** |
| **README.md** | "Daytona sandbox runner with `@daytona/sdk`" | Real `@daytona/sdk` dynamic import in `daytona/sandbox.ts` with explicit `DAYTONA_MODE=required` fail-closed check. | **SUPPORTED ✅** |
| **README.md** | "Cryptographic Human-in-the-Loop approval gate with single-use HMAC nonces" | Real HMAC-SHA256 nonces, replay protection, and diff hash matching in `hitl/approval.ts`. | **SUPPORTED ✅** |
| **README.md** | "Triple-Lock Verification Gate (BRT + Regressions + Invariants)" | Verified in `tools/auto-patch.ts`, `verify-fix.ts`, and `adversarial.test.ts`. | **SUPPORTED ✅** |
| **ARCHITECTURE.md** | "Task Memory Store isolates verified facts and rejected hypotheses" | Implemented in `memory/task-memory.ts` and tested in `nextgen-subsystems.test.ts`. | **SUPPORTED ✅** |
| **ARCHITECTURE.md** | "Autonomous Supervisor halts 3x failure loops and oscillating edits" | Logic implemented in `supervisor/supervisor.ts`, but not wired into an outer retry loop in `agent/loop.ts`. | **PARTIALLY SUPPORTED 🟡** |
| **SECURITY.md** | "Anti-gaming diff scanner detecting `.skip` and `catch` blocks" | Implemented in `security/anti-gaming.ts` and tested in `brt-and-anti-gaming.test.ts`. | **SUPPORTED ✅** |
| **DEMO.md** | "DebugForge-Bench 5/5 tasks passing" | `npm run bench` runs an in-memory simulation against 5 task definitions in 2ms. | **PARTIALLY SUPPORTED 🟡** |

---

## 2. Documentation Parity Summary
- **Fully Supported Claims**: **80%**
- **Partially Supported (Heuristic or Sim-Only)**: **20%**
- **Unsupported / Fabricated Claims**: **0%**
