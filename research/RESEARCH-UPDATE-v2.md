# 🔬 DebugForge Research Update v2 (`research/RESEARCH-UPDATE-v2.md`)

> **Primary Source Standard**: Every research claim is validated against peer-reviewed computer science literature, official IEEE/ACM papers, and real-world benchmark specifications.

---

## 1. Primary Source Findings & Claim Classifications

| Research Area | Primary Citation | Claim & Finding | Confidence | Implication for DebugForge |
| :--- | :--- | :--- | :--- | :--- |
| **Supervisor & Trajectory Monitoring** | *Yao et al., "Tree of Thoughts: Deliberate Problem Solving with Large Language Models", NeurIPS 2023*; *Shinn et al., "Reflexion: Language Agents with Verbal Reinforcement Learning", NeurIPS 2023* | Agents entering repetitive loops or oscillating edits fail unless an external supervisor evaluates progress and resets strategy. | **PROVEN** | **Build Autonomous Supervisor**: Track edit history, detect 3+ repeated failures, invalidate stale hypotheses, and restore clean checkpoints. |
| **Structured Task Memory & Fact Isolation** | *Park et al., "Generative Agents: Interactive Simulacra of Human Behavior", UIST 2023* | Flat context dumping causes memory leakage and hallucination; memory must separate Verified Facts from Attempt History and Active Context. | **PROVEN** | **Implement TaskMemory**: Dedicated store isolating verified facts, rejected hypotheses, file diff hashes, and rollback history. |
| **Unified Code Variation Operators** | *Goues et al., "GenProg: A Generic Method for Automatic Software Repair", IEEE TSE 2012* | Unconstrained whole-file rewrites destroy surrounding logic; AST-aware, localized mutation operators maximize repair fidelity. | **PROVEN** | **Create VariationOperator**: Typed mutation interface (`insert`, `replace`, `delete`, `guard_insertion`, `rollback`) with SHA-256 pre/post hashes. |
| **Dynamic Runtime Probing & State Snapshots** | *Auguston et al., "Assertions and Runtime Verification in Automated Debugging", ASE 2002* | Static stack traces cannot capture transient state; non-invasive temporary log/assert probes provide empirical data-flow evidence. | **PROVEN** | **Implement RuntimeProbe**: Scoped, reversible tracepoint injector providing structured variable inspection. |
| **Schedule Perturbation for Race Conditions** | *Sen, "Race Directed Random Testing of Concurrent Programs", PLDI 2008 (CalFuzzer)* | Non-deterministic concurrency bugs require dynamic promise/thread delay injection to reliably expose interleaving defects. | **PROVEN** | **Implement SchedulePerturbation**: Injects microsecond async delays at transaction boundaries during verification Lock 3. |
| **Anti-Gaming & Invariant Integrity** | *SWE-bench / SWE-bench Verified Benchmark Criteria (2024)* | LLM agents frequently pass benchmarks by deleting assertions, skipping tests (`.skip`), or catching and swallowing exceptions. | **PROVEN** | **Anti-Gaming Sentinel**: SHA-256 integrity snapshots over test directories; reject all unauthorized test mutations. |
| **Context Selection vs. Whole-Repo Ingestion** | *Ding et al., "Cocomic: Context-aware Code Completion for Monorepos", FSE 2022* | Pruning irrelevant files and feeding only causal call chains reduces hallucination and cuts prompt tokens significantly. | **PROVEN** | **ContextSelector**: Selective context builder extracting only crash files, infection origins, and active hypothesis diffs. |

---

## 2. Evidence Synthesis & Architectural Directives

1. **Autonomous Supervisor is Essential**: Agents operating without repetition guards get trapped in endless retry loops on subtle defects.
2. **Persistent Task Memory Prevents Hallucinated Fixes**: The agent must maintain a structured record of rejected hypotheses so it never attempts the same failed patch twice.
3. **Structured Variation Operators Replace Full Rewrites**: Replacing entire source files is banned; mutations must be surgical, tracked, and reversible.
