# 📊 DebugForge-Bench v0: Specification & Benchmark Design (`benchmark/DEBUGFORGE-BENCH-v0.md`)

> **Objective**: Objective benchmark designed to decouple **Model Effect** (the reasoning strength of the underlying LLM) from **Harness Effect** (the verification rigor, sandbox isolation, BRT pre-patch gating, and anti-gaming protections of the harness).

---

## 1. Experimental Design: 3 Controlled Axes

```
┌─────────────────────────────────────────────────────────────┐
│ Experiment A: Harness Effect (Same Model, Different Harness)│
│   - Baseline Agent vs. DebugForge (Both on Gemini-2.0-Flash)│
├─────────────────────────────────────────────────────────────┤
│ Experiment B: Model Effect (Same Harness, Different Models) │
│   - DebugForge + Claude 3.5 Sonnet                          │
│   - DebugForge + GPT-4o                                     │
│   - DebugForge + Gemini 2.0 Flash                           │
│   - DebugForge + DeepSeek-Chat                              │
├─────────────────────────────────────────────────────────────┤
│ Experiment C: Verification Ablation                         │
│   - Without BRT / Anti-Gaming vs. Full Triple-Lock Defense  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Benchmark Corpus: 30 Deterministic Bug Tasks

| ID Range | Category | Difficulty | Bug Description | Expected Invariant |
| :--- | :--- | :--- | :--- | :--- |
| `DF-001` - `DF-005` | **Null / State Propagation** | Low - Med | DB pool exhaustion, missing optional chaining, unhandled undefined | Graceful fallback or error boundary |
| `DF-006` - `DF-010` | **Async Race Conditions** | Med - High | Unsynchronized read-modify-write on shared state | Mutex queue / transaction serialization |
| `DF-011` - `DF-015` | **Memory / Resource Leaks** | Med | Unbounded global cache array, unclosed file descriptors | LRU ring buffer, explicit cleanup |
| `DF-016` - `DF-018` | **Unhandled Promise Rejections**| Low | Missing async `.catch()` handler in event emitter | Wrapped async try/catch boundary |
| `DF-019` - `DF-022` | **Logic & Type Mismatches** | Low - Med | Off-by-one loop indexing, string vs number coercion | Type guard & boundary invariant check |
| `DF-023` - `DF-025` | **Timeout & Deadlock** | High | Circular promise dependency, unreleased mutex lock | Lock acquisition timeout & release |
| `DF-026` - `DF-028` | **Configuration Drift** | Low | Missing required env variable, malformed port integer | Schema validation & fail-closed default |
| `DF-029` - `DF-030` | **Data Corruption Invariants** | High | Partial batch update failure without rollback | Atomic multi-entity rollback |

---

## 3. Evaluation Metrics

1. **Verified Resolution Rate (VRR)**: Percentage of benchmark tasks where all 3 locks pass cleanly and hidden test oracles confirm defect is resolved.
2. **Lucky Pass Rate (LPR)**: Percentage of runs where an agent claimed success but tests were weakened, exceptions masked, or changes unverified.
3. **Reproduction Accuracy (RA)**: Rate at which generated BRTs accurately reproduce the original failure before patch synthesis.
4. **Patch Locality Index (PLI)**: Ratio of culprit-confined edits versus cosmetic churn.
