# 🔬 DebugForge Research Update: Primary Source Evidence & Evaluation (`research/RESEARCH-UPDATE.md`)

> **Guiding Principle**: Do not accept theoretical claims or ungrounded statistics. Every concept is cross-examined against peer-reviewed academic literature, real-world benchmark datasets, and official engineering specifications.

---

## 1. Primary Source Findings & Claim Classification

| Topic & Research Claim | Primary Source / Citation | Status | Relevance to DebugForge | Implementation Implication |
| :--- | :--- | :--- | :--- | :--- |
| **Bug Reproduction Before Patching (BRT/MRE)** | *Just et al., "Are Mutants a Valid Substitute for Real Faults in Software Testing?", FSE 2014*; *Zeller, "Yesterday, my program worked. Today, it does not. Why?", FSE 1999 (Delta Debugging)* | **PROVEN** | Patching without a reproducible failing baseline produces hallucinated or superficial fixes. | **Enforce BRT pre-patch gate**: require an executable failing test matching the bug signature before patch synthesis. |
| **Spectrum-Based Fault Localization (SBFL) Limits** | *Parnin & Orso, "Are Automated Debugging Techniques Actually Helping Programmers?", ISSTA 2011* | **PROVEN** | SBFL (Ochiai/Tarantula) ranks proximate crash sites high but consistently fails on silent root infection origins. | **Decouple Crash Site from Infection Origin**; do not rely purely on line coverage matrices. |
| **Mutation Testing as Test Quality Oracle** | *Jia & Harman, "An Analysis and Survey of the Development of Mutation Testing", IEEE TSE 2011* | **PROVEN** | Mutants evaluate whether the reproduction test is sensitive to subtle code mutations. | Integrate lightweight AST mutation gate (e.g. Stryker/PIT model) in verification Tier 3. |
| **Benchmark Overfitting & "Lucky Passes"** | *Jimenez et al., "Swe-bench: Can language models resolve real-world github issues?", ICLR 2024*; *Xia et al., "Automated Program Repair in the Era of Large Language Models", ICSE 2023* | **PROVEN** | LLM repair agents frequently pass test suites by deleting tests, weakening assertions, or exploiting test flakiness. | **Anti-Gaming Sentinel**: SHA-256 baseline snapshots on test suites; reject any unauthorized test modifications. |
| **90% Context Pruning / 85% Token Reduction** | *Research Report Blueprint (Theoretical Estimation)* | **SPECULATIVE** | No empirical baseline measurement currently exists in the codebase to substantiate these exact percentages. | **Do not copy into production docs**; measure real token usage in `benchmark/PERFORMANCE-BASELINE.md`. |
| **Property-Based Testing (PBT) for Concurrency** | *Claessen & Hughes, "QuickCheck: a lightweight tool for random testing of Haskell programs", ICFP 2000* | **PROMISING** | Generates randomized parallel execution schedules to trigger race conditions. | Add randomized interleaving inputs for async/race condition fixtures. |
| **Dynamic Backward Slicing** | *Korel & Laski, "Dynamic program slicing", Information Processing Letters 1988* | **PROVEN** | Traverses dynamic data/control dependencies back from crash site to first state corruption. | Implement in Tier 3 via AST traversal; avoid heavy JVM/C++ slice runtimes for Node.js. |
| **Sandbox Boundary & Ephemeral Isolation** | *Daytona SDK v0.207 Technical Specification (2025)* | **PROVEN** | Process-level isolation prevents host filesystem pollution and credential exfiltration. | Enforce fail-closed sandbox execution boundaries on all untrusted repositories. |

---

## 2. Evidence Assessment Summary

1. **What is solidly proven in literature**:
   - Automated debugging requires an executable reproduction step (MRE/BRT) to prevent hallucinated patches.
   - Benchmark gaming is widespread; LLMs will take shortest paths (swallowing exceptions, deleting assertions) unless cryptographically constrained.
   - Crash sites are rarely the true infection origins for multi-service or null-propagation defects.

2. **What was theoretical or unverified in prior drafts**:
   - Fixed claims of "90% context pruning" and "85% cost reduction" were projections, not measured facts.
   - Claims of full dynamic program dependence graphs (PDG) require substantial AST compiler infrastructure not yet present in standard Node runtimes.
