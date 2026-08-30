# 🧩 Canonical Capability Map (`research/CANONICAL-CAPABILITY-MAP.md`)

> **Executive Deduplication**: Consolidate overlapping concepts and techniques across Reports 1, 2, and 3 into unified, production-ready capabilities without sacrificing granular sub-features.

---

## 1. Deduplicated Canonical Capability Modules

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    DEBUGFORGE CANONICAL CAPABILITIES                      │
├───────────────────────────────────────────────────────────────────────────┤
│ 1. Task Evidence & Memory Engine                                          │
│    Merged: TaskMemoryStore + Attempt History + Verified Facts + Rejected  │
│            Hypotheses + Prompt Summarizer + Temporal TTL + Provenance     │
├───────────────────────────────────────────────────────────────────────────┤
│ 2. Autonomous Supervisor & Governance                                     │
│    Merged: Loop Detector + Merkle Checkpoint Cycles + Phase Budgets +     │
│            Real Progress Metric + Strategy Reset Directive                │
├───────────────────────────────────────────────────────────────────────────┤
│ 3. Reproduction & Oracle Engine                                           │
│    Merged: BRT Candidate Generator + Dual-Gate Pre/Post Validation +       │
│            Stability Index + Metamorphic Relations + Ambiguity Refusal    │
├───────────────────────────────────────────────────────────────────────────┤
│ 4. Causal Provenance & Probing Engine                                     │
│    Merged: CausalProvenanceEngine + Frame Stack Slicing + Infection Origin│
│            Decoupling + RuntimeProbeManager + Reversible Tracepoints      │
├───────────────────────────────────────────────────────────────────────────┤
│ 5. Unified Variation & Patch Engine                                       │
│    Merged: VariationOperator + Line-Bounded AST Mutations + SHA-256 Hashes│
│            + Deterministic Rollback Metadata + applyPatch Disk Applier    │
├───────────────────────────────────────────────────────────────────────────┤
│ 6. Triple-Lock Verification & Anti-Gaming Sentinel                        │
│    Merged: Lock 1 (BRT Resolution) + Lock 2 (Regression Test Pass) +      │
│            Lock 3 (Invariants/Jitter) + SHA-256 Test Snapshots + Diff Scan│
├───────────────────────────────────────────────────────────────────────────┤
│ 7. Concurrency & Perturbation Engine                                      │
│    Merged: Async Delay Jitter + Schedule Perturbation + Binomial $C≥0.999$ │
├───────────────────────────────────────────────────────────────────────────┤
│ 8. Provider-Agnostic Model Router & Conformance                           │
│    Merged: Provider Normalization + Fail-Closed Config + Complexity Router│
├───────────────────────────────────────────────────────────────────────────┤
│ 9. Cryptographic HITL Gatekeeper                                          │
│    Merged: Single-Use HMAC Nonces + Anti-Replay Tokens + Diff Hash Match  │
├───────────────────────────────────────────────────────────────────────────┤
│ 10. DebugForge-Bench Evaluation Harness                                   │
│     Merged: Multi-Category Task Corpus + Automated Runner + Metrics Report │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Capability Breakdown

### Module 1: Task Evidence & Memory Engine
- **Underlying Code**: [`packages/core/src/memory/task-memory.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/memory/task-memory.ts)
- **Included Capabilities**:
  - `recordVerifiedFact(taskId, fact)`
  - `recordRejectedHypothesis(taskId, hypothesis)`
  - `recordAttempt(taskId, attempt)`
  - `buildPromptContextSummary(taskId)`: Extracts compact, token-efficient prompt context without context bloat.
  - `clearTask(taskId)`: Guarantees zero cross-task context leakage.

### Module 2: Autonomous Supervisor & Governance
- **Underlying Code**: [`packages/core/src/supervisor/supervisor.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/supervisor/supervisor.ts)
- **Included Capabilities**:
  - `evaluateTrajectory(taskId)`: Evaluates trajectory for 3x repeated failures, oscillating edit hashes ($A \to B \to A$), and attempt budget exhaustion.
  - Generates structured intervention directives (`STRATEGY_RESET`, `ROLLBACK_CHECKPOINT`).

### Module 3: Reproduction & Oracle Engine
- **Underlying Code**: [`packages/core/src/tools/reproduce-test.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/tools/reproduce-test.ts)
- **Included Capabilities**:
  - `generateReproductionCandidate(errorInfo, projectPath)`
  - `validateBRTPrePatch(candidate, execution)`: Enforces non-zero exit code with defect signature match.
  - `validateBRTPostPatch(candidate, execution)`: Enforces exit code 0 cleanly.

### Module 4: Causal Provenance & Probing Engine
- **Underlying Code**: [`packages/core/src/causal/provenance.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/causal/provenance.ts) & [`packages/core/src/probing/runtime-probe.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/probing/runtime-probe.ts)
- **Included Capabilities**:
  - `analyzeProvenance(errorReport)`: Decouples `CRASH_SITE`, `PROXIMATE_CAUSE`, and `INFECTION_ORIGIN`.
  - `injectProbe(projectPath, params)`: Injects scoped observation tracepoints (`log_variable`, `invariant_assert`).
  - `cleanupAllProbes()`: Automatically removes all injected probes upon diagnostic completion.
