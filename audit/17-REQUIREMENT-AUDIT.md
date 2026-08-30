# 📑 Forensic Audit: 17 BUILD-NOW Requirements (`audit/17-REQUIREMENT-AUDIT.md`)

> **Immutable Forensic Ledger**: Rigorous line-by-line inspection of each of the 17 BUILD NOW capabilities against source authenticity, callers, and behavioral execution.

---

## 1. Requirement-by-Requirement Forensic Ledger

### REQ-01: Task Evidence & Memory Store
- **File**: [`packages/core/src/memory/task-memory.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/memory/task-memory.ts)
- **Exported Symbols**: `TaskMemoryStore`, `taskMemory`, `TaskMemoryEntry`
- **Internal Logic**: In-memory `Map<string, TaskMemoryEntry>` storing verified facts, rejected hypotheses, attempt history with verification results, and prompt summarization.
- **Callers**: `ContextSelector`, `AutonomousSupervisor`, `BenchmarkRunner`.
- **Verdict**: **REAL & VERIFIED (Score: 9/10)**. Real task isolation and context summarization. (Limitation: In-memory only; does not persist across process restarts).

---

### REQ-02: Autonomous Supervisor
- **File**: [`packages/core/src/supervisor/supervisor.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/supervisor/supervisor.ts)
- **Exported Symbols**: `AutonomousSupervisor`, `autonomousSupervisor`, `TrajectoryAnomaly`
- **Internal Logic**: Inspects `TaskMemoryEntry.attemptHistory` for 3x consecutive identical failure logs, 4-step $A \to B \to A \to B$ patch oscillation, and max total attempt limits.
- **Callers**: Fully tested in `nextgen-subsystems.test.ts`.
- **Verdict**: **REAL BUT PARTIALLY INTEGRATED (Score: 7.5/10)**. Logic is real and functional, but `packages/core/src/agent/loop.ts` runs a single-pass ReAct flow and does not currently call `supervisor.evaluateTrajectory()` inside an outer multi-attempt retry loop.

---

### REQ-03: Checkpoint & Rollback Graph
- **File**: [`packages/core/src/tools/variation-operator.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/variation-operator.ts)
- **Exported Symbols**: `VariationOperator`, `variationOperator`, `CodeMutation`
- **Internal Logic**: Line mutation recording `beforeHash`, `afterHash`, `originalContent`, and `rollbackMutation` restoring original content to disk.
- **Callers**: Tested in `nextgen-subsystems.test.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 8/10)**. Real disk file restoration and hash tracking.

---

### REQ-04: Dual-Gated BRT Engine
- **File**: [`packages/core/src/tools/reproduce-test.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/reproduce-test.ts)
- **Exported Symbols**: `generateReproductionCandidate`, `validateBRTPrePatch`, `validateBRTPostPatch`
- **Internal Logic**: Synthesizes standalone node test scripts importing the crash module. `validateBRTPrePatch` enforces non-zero exit code + signature match. `validateBRTPostPatch` enforces exit code 0.
- **Callers**: Tested in `brt-and-anti-gaming.test.ts` and `bench-runner.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 8.5/10)**. Real test synthesis and dual-gate validation.

---

### REQ-05: Oracle Confidence States
- **File**: [`packages/core/src/tools/reproduce-test.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/reproduce-test.ts) & `security/anti-gaming.ts`
- **Internal Logic**: Oracle states are inferred from BRT signature matching and exit codes.
- **Verdict**: **PARTIAL / HEURISTIC (Score: 6/10)**. Heuristic oracle status; formal mathematical $D_{\text{KL}}$ divergence sampling between dual prompt interpretations is designed in research docs, but runtime uses exit-code and signature heuristics.

---

### REQ-06: Causal Provenance Engine
- **File**: [`packages/core/src/causal/provenance.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/causal/provenance.ts)
- **Exported Symbols**: `CausalProvenanceEngine`, `causalProvenanceEngine`, `CausalProvenanceGraph`
- **Internal Logic**: Parses `stackFrames`, filters out `node_modules` and `node:`, picks deepest app frame as `INFECTION_ORIGIN`, top frame as `CRASH_SITE`.
- **Callers**: Tested in `nextgen-subsystems.test.ts` and `bench-runner.ts`. Note: `trace-analyze.ts` contains hardcoded fixture heuristics if matching specific strings like `null-propagation`.
- **Verdict**: **REAL BUT HEURISTIC (Score: 7/10)**. Dynamic stack-frame provenance exists, but `trace-analyze.ts` has legacy fixture branches.

---

### REQ-07: Structured Runtime Probes
- **File**: [`packages/core/src/probing/runtime-probe.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/probing/runtime-probe.ts)
- **Exported Symbols**: `RuntimeProbeManager`, `runtimeProbeManager`, `RuntimeProbe`
- **Internal Logic**: Injects `console.error` observation lines (`log_variable`, `state_snapshot`, `timing_checkpoint`, `invariant_assert`) into target files on disk; tracks active probes and reverts files on removal.
- **Callers**: Tested in `nextgen-subsystems.test.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 8.5/10)**. Real file modification and cleanup.

---

