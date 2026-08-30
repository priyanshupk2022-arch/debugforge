# 🏛️ Canonical Architecture Blueprint v2 (`research/CANONICAL-ARCHITECTURE-v2.md`)

> **The Single Source of Truth for DebugForge**: Synthesized from the Three-Report Research Review, Independent Literature Validation, Skeptical Limitation Analysis, and Empirical Codebase Audits.

---

## 1. Executive Architecture Topology

DebugForge is an autonomous, evidence-driven, provider-agnostic AI debugging harness that connects orchestrators (TrueForge, Claude Code, Codex) to isolated sandbox environments (Daytona) via the Model Context Protocol (MCP).

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    DEBUGFORGE CANONICAL ARCHITECTURE                      │
├───────────────────────────────────────────────────────────────────────────┤
│ 1. TRUEFORGE ORCHESTRATION & AGENT HARNESS                                │
│    - TrueForge official SDK runtime integration (@truefoundry/trueforge)  │
│    - Real session creation, turn streaming via SSE, and tool routing      │
├───────────────────────────────────────────────────────────────────────────┤
│ 2. STREAMABLE MODEL CONTEXT PROTOCOL (MCP) SERVER                         │
│    - Exposes 5 core diagnostics tools over HTTP/SSE with Zod schemas:      │
│      • debugforge_ingest_error                                            │
│      • debugforge_analyze_trace                                           │
│      • debugforge_reproduce                                               │
│      • debugforge_auto_patch                                              │
│      • debugforge_verify_fix                                              │
├───────────────────────────────────────────────────────────────────────────┤
│ 3. PERSISTENT TASK MEMORY STORE (memory/task-memory.ts)                   │
│    - Isolates verified runtime facts, rejected hypotheses, and attempt logs│
│    - Ephemeral task isolation with zero cross-task context leakage        │
├───────────────────────────────────────────────────────────────────────────┤
│ 4. AUTONOMOUS SUPERVISOR WATCHDOG (supervisor/supervisor.ts)              │
│    - Watchdog monitoring search trajectories for:                         │
│      • 3x consecutive identical failure loops ➔ STRATEGY_RESET            │
│      • Oscillating patch edits (A ➔ B ➔ A) ➔ ROLLBACK_CHECKPOINT          │
│      • Hard retry budget caps (default: 10 attempts)                      │
├───────────────────────────────────────────────────────────────────────────┤
│ 5. UNIFIED VARIATION OPERATOR (tools/variation-operator.ts)               │
│    - Surgical line-bounded AST mutations with SHA-256 before/after hashes │
│    - Deterministic rollback capability to pre-mutation baseline           │
├───────────────────────────────────────────────────────────────────────────┤
│ 6. BUG REPRODUCTION TEST (BRT) ENGINE (tools/reproduce-test.ts)           │
│    - Dual-Gate Verification:                                              │
│      • Pre-patch gate: MUST fail with matching defect signature           │
│      • Post-patch gate: MUST exit with code 0 cleanly                     │
├───────────────────────────────────────────────────────────────────────────┤
│ 7. ANTI-GAMING SENTINEL (security/anti-gaming.ts)                         │
│    - Captures SHA-256 pre-change workspace snapshots                      │
│    - Scans unified diffs to block exception swallowing and test skipping  │
├───────────────────────────────────────────────────────────────────────────┤
│ 8. CAUSAL PROVENANCE ENGINE (causal/provenance.ts)                        │
│    - Reconstructs dependency graphs decoupling:                           │
│      • Crash Site ➔ Proximate Cause ➔ Infection Origin                     │
├───────────────────────────────────────────────────────────────────────────┤
│ 9. RUNTIME PROBE MANAGER (probing/runtime-probe.ts)                       │
│    - Injects temporary, non-invasive observation tracepoints (`log_var`)   │
│    - Guaranteed automatic workspace cleanup post-diagnosis               │
├───────────────────────────────────────────────────────────────────────────┤
│ 10. CONCURRENCY SCHEDULE PERTURBATION (concurrency/schedule.ts)           │
│     - Injects microsecond async delay jitter around promise boundaries     │
│     - Deterministically catches race conditions across repeated iterations│
├───────────────────────────────────────────────────────────────────────────┤
│ 11. CRYPTOGRAPHIC HITL GATEKEEPER (hitl/approval.ts)                      │
│     - Enforces single-use HMAC nonces, replay protection, and patch diff  │
│       hash validation before disk mutation                                │
├───────────────────────────────────────────────────────────────────────────┤
│ 12. AUTOMATED BENCHMARK RUNNER (bench/bench-runner.ts)                    │
│     - Automated runner for DebugForge-Bench v0 (npm run bench)             │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Seven Execution States & Transition Lifecycle

```
[STATE_IDLE]
     │ (Error Ingestion / Intake)
     ▼
[STATE_REPRODUCING] (Synthesize BRT Candidate; Validate Pre-Patch Non-Zero Exit)
     │
     ▼
[STATE_ISOLATING_RCA] (Backward Causal Tracing; Decouple Crash Site from Origin)
     │
     ▼
[STATE_SYNTHESIZING_PATCH] (Line-Bounded AST Mutation via Variation Operator)
     │
     ▼
[STATE_VERIFYING] (Triple-Lock Gates: Post-Patch BRT + Regressions + Anti-Gaming)
     │
     ├── [If Lock Fails] ──> Autonomous Supervisor ──> Checkpoint Rollback / Reset
     │
     └── [If Locks Pass]
          │
          ▼
[STATE_HUMAN_GATE] (Cryptographic HMAC Nonce + Diff Review)
     │
     ▼
[STATE_RESOLVED] (Patch Applied to Target Workspace; Telemetry Logged)
```

---

## 3. Explicit Refusal & Non-Patching Policies

DebugForge enforces a strict **Fail-Closed Stance**:
1. **Ambiguous Requirements**: When multiple valid architectural interpretations exist ($P(\mathcal{H}_A) \approx P(\mathcal{H}_B)$), the harness halts and requests human clarification rather than hallucinating intent.
2. **Unverified LLM Claims**: No repair is marked resolved based on model commentary alone; physical test execution with Exit Code 0 and BRT signature validation is mandatory.
3. **Test File Modification**: Proposed patches modifying existing test files, test fixtures, or test hooks (`conftest.py`, `.skip`) are automatically rejected by the Anti-Gaming Sentinel.
4. **Unsandboxed Host Execution**: In production mode, all code compilation, test execution, and script execution must run within isolated Daytona sandboxes.

---

## 4. Phase-Level Economic & Token Stopping Budgets

| Debugging Phase | Token Allocation Cap | Monetary Budget Cap | Action / Step Limit | Hard Circuit Breaker Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Ingress & Localization** | 50,000 tokens | $\$0.30$ USD | 10 tool calls | Halt search; request file narrowing |
| **Patch Synthesis** | 150,000 tokens | $\$1.00$ USD | 10 attempts | Halt automated loop; trigger supervisor reset |
| **Verification & Mutation** | 100,000 tokens | $\$0.70$ USD | 5 test runs | Revert patch; fail closed |
| **Total Session Bound** | **300,000 tokens** | **$\$2.00$ USD** | **25 total steps** | **Hard Stop & Escalate to Human Operator** |
