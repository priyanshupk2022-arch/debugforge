# 📊 Benchmarkability & Measurement Analysis (`research/benchmarkability-analysis.md`)

> **Benchmark Scientist Role**: Evaluate whether proposed capabilities can be measured objectively, and decouple **Model Effect** (LLM capability) from **Harness Effect** (DebugForge verification & tooling rigor).

---

## 1. Decoupling Model Effect vs. Harness Effect

To avoid benchmark gaming and outcome-only confounding:

$$\text{Total Observed Performance} = f(\text{Model Reasoning Capability}, \text{Harness Verification Rigor}, \text{Execution Environment Stability})$$

| Evaluation Axis | Model Effect (Vary Model, Lock Harness) | Harness Effect (Lock Model, Vary Harness) |
| :--- | :--- | :--- |
| **Experimental Setup** | Run DebugForge with identical MCP tools, Supervisor, and BRT gates against: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, DeepSeek-V3. | Run Baseline ReAct Agent vs. DebugForge (Triple-Lock + Supervisor + Anti-Gaming) using the exact same LLM (e.g. GPT-4o). |
| **Measured Metric** | Raw hypothesis generation accuracy, single-turn patch syntax correctness. | Resolution rate delta ($\Delta \text{VRR}$), patch oscillation reduction, prevention of lucky passes, regression prevention. |
| **Scientific Value** | Evaluates LLM domain knowledge and token adherence. | Proves the empirical value added by the DebugForge harness independently of frontier model upgrades. |

---

## 2. Measurability Audit of Proposed Subsystems

| Subsystem | Metric & Oracle | Baseline Comparison | Feasibility & Environmental Requirements |
| :--- | :--- | :--- | :--- |
| **Autonomous Supervisor** | **Patch Oscillation Rate (%) & Breaker Trip Latency (s)** | Standard linear retry loop (bouncing between patches $A$ and $B$). | High: Inject cyclic failing tests; measure time to `STRATEGY_RESET`. |
| **Anti-Gaming Sentinel** | **Test Modification Rejection Rate (100%)** | Unprotected sandbox (agent skips `.skip` or wraps in `catch`). | High: Ingest patches with known cheating patterns; measure hard rejection. |
| **Causal Provenance Engine** | **Infection Origin Localization Distance (AST Depth)** | Stack-trace only crash-line localization. | Medium: Multi-hop cascading bugs (e.g. Defects4J / custom multi-file fixtures). |
| **Triple-Lock Verification** | **Lucky Pass Rate (%) & False Acceptance Rate (%)** | Single-run unit test runner exit code 0. | High: Seed subtle mutant bugs; verify independent gate fails closed. |
| **Schedule Perturbation Engine** | **Concurrency Bug Resolution Confidence ($C \ge 0.999$)** | Single unperturbed test execution. | High: Execute race-condition fixtures across $N=20$ randomized jitter delays. |
