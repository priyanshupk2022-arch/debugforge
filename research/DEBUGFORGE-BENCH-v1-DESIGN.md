# 🧪 DebugForge-Bench v1 Design & Validity Framework (`research/DEBUGFORGE-BENCH-v1-DESIGN.md`)

> **Benchmark Scientist & Evaluation Framework**: Scientific evaluation benchmark isolating the **Harness Effect** from the **Model Effect** and enforcing strict Anti-Gaming Validity Gates.

---

## 1. Multi-Axis Benchmark Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    DEBUGFORGE-BENCH v1 TAXONOMY                           │
├───────────────────────────────────────────────────────────────────────────┤
│ AXIS 1: Harness Effect (Isolating Harness Contribution)                  │
│  - Lock LLM: GPT-4o / Claude 3.5 Sonnet                                   │
│  - Compare: Standard ReAct Agent Loop  vs.  DebugForge Full Harness       │
│  - Target: Measure ΔVRR, patch oscillation reduction, lucky pass block.   │
├───────────────────────────────────────────────────────────────────────────┤
│ AXIS 2: Model Effect (Provider-Agnostic Conformance)                      │
│  - Lock Harness: DebugForge Canonical Harness v1                         │
│  - Compare: OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini 2.0), │
│             DeepSeek (DeepSeek-V3), Open-Source (Qwen 2.5 72B via Ollama) │
│  - Target: Measure hypothesis precision and single-turn patch quality.    │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Quantitative Metrics

| Metric Name | Mathematical Definition | Target Threshold | Scientific Purpose |
| :--- | :--- | :---: | :--- |
| **Verified Resolution Rate (VRR)** | $\frac{\sum \mathbb{I}(\text{BRT}_\text{pass} \land \text{Regressions}_\text{pass} \land \text{AntiGaming}_\text{clean})}{\text{Total Tasks}}$ | $\ge 90\%$ | Primary measure of genuine, regression-free program repair. |
| **Reproduction Success Rate (RSR)** | $\frac{\sum \mathbb{I}(\text{BRT}_\text{reproduced pre-patch})}{\text{Total Tasks}}$ | $\ge 95\%$ | Evaluates ability to construct faithful MRE reproduction scripts. |
| **RCA Infection Origin Accuracy** | $\frac{\sum \mathbb{I}(\text{InfectionOrigin}_\text{identified})}{\text{Total Tasks}}$ | $\ge 85\%$ | Measures decoupling of upstream root causes from crash sites. |
| **Lucky Pass Rejection Rate** | $\frac{\sum \mathbb{I}(\text{Rejected Lucky Passes})}{\text{Total Unsound Passes}}$ | $\ge 99\%$ | Measures prevention of chaotic trial-and-error edits and test skips. |
| **Oscillation Termination Rate** | $\frac{\sum \mathbb{I}(\text{Halted Cycles})}{\text{Total Cyclic Encounters}}$ | $100\%$ | Measures supervisor effectiveness in stopping infinite token loops. |

---

## 3. Anti-Gaming Validity Gates

A benchmark task in DebugForge-Bench v1 is automatically marked **SCIENTIFICALLY INVALID** if:
1. **Commit History Leakage**: Git history, commit diffs, or PR titles contain the gold solution string accessible via `git log`.
2. **Oracle Ambiguity**: Pre-patch buggy code passes the test suite or gold human patch fails the test suite.
3. **Environment Instability**: Test execution results fluctuate across consecutive runs on identical unpatched code due to network or clock dependencies.
4. **Test Fixture Exposure**: Solution or reference files reside in readable directories within the workspace root.
