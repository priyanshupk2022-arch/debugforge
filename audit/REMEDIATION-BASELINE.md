# 🛠️ Remediation Baseline & Gap Reproduction Record (`audit/REMEDIATION-BASELINE.md`)

> **Baseline Snapshot**: Commit `fa01f4e` on branch `remediation/forensic-17-verified`.
> **Scope**: Detailed reproduction of the 6 identified gaps from the forensic audit before implementing fixes.

---

## 1. Reproduction of the 6 Findings

### Finding 1: REQ-02 — Autonomous Supervisor Integration Gap
- **Current Behavior**: `AutonomousSupervisor` has detection logic in `supervisor.ts`, but `runDebugAgent` in `packages/core/src/agent/loop.ts` executes a single-pass sequence without an outer retry/trajectory loop.
- **Root Source**: [`packages/core/src/agent/loop.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/agent/loop.ts#L18-L228)
- **Why Insufficient**: If a patch fails verification, the loop terminates immediately with `success: false` rather than consulting `supervisor.evaluateTrajectory()` to rollback, invalidate the hypothesis, and attempt an alternative patch.
- **Acceptance Criteria**:
  1. `runDebugAgent` supports a multi-attempt trajectory loop (up to `maxAttempts`).
  2. Each failed verification calls `supervisor.evaluateTrajectory()`.
  3. Detects repeated failures, oscillating patch hashes, and stagnation.
  4. Applies rollback via `variationOperator.rollbackMutation` and resets hypotheses in `taskMemory`.

---

### Finding 2: REQ-05 — Oracle Confidence States
- **Current Behavior**: Oracle status in `reproduce-test.ts` is mostly a boolean flag or heuristic string.
- **Root Source**: [`packages/core/src/tools/reproduce-test.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/reproduce-test.ts#L30-L43)
- **Why Insufficient**: Lacks explicit `PROVEN`, `INFERRED`, `AMBIGUOUS` confidence states. When an oracle is ambiguous (e.g. conflicting specifications or flaky exit codes), the system should block auto-approval and force HITL escalation.
- **Acceptance Criteria**:
  1. Define `OracleConfidenceState = "PROVEN" | "INFERRED" | "AMBIGUOUS"`.
  2. Evaluate state based on contract determinism, assertion specificity, and observation consistency.
  3. If `AMBIGUOUS`, fail closed and require human operator resolution.

---

### Finding 3: REQ-06 — RCA / Causal Provenance Hardcoding
- **Current Behavior**: [`packages/core/src/tools/trace-analyze.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/trace-analyze.ts#L22-L125) contains hardcoded fixture string checks (`if (projectPath.includes("null-propagation") ...)`).
- **Why Insufficient**: A new/unseen bug fixture will hit fallback heuristics rather than deriving causal steps dynamically from the ingested stack trace and AST/source code.
- **Acceptance Criteria**:
  1. Remove all fixture-specific string checks from `trace-analyze.ts`.
  2. Dynamically analyze source files at stack frames using `causalProvenanceEngine`.
  3. Extract proximate caller symbols, culprit functions, and synthesize causal chains directly from runtime evidence.

---

### Finding 4: REQ-09 — Dependency-Aware Patch Blast Radius
- **Current Behavior**: `VariationOperator` only records modified line numbers without checking transitive dependents, callers, or affected tests.
- **Root Source**: [`packages/core/src/tools/variation-operator.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/variation-operator.ts)
- **Why Insufficient**: Modifying a shared library or public function does not trigger automatic widening of test verification.
- **Acceptance Criteria**:
  1. Implement `BlastRadiusAnalyzer` in `packages/core/src/tools/blast-radius.ts`.
  2. Parse imports, exports, and call references in the project directory to identify direct callers and dependent test files.
  3. Return structured `BlastRadiusResult` (direct symbols, affected files, affected tests, recommended verification scope).

---

### Finding 5: REQ-11 — Local Targeted Mutation Verification
- **Current Behavior**: Mutation verification is not executed as a verification gate for candidate patches.
- **Root Source**: [`packages/core/src/tools/verify-fix.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/verify-fix.ts)
- **Why Insufficient**: A patch could pass tests trivially (e.g. returning a hardcoded value) without being sensitive to logical variations.
- **Acceptance Criteria**:
  1. Implement `TargetedMutationVerifier` in `packages/core/src/tools/mutation-verifier.ts`.
  2. Generate small targeted mutations (e.g. condition inversion, return value mutation) on the patched lines.
  3. Run verification on mutants and calculate killed/survived mutant ratio (Mutation Score).
  4. If mutants survive, flag verification weakness.

---

### Finding 6: REQ-17 — DebugForge-Bench Real Execution
- **Current Behavior**: `BenchmarkRunner` runs a synthetic in-memory simulation in 2ms without running actual shell commands or test runners in workspaces.
- **Root Source**: [`packages/core/src/bench/bench-runner.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/bench/bench-runner.ts#L40-L66)
- **Why Insufficient**: It does not test the real debugging harness end-to-end against real file fixtures.
- **Acceptance Criteria**:
  1. Update `BenchmarkRunner` to provision real isolated workspaces (using local disk isolation or Daytona sandbox).
  2. Write actual buggy files, execute reproduction command, run RCA, generate BRT, apply patch, and verify fix.
  3. Report explicit execution mode (`BENCH_OFFLINE`, `BENCH_LOCAL`, `BENCH_DAYTONA_LIVE`).
