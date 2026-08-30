# 🏛️ DebugForge Next-Generation Architecture (`ARCHITECTURE-NEXT.md`)

> **Target Paradigm**: Robust, Falsifiable, and Anti-Gaming Autonomous Debugging Agent Harness built upon the verified foundation of **TrueForge Agent SDK**, **Standard Model Context Protocol (MCP)**, and **Daytona Sandbox Isolation**.

---

## 1. System Topology & Layered Architecture

DebugForge Next structures the autonomous debugging loop into **9 discrete, contract-gated layers** where no layer can self-certify or bypass downstream verification gates:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Harness & Orchestration                                             │
│ (TrueForge Server, Session/Turn Lifecycle, Adaptive Provider Router)         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Runtime Observation & Log Ingestion                                 │
│ (Structured Stack Demangling, Error Classification, Anomaly Event Capture)  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Causal Analysis & Backward Slice Engine                             │
│ (Crash Site vs. Proximate Cause vs. Infection Origin Differentiation)       │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Bug Reproduction Test (BRT) & MRE Generator                         │
│ (Deterministic BRT Synthesis, Minimal Reproduction Input, Pre-Patch Proof)   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 5: Surgical Patch Synthesis & AST Transpiler                          │
│ (Culprit-Confined Multi-File Unified Diffs, Zero Cosmetic Churn)             │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 6: Anti-Gaming & Protected Artifact Sentinel                           │
│ (SHA-256 Snapshot of Test Trees, Mutation Tamper Detection, Masking Guard)   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 7: Independent Triple-Lock Verification Gate                           │
│ (Lock 1: BRT Pass, Lock 2: Full Regression Suite, Lock 3: Load Invariants)   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 8: Human-in-the-Loop (HITL) Cryptographic Sign-Off                     │
│ (Single-Use HMAC Nonce, Diff Integrity Verification, Safe Disk Mutation)    │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Layer 9: Evaluation & Benchmark Engine (DebugForge-Bench)                    │
│ (Harness vs Model Attribution, Anti-Lucky-Pass Metric Calculation)           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Specifications

### Layer 1: Harness & Orchestration
- **Runtime**: Official `@truefoundry/trueforge` server communicating via `@truefoundry/trueforge-sdk`.
- **Model Agnosticism**: Provider manifests dynamically configured for Google Gemini, Anthropic Claude, OpenAI, DeepSeek/Custom, Together AI, Fireworks, Alibaba, Moonshot, and Zai.
- **Fail-Closed Gate**: Unreachable harness or unconfigured provider keys fail closed immediately.

### Layer 2: Runtime Observation
- Ingests raw terminal dumps, CI build logs, uncaught exceptions, and unhandled promise rejections.
- Normalizes stack traces into structured frames (`filePath`, `lineNumber`, `columnNumber`, `methodName`, `isInternal`).
- Classifies runtime defects (`null_dereference`, `race_condition`, `memory_leak`, `type_error`, `logic_error`, `async_deadlock`).

### Layer 3: Causal Analysis Engine
- Strictly decouples three critical causal entities:
  1. **Crash Site**: Where the runtime threw an unhandled exception or failed an assertion.
  2. **Proximate Cause**: The immediate invalid condition (e.g. `undefined` parameter passed to method).
  3. **Infection Origin**: The historical state mutation or missing guard where bad state was first introduced.
- Emits structured hypothesis trees with evidence confidence scores ($0.0 - 1.0$).

### Layer 4: Bug Reproduction Test (BRT) & Minimal Reproduction Example (MRE)
- **Mandatory Pre-Patch Phase**: An agent cannot propose or accept a patch without first establishing an executable, deterministic BRT.
- **Validity Invariant**:
  $$\text{BRT}(\text{Pre-Patch Code}) \equiv \text{FAIL} \quad \wedge \quad \text{Signature}(\text{Failure}) = \text{Target Bug Signature}$$
- Minimizes reproduction scripts by eliminating irrelevant framework baggage, isolating inputs, and producing reproducible standalone test fixtures.

### Layer 5: Surgical Patch Synthesis
- Confines AST transformations strictly to files identified in the causal infection origin.
- Rejects global formatting, whitespace churn, and gratuitous dependency introductions.

### Layer 6: Anti-Gaming & Protected Artifact Sentinel
- Creates a cryptographic hash index (`Map<filePath, sha256>`) of the test directory and benchmark harness before agent invocation.
- Post-patch integrity audit verifies that:
  1. No existing test files were deleted, weakened, commented out, or bypassed.
  2. No conditional shortcuts (`if (input === 'test_case_1') return expected;`) were synthesized.
  3. No global catch-all exception masking (`try { ... } catch (_) {}`) was injected into test runners.

### Layer 7: Independent Triple-Lock Verification Gate
- Executes in isolated **Daytona Sandbox** environments (`@daytona/sdk`):
  - **Lock 1**: BRT execution against the patched codebase must now exit 0 (Fix Confirmed).
  - **Lock 2**: Existing test suite must execute cleanly with zero newly failing tests (Zero Regression).
  - **Lock 3**: Concurrency / invariant stress load checks must pass without state corruption.

### Layer 8: Human-in-the-Loop (HITL) Gatekeeper
- Generates single-use nonces bound to the SHA-256 hash of the verified patch diff.
- Constant-time HMAC verification (`crypto.timingSafeEqual`).
- Only explicit human operator approval triggers `applyPatch()` to write changes to disk.

### Layer 9: Evaluation & Benchmark Engine (DebugForge-Bench)
- Measures **Verified Resolution Rate (VRR)** and separates **Model Effect** (LLM capability) from **Harness Effect** (scaffolding, BRT generation, anti-gaming rigor).
- Tracks **Lucky Pass Rate (LPR)** to expose accidental or gamed passes.
