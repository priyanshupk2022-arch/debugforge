# ⚠️ Skeptical Analysis, Contradictions & Engineering Limitations (`research/contradictions-and-limitations.md`)

> **Executive Objective**: Actively challenge and stress-test every architectural recommendation proposed in the three research reports. Identify computational overheads, failure modes, false positives, and practical engineering blockers.

---

## 1. Skeptical Audit of Proposed Mechanisms

### A. Heavyweight Bytecode Slicing vs. Real-World Monorepos
- **The Theoretical Recommendation**: Instrument every bytecode instruction using dynamic tracers (`sys.settrace`, JVMTI, V8 Debugger) to construct full program dependency graphs.
- **The Real-World Reality**: Dynamic instruction tracing imposes a **$30\times - 100\times$ runtime slowdown** on complex Node.js / Python services. In test-heavy repositories, test suites that normally take 5 seconds would take 5 to 10 minutes, burning sandbox execution timeouts.
- **The Pragmatic Solution for DebugForge**: Use **Call-Frame Slicing + AST Variable Probing**. Trace structured stack frames and inject scoped runtime probes (`log_variable`) only around suspect functions.

---

### B. Full-Corpus Mutation Testing ($\ge 85\%$ Kill Rate) vs. Token Budgets
- **The Theoretical Recommendation**: Generate hundreds of first-order mutants across the entire repository to evaluate test suite strength for every candidate patch.
- **The Real-World Reality**: Running 100 mutants against a 20-second test suite requires **33 minutes of compute** and dozens of model evaluation calls per patch attempt, instantly blowing past the $\$2.00$ budget cap.
- **The Pragmatic Solution for DebugForge**: **Local Differential Mutation**. Inject 3 to 5 synthetic first-order mutants strictly into the modified line range of the candidate patch. If the test suite fails to kill local mutants, flag weak assertion risk.

---

### C. Formal Daikon Invariant Mining on Arbitrary Dynamic JS/TS Code
- **The Theoretical Recommendation**: Mine mathematical invariants ($x > 0$, $A \neq \text{null}$) from trace logs and reject any patch violating them.
- **The Real-World Reality**: Dynamic JavaScript codebases frequently use loosely typed objects, dynamic JSON payloads, and polymorphically dispatched methods. Daikon-style miners overfit to small test runs, generating false invariants (e.g., asserting an optional config field is always a string when it can be undefined), causing valid patches to be falsely rejected.
- **The Pragmatic Solution for DebugForge**: Restrict invariant assertions to **TypeScript interface type boundaries and runtime null/undefined guards**.

---

### D. Multi-Model Cross-Family Verification vs. API Availability
- **The Theoretical Recommendation**: Require three distinct model providers (e.g., Anthropic, OpenAI, and DeepSeek) to reach unanimous consensus on every patch.
- **The Real-World Reality**: In offline developer environments, local air-gapped deployments, or hackathon test harnesses, only a single provider API key may be configured. Forcing multi-provider consensus causes the harness to fail closed when external keys are absent.
- **The Pragmatic Solution for DebugForge**: Implement **Tiered Model Routing with Local-Fallback Verification**: If multiple providers are configured, enforce asymmetric cross-family review; if only one provider is available, enforce **prompt/role-isolated asymmetric verification** with distinct system prompts and temperature settings.

---

### E. MicroVM / gVisor Kernel Isolation vs. Portability
- **The Theoretical Recommendation**: Mandate custom Linux kernel modules (Landlock LSM + gVisor microVMs) for all executions.
- **The Real-World Reality**: DebugForge is a cross-platform TypeScript developer tool that runs on Windows, macOS, and Linux developer machines. Kernel-level Landlock calls fail on non-Linux hosts.
- **The Pragmatic Solution for DebugForge**: Enforce **Daytona Remote Sandboxes** for strict Linux microVM isolation, with native process boundary sandboxing (environment isolation, timeout limits, and child process trees) when running locally.

---

## 2. Synthesis Matrix: What to Adopt vs. What to Reject

| Proposed Feature | Theoretical Appeal | Practical Trap | Canonical Decision |
| :--- | :--- | :--- | :--- |
| **TRACE32 Hardware Flash Wear-Out** | Protects physical ECUs. | Irrelevant for 99% of cloud/web repositories. | **REJECT FROM CORE** (Keep as optional bridge) |
| **Full SMT Theorem Provers** | Mathematical proof of correctness. | Unsolvable for dynamic language runtimes. | **REJECT** (Use AST assertion checks) |
| **50-Run Perturbation Matrix for Races** | Statistical certainty ($C \ge 0.999$). | High execution duration. | **ADOPT FOR CONCURRENCY ONLY** ($N=10-20$ under jitter) |
| **Anti-Gaming Read-Only Test Mounts** | Stops test deletion/skipping. | Minimal overhead, 100% effective. | **ADOPT AS P0 CORE REQUIREMENT** |
| **Merkle Checkpoint Graph** | Stops patch oscillation loops. | In-memory SHA-256 graph is fast and light. | **ADOPT AS P0 CORE REQUIREMENT** |
| **Task Memory Store with TTL & Provenance** | Prevents context pollution. | Zero external dependencies, pure TypeScript. | **ADOPT AS P0 CORE REQUIREMENT** |
