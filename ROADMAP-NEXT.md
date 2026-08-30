# 🗺️ DebugForge Next-Generation Roadmap (`ROADMAP-NEXT.md`)

This roadmap prioritizes improvements based on **Impact**, **Reliability**, **Differentiation**, **Feasibility**, **Hackathon Value**, **Security Value**, and **Engineering Complexity**.

---

## Tier 1: Immediate High-Value (Current Phase Target)
*Target: Direct reliability improvements with zero external dependency bloat.*

| Feature | Description | Impact | Feasibility | Primary Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **BRT / MRE Generator & Pre-Patch Gate** | Automated synthesis of deterministic Bug Reproduction Tests before patch synthesis. | **P0** | **High** | Eliminates blind patching; guarantees reproducible defect baseline. |
| **Anti-Gaming Protected Artifact Sentinel** | SHA-256 integrity trees for test directories to prevent test deletion, weakening, or exception masking. | **P0** | **High** | Stops benchmark/test gaming and ensures genuine fixes. |
| **Fail-Closed Provider Schema Engine** | Strict validation of TrueForge provider manifests preventing silent fallback. | **P0** | **High** (Done) | Robust multi-model support (OpenAI, Anthropic, Google, DeepSeek). |

---

## Tier 2: Hackathon Differentiation
*Target: Observable, visual, and measurable features demonstrating harness supremacy.*

| Feature | Description | Impact | Feasibility | Primary Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **DebugForge-Bench v0** | 25 deterministic benchmark tasks across 5 bug classes with machine-readable task specifications. | **P1** | **Medium** | Objective comparison separating Model Effect from Harness Effect. |
| **Anti-Lucky-Pass Metric Engine** | Finite-state machine tracking violation events (unreproduced patch attempts, test tampering). | **P1** | **Medium** | Rejects false positives and accidental passes with auditable evidence. |
| **Visual Causal Graph in Web UI** | Interactive SVG/Canvas node rendering tracing Crash Site ➔ Proximate Cause ➔ Infection Origin. | **P1** | **High** | High-impact visual demonstration for judges and operators. |

---

## Tier 3: Research-Grade Verification
*Target: Deep automated reasoning techniques evaluated against empirical benchmarks.*

| Feature | Description | Impact | Feasibility | Primary Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **Mutation Testing Gate (PIT/Stryker-style)** | Mutate patched code with synthetic AST faults to verify BRT test sensitivity. | **P2** | **Medium** | Confirms reproduction test is truly testing the defect semantics. |
| **Concurrency Schedule Perturbation** | Dynamic thread/promise interleaving injection to catch non-deterministic race conditions. | **P2** | **Medium** | High effectiveness on async race condition bugs. |
| **Dynamic Backward AST Slicing** | Compute data-flow and control-dependence graph from crash point to variable definition. | **P2** | **Medium** | Automatically isolates culprit lines across large files. |

---

## Tier 4: Long-Term Enterprise Moat
*Target: Advanced enterprise capabilities requiring specialized runtime infrastructure.*

| Feature | Description | Impact | Feasibility | Primary Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **Episodic Debugging Memory & Vector RAG** | Cross-session index of past root cause graphs and verified diff patterns. | **P3** | **Medium** | Faster resolution on recurrent architectural defects. |
| **Multi-Agent Red-Team / Blue-Team Verification** | Adversarial subagent attempts to break the synthesized patch with fuzzing inputs. | **P3** | **Low** | Enterprise security assurance for zero-day vulnerability remediation. |
| **Code Property Graph (CPG) Integration** | Full AST + CFG + PDG joint graph representation for polyglot codebases. | **P3** | **Low** | Scalable inter-procedural causal tracing for monolithic repositories. |
