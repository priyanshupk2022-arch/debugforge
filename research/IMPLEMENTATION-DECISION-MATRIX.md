# 📊 Implementation Decision Matrix (`research/IMPLEMENTATION-DECISION-MATRIX.md`)

> **Executive Triage**: Final classification of all proposed capabilities into four decisive engineering buckets: **BUILD NOW**, **EXPERIMENT**, **DEFER**, or **REJECT**.

---

## 1. Categorization Criteria

1. **BUILD NOW**: Core to DebugForge's mission, backed by strong empirical evidence, implementable with high reliability and low maintenance.
2. **EXPERIMENT**: Valuable capability requiring empirical measurement or pilot benchmarking before core integration.
3. **DEFER**: Conceptually sound but dependent on external infrastructure or premature for current monorepo scope.
4. **REJECT**: High overhead, unproven benefits, excessive complexity, or out-of-scope hardware coupling.

---

## 2. Master Decision Matrix

| Capability / Subsystem | Category | Technical Rationale & Evidence Basis | Action Item |
| :--- | :---: | :--- | :--- |
| **Persistent Task Memory Store** | **BUILD NOW ✅** | Isolates verified facts and rejected hypotheses; prevents context bloat. | In Core (`memory/task-memory.ts`) |
| **Autonomous Supervisor Watchdog** | **BUILD NOW ✅** | Halts 3x failure loops and patch oscillation ($A \to B \to A$). | In Core (`supervisor/supervisor.ts`) |
| **Unified Variation Operator** | **BUILD NOW ✅** | Surgical line-bounded mutations with SHA-256 rollback metadata. | In Core (`tools/variation-operator.ts`) |
| **Dual-Gated BRT Engine** | **BUILD NOW ✅** | Pre-patch non-zero exit signature check + post-patch exit 0 check. | In Core (`tools/reproduce-test.ts`) |
| **Anti-Gaming Sentinel** | **BUILD NOW ✅** | Pre-change SHA-256 test snapshot + diff scanning for `.skip`/`try-catch`. | In Core (`security/anti-gaming.ts`) |
| **Causal Provenance Engine** | **BUILD NOW ✅** | Decouples Crash Site from Upstream Infection Origin. | In Core (`causal/provenance.ts`) |
| **Runtime Probe Manager** | **BUILD NOW ✅** | Injects temporary non-invasive variable tracepoints with auto-cleanup. | In Core (`probing/runtime-probe.ts`) |
| **Concurrency Schedule Perturbation**| **BUILD NOW ✅** | Injects async delay jitter to catch race conditions ($C \ge 0.999$). | In Core (`concurrency/schedule-perturbation.ts`) |
| **Provider-Agnostic Router & Conformance** | **BUILD NOW ✅** | Fail-closed provider normalization across Anthropic, OpenAI, Google, etc. | In Core (`agent/provider.ts`, `router.ts`) |
| **Cryptographic HITL Gatekeeper** | **BUILD NOW ✅** | Single-use HMAC nonces, anti-replay tokens, and patch diff hash validation.| In Core (`hitl/approval.ts`) |
| **DebugForge-Bench v0 Runner** | **BUILD NOW ✅** | 5-task deterministic benchmark runner (`npm run bench`). | In Core (`bench/bench-runner.ts`) |
| **Local Differential Mutation FL** | **EXPERIMENT 🔬** | Injects 3-5 mutants strictly into modified lines to check test sensitivity. | Prototype in benchmark harness |
| **TDAD Transitive Impact Graph** | **EXPERIMENT 🔬** | Static call graph impact analysis for test selection. | Benchmark on multi-service fixtures |
| **Epistemic Uncertainty $D_{\text{KL}}$ Refusal** | **EXPERIMENT 🔬** | Dual-model prompt sampling to quantify specification ambiguity. | Prototype in test oracle module |
| **Cross-Language Polyglot Adapters** | **EXPERIMENT 🔬** | Polyglot execution adapters (Python, Rust, Go). | Expand interface adapters |
| **Landlock / gVisor Custom Kernel Mods**| **DEFER ⏳** | Linux-specific syscall hooks; incompatible with Windows/macOS hosts. | Rely on Daytona OCI microVMs |
| **Distributed Microservice OpenTelemetry**| **DEFER ⏳** | Requires distributed Jaeger/OTel infrastructure. | Target multi-container release |
| **Full Bytecode Dynamic Slicing** | **REJECT ❌** | Imposes $50\times - 100\times$ runtime slowdown on standard test suites. | Use Call-Frame Slicing + Probes |
| **Global Mutation Testing ($\ge 85\%$)** | **REJECT ❌** | Generating hundreds of mutants burns entire token budget on one task. | Use Local Differential Mutants |
| **Global Vector DB Memory Persistence**| **REJECT ❌** | Cross-task retrieval causes memory amplification and hypothesis poisoning.| Use Ephemeral Task Store |
| **Lauterbach TRACE32 Hardware Bridge** | **REJECT ❌** | Out of scope for general cloud/web software repository debugging. | Keep as specialized external plugin |
