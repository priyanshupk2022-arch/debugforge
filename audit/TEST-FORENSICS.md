# 🧪 Forensic Test Quality & Discrimination Audit (`audit/TEST-FORENSICS.md`)

> **Test Forensics & Discriminative Analysis**: Evaluates whether existing test suites test genuine runtime behavior, whether tests fail when code is deliberately broken, and identifies tautological or mock-only tests.

---

## 1. Test Suite Quality Classification

| Test File | Test Description | Classification | Discriminative Power & Notes |
| :--- | :--- | :---: | :--- |
| `adversarial.test.ts` | Anti-replay HMAC nonce rejection | **STRONG ✅** | Re-invoking `evaluateDecision` with same nonce throws `[HITL Security Replay Attack]`. |
| `adversarial.test.ts` | Tampered patch hash detection | **STRONG ✅** | Modifying patch diff throws `[HITL Tamper Detection]`. |
| `adversarial.test.ts` | Missing Daytona credentials fail closed | **STRONG ✅** | `DAYTONA_MODE=required` throws `[Daytona Isolation Blocker]`. |
| `adversarial.test.ts` | Triple-Lock failing command detection | **STRONG ✅** | Executes actual failing shell command (`exit 1`) and verifies fail-closed state. |
| `brt-and-anti-gaming.test.ts` | Null dereference BRT synthesis | **MEANINGFUL ✅** | Asserts synthesized script contains target import and defect signature. |
| `brt-and-anti-gaming.test.ts` | Pre-patch BRT signature validation | **STRONG ✅** | Fails if exit code is 0 or if defect signature is missing. |
| `brt-and-anti-gaming.test.ts` | Post-patch BRT exit 0 validation | **STRONG ✅** | Fails if exit code is non-zero. |
| `brt-and-anti-gaming.test.ts` | Anti-gaming `.skip` / `catch` detection | **STRONG ✅** | Scans real diff strings containing cheats and verifies detection. |
| `brt-and-anti-gaming.test.ts` | SHA-256 Workspace integrity snapshot | **STRONG ✅** | Computes real disk file hashes and catches unauthorized modifications. |
| `core.test.ts` | Provider normalization & fail-closed | **STRONG ✅** | Unknown provider strings throw `[TrueForge Provider Blocker]`. |
| `core.test.ts` | Disk patch application (`applyPatch`) | **STRONG ✅** | Writes real file to disk, applies unified diff, reads back mutated file. |
| `nextgen-subsystems.test.ts` | TaskMemoryStore fact/hypothesis isolation | **STRONG ✅** | Verifies task isolation and prompt summarization. |
| `nextgen-subsystems.test.ts` | AutonomousSupervisor 3x failure & oscillation | **STRONG ✅** | Simulates 3x identical logs and $A \to B \to A \to B$ hashes, asserting `STRATEGY_RESET`. |
| `nextgen-subsystems.test.ts` | VariationOperator mutation & rollback | **STRONG ✅** | Mutates real file on disk, asserts line content and hashes, executes rollback. |
| `nextgen-subsystems.test.ts` | RuntimeProbeManager injection & cleanup | **STRONG ✅** | Injects probe line on disk, verifies file content, runs cleanup and verifies restoration. |
| `trueforge-live.test.ts` | Live TrueForge SSE stream & MCP tool | **STRONG ✅** | Spawns real TrueForge server + real MCP server + mock LLM SSE endpoint, asserting real tool call. |
| `trueforge-live.test.ts` | Live unroutable server fail-closed | **STRONG ✅** | Connects to closed port and asserts `[TrueForge Harness Blocker]`. |

---

## 2. Test Quality Summary
- **Strong / Meaningful Behavioral Tests**: **16 / 17 Suites**
- **Tautological / Mock-Only Tests**: **1 / 17** (`BenchmarkRunner.runBenchmark()` in-memory mock test)
