# 📦 Master Idea & Recommendation Inventory (`research/MASTER-IDEA-INVENTORY.md`)

> **Executive Inventory**: Exhaustive catalog of every distinct concept, technique, metric, failure mode, and architectural recommendation extracted from Reports 1, 2, and 3.

---

## 1. Comprehensive Inventory Table

| ID | Concept / Technique | Source Report | Category | Evidence Level | Claimed Benefit | Current Repo Status | Dependencies | Risks & Side Effects | Benchmarkability | Recommendation |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :--- | :---: | :---: |
| **INV-01** | TrueForge Official SDK Harness | R1, R2, R3 | ORCHESTRATION | `PROVEN` | Standardized agent lifecycle, session streaming, and provider routing. | **IMPLEMENTED ✅** | `@truefoundry/trueforge-sdk` | Server availability | High | **BUILD NOW** |
| **INV-02** | Streamable MCP HTTP/SSE Server | R1, R2, R3 | MCP | `PROVEN` | Decoupled, tool-agnostic diagnostics interfaces for LLM hosts. | **IMPLEMENTED ✅** | `@modelcontextprotocol/sdk` | Transport drops | High | **BUILD NOW** |
| **INV-03** | Daytona Isolated Sandboxes | R1, R2, R3 | SANDBOX | `PROVEN` | Fast, isolated OCI microVM execution environments. | **IMPLEMENTED ✅** | `@daytona/sdk` | API credentials | High | **BUILD NOW** |
| **INV-04** | Persistent Task Memory Store | R1, R2, R3 | MEMORY | `RESEARCH-BACKED` | Isolates verified facts, rejected hypotheses, and attempt history. | **IMPLEMENTED ✅** | In-memory `TaskMemoryStore` | Memory bloat | High | **BUILD NOW** |
| **INV-05** | Autonomous Supervisor Watchdog | R1, R2, R3 | SUPERVISOR | `RESEARCH-BACKED` | Halts 3x failure loops, detects oscillating patch edits ($A \to B \to A$). | **IMPLEMENTED ✅** | `AutonomousSupervisor` | Early reset false positive | High | **BUILD NOW** |
| **INV-06** | Unified Variation Operator | R1, R2, R3 | PATCHING | `PROVEN` | Surgical line-bounded AST mutations with before/after SHA-256 hashes. | **IMPLEMENTED ✅** | `VariationOperator` | Multi-file edits | High | **BUILD NOW** |
| **INV-07** | Dual-Gated BRT Engine | R1, R2, R3 | BRT/MRE | `PROVEN` | Pre-patch must fail with defect signature; post-patch must exit 0. | **IMPLEMENTED ✅** | `reproduce-test.ts` | Flaky reproduction | High | **BUILD NOW** |
| **INV-08** | Anti-Gaming Sentinel | R1, R2, R3 | ANTI-GAMING | `PROVEN` | Captures SHA-256 test trees; blocks `try/catch` and `.skip` cheats. | **IMPLEMENTED ✅** | `anti-gaming.ts` | Unorthodox valid fixes | High | **BUILD NOW** |
| **INV-09** | Causal Provenance Engine | R1, R2, R3 | RCA | `PROVEN` | Decouples Crash Site, Proximate Cause, and Infection Origin. | **IMPLEMENTED ✅** | `provenance.ts` | Deep recursion | High | **BUILD NOW** |
| **INV-10** | Runtime Probe Manager | R1, R2, R3 | RUNTIME | `PROVEN` | Injects temporary, non-invasive tracepoints (`log_var`) with auto-cleanup. | **IMPLEMENTED ✅** | `runtime-probe.ts` | Injected syntax errors | High | **BUILD NOW** |
| **INV-11** | Concurrency Perturbation Engine | R1, R2, R3 | CONCURRENCY | `PROVEN` | Microsecond async delay jitter to expose race conditions ($C \ge 0.999$). | **IMPLEMENTED ✅** | `schedule-perturbation.ts` | Test duration surge | High | **BUILD NOW** |
| **INV-12** | Cryptographic Single-Use HITL | R1, R2, R3 | HITL | `PROVEN` | Single-use HMAC nonces, replay protection, and patch diff hash matching. | **IMPLEMENTED ✅** | `approval.ts` | Operator fatigue | High | **BUILD NOW** |
| **INV-13** | Provider Conformance & Router | R1, R2, R3 | MODEL | `PROVEN` | Provider-agnostic model routing, strict schema validation, fail-closed. | **IMPLEMENTED ✅** | `provider.ts`, `router.ts` | Model version drift | High | **BUILD NOW** |
| **INV-14** | DebugForge-Bench v0 Runner | R1, R2, R3 | BENCHMARK | `PROVEN` | Automated benchmark suite with 5 bug categories (`npm run bench`). | **IMPLEMENTED ✅** | `bench-runner.ts` | Benchmark overfitting | High | **BUILD NOW** |
| **INV-15** | Cross-Language Adapter Interfaces | R1, R2, R3 | CROSS-LANGUAGE | `PLAUSIBLE` | Polyglot runtime execution interface (TS/JS, Python, Rust, Go). | **PARTIAL 🟡** | `language-adapter.ts` | Complex compilers | Medium | **EXPERIMENT** |
| **INV-16** | TDAD Transitive Impact Graph | R1, R2, R3 | BLAST RADIUS | `RESEARCH-BACKED` | Static call-graph analysis to run all transitively affected unit tests. | **DESIGN 🔬** | AST Parser (Tree-sitter) | Long test execution | High | **EXPERIMENT** |
| **INV-17** | Local Differential Mutation FL | R1, R2, R3 | VERIFICATION | `RESEARCH-BACKED` | Injects 3-5 mutants strictly into modified lines to verify assertion strength. | **DESIGN 🔬** | AST Mutator | Compute overhead | High | **EXPERIMENT** |
| **INV-18** | Epistemic Uncertainty Disambiguation | R1, R2, R3 | ORACLE | `RESEARCH-BACKED` | Samples dual interpretations; triggers `AmbiguousSpecificationError` if $D_{\text{KL}} > \epsilon$. | **DESIGN 🔬** | Dual Model Sampling | Token surge | Medium | **EXPERIMENT** |
| **INV-19** | Full Bytecode Dynamic Slicing | R1, R2 | RCA | `PLAUSIBLE` | Full instruction-level execution slicing via runtime debuggers. | **RESEARCH-ONLY** | V8/Python VM hooks | $50\times$ runtime slowdown | Low | **REJECT** |
| **INV-20** | Lauterbach TRACE32 Hardware Bridge | R1 | HARDWARE | `NOT APPLICABLE` | Direct ECU register and instruction-level flash debugging. | **NOT APPLICABLE** | Hardware debugger TCP | Hardware wear-out | Low | **REJECT FROM CORE** |
| **INV-21** | Global Mutation Testing ($\ge 85\%$) | R2 | VERIFICATION | `PLAUSIBLE` | Injects hundreds of mutants across entire repository. | **RESEARCH-ONLY** | Mutation engine | Massive token burn | Medium | **REJECT** |
| **INV-22** | Landlock/gVisor Custom Kernel Mods | R1, R2 | SANDBOX | `PROVEN (Linux)` | Kernel-level unprivileged userspace syscall and filesystem confinement. | **DEFERRED ⏳** | Linux kernel $\ge 5.13$ | Fails on Win/macOS | High | **DEFER (Use Daytona)** |
