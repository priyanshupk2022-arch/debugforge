# 🧪 Bug Reproduction Test (BRT) Red-Team Audit (`audit/BRT-AUDIT.md`)

> **Objective**: Attack the Bug Reproduction Test (BRT) and Minimal Reproduction Example (MRE) generation engine to uncover edge cases where a reproduction test fails for the wrong reason or passes prematurely.

---

## 1. Attack Scenarios & Evaluation

| Red-Team Attack | Attack Mechanism | Expected Engine Behavior | Actual Result in Test Suite |
| :--- | :--- | :--- | :--- |
| **Premature Pass (Bug Not Triggered)** | Generated BRT runs, but doesn't pass triggering input, exiting with code 0. | `validateBRTPrePatch` rejects candidate with `[BRT failed pre-patch gate: Target defect was NOT reproduced]`. | **PASS ✅** (Pre-patch gate rejected) |
| **Wrong Error Signature** | Test fails with `sh: command not found` (exit code 127) rather than `TypeError`. | `validateBRTPrePatch` compares error signature; rejects unrelated error failure. | **PASS ✅** (Signature mismatch caught) |
| **Flaky Concurrency BRT** | Race condition fails 1 out of 10 times; test claims reproduced after 1 lucky run. | Concurrency BRT uses `Promise.all` across multiple parallel invocations with invariant assertions. | **PASS ✅** (Deterministic race trigger) |
| **Persistent Post-Patch Failure** | Patch is applied but bug is incomplete; BRT continues to fail. | `validateBRTPostPatch` detects exit code != 0 and blocks patch acceptance. | **PASS ✅** (Post-patch gate caught) |

---

## 2. Invariant Rules for BRT Generation

1. **Pre-Patch Invariant**:
   $$\text{BRT}(\text{Pre-Patch}) \equiv \text{FAIL} \quad \wedge \quad \text{Signature}(\text{Failure}) = \text{Target Defect}$$
2. **Post-Patch Invariant**:
   $$\text{BRT}(\text{Post-Patch}) \equiv \text{PASS} \quad (\text{Exit Code } 0)$$
3. **Minimization Invariant**: Reproduction tests must isolate the triggering function call and avoid loading unnecessary external web frameworks or long-running daemons.