### REQ-08: Unified Variation Operator
- **File**: [`packages/core/src/tools/variation-operator.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/variation-operator.ts)
- **Exported Symbols**: `VariationOperator`, `variationOperator`
- **Internal Logic**: Line-bounded code splicing on disk with SHA-256 before/after hash generation and rollback state tracking.
- **Callers**: Tested in `nextgen-subsystems.test.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 8.5/10)**. Real line-bounded mutation and hash computation.

---

### REQ-09: Patch Blast Radius
- **File**: [`packages/core/src/tools/variation-operator.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/variation-operator.ts)
- **Internal Logic**: Scopes modified line ranges and target file boundaries.
- **Verdict**: **PARTIAL (Score: 6/10)**. Scopes file and line ranges; full AST transitive call-graph dependency analysis (TDAD) is not present as a separate full compiler daemon.

---

### REQ-10: Anti-Gaming Sentinel
- **File**: [`packages/core/src/security/anti-gaming.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/security/anti-gaming.ts)
- **Exported Symbols**: `captureWorkspaceIntegritySnapshot`, `scanForGamingAntiPatterns`, `verifyWorkspaceIntegrity`
- **Internal Logic**: Real recursive file walking in `test/`, `spec/`, `fixtures/`, SHA-256 snapshot capture, regex detection for `.skip`, `try/catch` exception masking, and unauthorized file modification rejection.
- **Callers**: Tested in `brt-and-anti-gaming.test.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 9/10)**. High efficacy against test skipping and cheating patterns.

---

### REQ-11: Local Mutation Verification
- **File**: [`packages/core/src/bench/bench-runner.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/bench/bench-runner.ts)
- **Internal Logic**: Injects synthetic variations in benchmark tasks.
- **Verdict**: **PARTIAL / SIMULATED IN BENCHMARK (Score: 5.5/10)**. Evaluated in benchmark tasks, but full mutation generation is not invoked automatically on every auto-patch turn by default to conserve tokens.

---

### REQ-12: Independent Triple-Lock
- **File**: [`packages/core/src/tools/auto-patch.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/auto-patch.ts) & `verify-fix.ts`
- **Exported Symbols**: `verifyFix`, `autoPatch`
- **Internal Logic**: Executes original error reproduction check, test suite execution in sandbox, and anti-gaming validation.
- **Callers**: Used in `agent/loop.ts` and tested in `core.test.ts` & `adversarial.test.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 8/10)**. Real triple verification gates.

---

### REQ-13: Context Engineering Selector
- **File**: [`packages/core/src/agent/context-selector.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/agent/context-selector.ts)
- **Exported Symbols**: `ContextSelector`, `contextSelector`
- **Internal Logic**: Reads target files, extracts $[-\text{radius}, +\text{radius}]$ window around target lines, retrieves task facts/rejected hypotheses, and returns estimated token payload.
- **Callers**: Tested in `nextgen-subsystems.test.ts`.
- **Verdict**: **REAL (Score: 8/10)**. Real file window slicing and token estimation.

---

### REQ-14: Concurrency Perturbation
- **File**: [`packages/core/src/concurrency/schedule-perturbation.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/concurrency/schedule-perturbation.ts)
- **Exported Symbols**: `ConcurrencyPerturbationEngine`, `concurrencyPerturbationEngine`
- **Internal Logic**: Generates dynamic async jitter wrapper code (`setTimeout(resolve, jitter)`) and `executePerturbedStress` loop to evaluate flakiness.
- **Callers**: Tested in `nextgen-subsystems.test.ts`.
- **Verdict**: **REAL (Score: 7.5/10)**. Real code generation and repeated execution stress loop.

---

### REQ-15: Provider-Agnostic Router
- **File**: [`packages/core/src/agent/provider.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/agent/provider.ts) & `router.ts`
- **Exported Symbols**: `resolveModelProviderConfig`, `normalizeProviderName`, `buildTrueForgeProviderManifest`, `routeModel`
- **Internal Logic**: Normalizes 9 provider types, alias mapping (`claude` -> `anthropic`, `gemini` -> `google-gemini`), fail-closed validation for unknown providers, and TrueForge provider manifest generator.
- **Callers**: Tested in `core.test.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 9/10)**. Comprehensive, fail-closed provider abstraction.

---

### REQ-16: Cryptographic HITL Gate
- **File**: [`packages/core/src/hitl/approval.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/hitl/approval.ts)
- **Exported Symbols**: `HITLGatekeeper`, `hitlGatekeeper`
- **Internal Logic**: Real HMAC-SHA256 signature generation, patch diff hashing, expiration timeouts, and anti-replay protection.
- **Callers**: Used in `agent/loop.ts`, `cli/index.ts`, and tested in `adversarial.test.ts` & `trueforge-live.test.ts`.
- **Verdict**: **REAL & VERIFIED (Score: 9.5/10)**. Robust security and replay prevention.

---

### REQ-17: DebugForge-Bench v0 Runner
- **File**: [`packages/core/src/bench/bench-runner.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/bench/bench-runner.ts)
- **Exported Symbols**: `BenchmarkRunner`, `benchmarkRunner`
- **Internal Logic**: Evaluates BRT candidate synthesis and provenance against 5 task definitions.
- **Callers**: `npm run bench`.
- **Verdict**: **PARTIAL / IN-MEMORY SIMULATION (Score: 6.5/10)**. Real contract tester, but evaluates tasks in-memory in 2ms via simulated stderr logs rather than launching real Docker/Daytona workspaces per task.
