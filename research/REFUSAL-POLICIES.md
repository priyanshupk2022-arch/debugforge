# 🚫 Explicit Refusal & Non-Patching Policies (`research/REFUSAL-POLICIES.md`)

> **Executive Policy**: Clear definition of situations where DebugForge MUST halt execution, refuse automated patching, and escalate to human review to prevent catastrophic corruption or false success.

---

## 1. Mandatory Refusal Protocols

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    DEBUGFORGE REFUSAL MATRIX                              │
├───────────────────────────────────────────────────────────────────────────┤
│ REFUSAL 1: Ambiguous Specifications (P(H_A) ≈ P(H_B))                     │
│  - Stance: Hard Halt (AmbiguousSpecificationError).                       │
│  - Rationale: Prevents enshrining hallucinated business logic.            │
├───────────────────────────────────────────────────────────────────────────┤
│ REFUSAL 2: Unverified LLM Semantic Assertions                             │
│  - Stance: Reject patch without physical runtime test execution.          │
│  - Rationale: LLM commentary is not ground truth proof of correctness.   │
├───────────────────────────────────────────────────────────────────────────┤
│ REFUSAL 3: Test Suite & Test Fixture Modification                         │
│  - Stance: Hard rejection of diffs touching test files.                   │
│  - Rationale: Prevents reward hacking via test neutralization or skips.   │
├───────────────────────────────────────────────────────────────────────────┤
│ REFUSAL 4: Unsandboxed Execution Requests                                 │
│  - Stance: Fail-closed when DAYTONA_MODE=required and credentials missing.│
│  - Rationale: Protects host operating system from untrusted code execution│
├───────────────────────────────────────────────────────────────────────────┤
│ REFUSAL 5: Unconstrained Global Architectural Redesign                    │
│  - Stance: Rejection of patches exceeding blast-radius caps (>15% lines). │
│  - Rationale: Prevents unintended cascading regressions in callers.       │
├───────────────────────────────────────────────────────────────────────────┤
│ REFUSAL 6: Unsupported Language Toolchains                                │
│  - Stance: Reject execution if no Language Adapter profile is active.      │
│  - Rationale: Avoids applying incompatible language semantics (e.g. TS in │
│               Rust/C++ codebases).                                        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Refusal Payload Structure

When a Refusal Protocol is triggered, DebugForge emits a structured machine-readable diagnostic payload:

```json
{
  "status": "REFUSAL_HALT",
  "refusalType": "AMBIGUOUS_SPECIFICATION",
  "reason": "Two mutually exclusive requirements inferred from issue description with equal epistemic probability.",
  "divergenceDetails": {
    "interpretationA": "Clip negative integer values to zero.",
    "interpretationB": "Throw InvalidArgumentError on negative inputs."
  },
  "requiredHumanAction": "Specify expected behavior for negative input domain.",
  "workspaceState": "RESTORED_TO_BASELINE"
}
```
