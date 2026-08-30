# 🗂️ Master Failure Taxonomy (`research/MASTER-FAILURE-TAXONOMY.md`)

> **Consolidated Failure Surface**: Systematic classification of failure modes across the 13 operational domains of DebugForge, paired with exact defense mechanisms and detection policies.

---

## 1. Multi-Domain Failure Matrix

| Domain | Unique Failure Mode | Severity | Likelihood | Detectability | Exploitability | Recoverability | Current Defense in Repo | Missing / Planned Defense |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **1. Model** | Tool Argument Schema Hallucination | HIGH | MED | EASY | LOW | HIGH | Zod schema validation in MCP tools | Strict JSON-RPC parameter dropping |
| **1. Model** | System Prompt Instruction Drift | MED | HIGH | MED | MED | HIGH | Provider abstraction temperature 0.0 | Daily Provider Conformance Suite |
| **2. Agent** | Self-Reinforcing Bad Hypothesis | HIGH | HIGH | HARD | LOW | MED | Task memory isolates rejected hypotheses | Autonomous Supervisor strategy reset |
| **2. Agent** | Action Loop Oscillation ($A \to B \to A$) | CRITICAL | MED | EASY | LOW | HIGH | Autonomous Supervisor hash cycle check | Merkle state checkpointing |
| **3. Harness** | Daytona State Desynchronization | HIGH | MED | MED | LOW | HIGH | Explicit workspace file writing & check | Checksum heartbeat synchronization |
| **3. Harness** | Unhandled Tool Execution Timeout | HIGH | LOW | EASY | LOW | HIGH | Per-tool execution timeout boundaries | Exponential backoff on supervisor reset |
| **4. Tool/MCP** | Tool Poisoning / Parameter Injection | CRITICAL | MED | HARD | HIGH | LOW | Array-based direct execve command format | Secret scrubbing proxy on outgoing args |
| **4. Tool/MCP** | Unauthenticated MCP Sampling Storm | HIGH | LOW | MED | HIGH | MED | Server-Sent Events stream origin check | Token-bounded sampling quota limits |
| **5. Sandbox** | Daytona Container Escape Exploit | CRITICAL | LOW | HARD | CRITICAL | LOW | Daytona isolated microVM boundaries | Read-only volume mounts during tests |
| **5. Sandbox** | Sandbox Fork Bomb / PID Exhaustion | HIGH | MED | EASY | MED | HIGH | Child process tree termination on exit | Container cgroups RLIMIT_NPROC cap |
| **6. Filesystem** | Path Traversal via Tool Parameters | CRITICAL | LOW | EASY | HIGH | LOW | `path.resolve` checking against project root | Sandbox chroot containment |
| **7. Oracle/Test** | Test Modification / Assertion Muting | CRITICAL | HIGH | EASY | HIGH | MED | Anti-Gaming Sentinel SHA-256 test snapshot | Read-only test filesystem write locks |
| **7. Oracle/Test** | Flaky Reproduction / Timing Glitch | HIGH | MED | MED | LOW | HIGH | Concurrency Perturbation async delay jitter | Staged $N=20-50$ perturbation runs |
| **8. Verification** | Verification Collusion (Shared Model) | CRITICAL | HIGH | VERY HARD | HIGH | LOW | Triple-Lock independent execution gate | Cross-family model routing |
| **8. Verification** | Lucky Pass on Narrow Unit Tests | HIGH | MED | HARD | LOW | MED | Multi-category benchmark runner | Local differential mutation testing |
| **9. Memory** | Cross-Task Context Contamination | HIGH | MED | HARD | LOW | HIGH | Ephemeral `TaskMemoryStore` with clearTask | Tenant namespace salting |
| **10. Human** | Approval Fatigue Rubber-Stamping | HIGH | HIGH | EASY | MED | MED | Single-use HMAC nonce verification | Uncertainty & blast-radius UI render |
| **11. Environment**| Cold JIT Warmup Performance Noise | MED | HIGH | HARD | LOW | HIGH | Discard initial runs; statistical checks | Repeated $N=10$ execution runs |
| **12. Benchmark** | Git History Gold Commit Leakage | HIGH | HIGH | EASY | HIGH | HIGH | Automated benchmark task isolation | Strip git commit logs in eval containers |
| **13. Economics** | Unbounded Token Retry Budget Storm | HIGH | HIGH | EASY | LOW | HIGH | Supervisor 10-attempt cap | Phase-level dollar budgets ($\$2.00$ cap) |
