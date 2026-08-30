# 🛡️ Adversarial Security Threat Model & Defense Architecture v2 (`research/security-threat-model-v2.md`)

> **Executive Objective**: Define the comprehensive STRIDE adversarial threat model and multi-layered defense architecture for the DebugForge autonomous debugging harness.

---

## 1. STRIDE Threat Modeling Across Harness Boundaries

| Threat Category | Target Subsystem / Asset | Specific Attack Vector | Practical Impact | Multi-Layer Defense in DebugForge |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | MCP Tools & Runtime Handlers | Rogue tool server advertises forged tool schemas (`git_diff`, `read_file`). | Tool shadowing, hijacked execution path. | **AttestMCP / Schema Enforcer**: Strict Zod schema validation, explicit tool registration manifests, and origin checks. |
| **Tampering** | Test Oracles & Test Fixtures | Malicious agent edits test files or wraps assertions in `try/catch` blocks. | False positive passes without fixing real bugs. | **Anti-Gaming Sentinel**: Pre-change SHA-256 baseline snapshots; diff scanner flags `try/catch` and `.skip`; read-only test filesystem locks. |
| **Repudiation** | Action Logs & Approval Decisions | Compromised agent mutates disk without auditable event linkage. | Inability to audit unauthorized file mutations. | **Signed Nonce Journal**: Single-use cryptographic nonces bound to explicit SHA-256 patch hashes with vector timestamps. |
| **Information Disclosure** | Host Environment & Secrets | Indirect prompt injection embedded in dependency README or code comments. | Model exfiltrates `~/.ssh/id_rsa` or `.env` via tool args. | **Secret Scrubbing Proxy**: Regex filtering on all outgoing tool arguments; environment air-gapping during sandbox execution. |
| **Denial of Service** | API Token Budget & Host CPU | Oscillating patch loops ($A \to B \to A$) or infinite test retry loops. | API budget depletion ($1,000+ bills) and worker freeze. | **Autonomous Supervisor**: 3x repeated failure watchdog, state hash oscillation detection, and hard action/token budgets. |
| **Elevation of Privilege** | Host OS & Sandbox Runtimes | Shell command injection via unsanitized tool parameters. | Arbitrary host command execution or container escape. | **Array-Based Execution**: Strict array arguments bypassing shell string interpreters; Daytona isolated OCI microVMs. |

---

## 2. High-Assurance Defense-in-Depth Pipeline

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    DEBUGFORGE DEFENSE-IN-DEPTH PIPELINE                   │
├───────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: Ingress Gateway & Schema Firewall                                │
│  - Strict Zod validation on all MCP JSON-RPC payloads                     │
│  - Parameter metacharacter sanitization (blocking ;, |, &, $())          │
├───────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: Daytona OCI Sandbox Isolation                                    │
│  - Dedicated container runtime with filesystem volume boundaries          │
│  - Air-gapped test execution with network egress restriction              │
├───────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: Anti-Gaming Sentinel & Test Integrity                            │
│  - SHA-256 workspace snapshot capture prior to patch execution            │
│  - AST diff scanner detecting exception swallowing & test skipping        │
├───────────────────────────────────────────────────────────────────────────┤
│ LAYER 4: Independent Triple-Lock Verification                             │
│  - Lock 1: Deterministic failure reproduction & resolution               │
│  - Lock 2: Regression test suite pass                                     │
│  - Lock 3: Targeted perturbation / invariant checks                       │
├───────────────────────────────────────────────────────────────────────────┤
│ LAYER 5: Cryptographic Human-in-the-Loop Gatekeeper                       │
│  - Single-use HMAC nonces with expiration timers                          │
│  - SHA-256 patch hash matching to prevent post-approval tampering         │
└───────────────────────────────────────────────────────────────────────────┘
```
