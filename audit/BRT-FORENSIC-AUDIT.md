# 🔬 Forensic Audit: Bug Reproduction Tests & Oracles (`audit/BRT-FORENSIC-AUDIT.md`)

> **BRT & Oracle Forensics**: Deep audit of BRT generation (`generateReproductionCandidate`), pre-patch failure validation (`validateBRTPrePatch`), post-patch verification (`validateBRTPostPatch`), and oracle confidence classification.

---

## 1. BRT Synthesis & Dual-Gate Forensic Trace

```typescript
// 1. Candidate Synthesis (packages/core/src/tools/reproduce-test.ts)
const candidate = generateReproductionCandidate(errorReport, projectPath, options);
// Generates standalone JS test script with imports, error execution, and defect signature assertions:
// Pre-patch: console.error("[BRT_DEFECT_REPRODUCED]: " + err.name + ": " + err.message); process.exit(1);
// Post-patch: console.log("[BRT_EXECUTION_PASS]: ..."); process.exit(0);

// 2. Pre-Patch Validation
const preReport = validateBRTPrePatch(candidate, { exitCode: 1, stderr: "...[BRT_DEFECT_REPRODUCED]..." });
// Enforces:
//   - isFailure: exitCode !== 0
//   - matchedSignature: stdout/stderr includes [BRT_DEFECT_REPRODUCED] or target error name

// 3. Post-Patch Validation
const postReport = validateBRTPostPatch(candidate, { exitCode: 0, stdout: "[BRT_EXECUTION_PASS]" });
// Enforces:
//   - isPass: exitCode === 0
//   - matchedSignature: includes [BRT_EXECUTION_PASS]
```

---

## 2. Forensic Findings on BRT & Oracles

1. **Synthesis Logic**: **REAL ✅**. Synthesizes valid JavaScript code targeting the crash file and function with input payload.
2. **Dual-Gate Verification**: **REAL ✅**. Pre-patch requires non-zero exit code + signature match; post-patch requires exit code 0.
3. **Flaky / Statistical Jitter**: **PARTIAL 🟡**. Concurrency perturbation engine (`schedule-perturbation.ts`) exists and can run repeated loops ($N=10-20$), but is not yet plugged in as a mandatory automated multiplier on every unit test run by default.
4. **Oracle Confidence States**: **HEURISTIC 🟡**. States (`PROVEN`, `INFERRED`, `AMBIGUOUS`) are inferred from defect signature match and test exit codes rather than formal $D_{\text{KL}}$ mathematical divergence sampling.
