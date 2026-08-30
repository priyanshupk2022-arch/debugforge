# 📜 Authoritative Implementation Specification (`research/IMPLEMENTATION-READY-SPEC.md`)

> **The Definitive Engineering Blueprint for DebugForge**: Fully synthesized from the Three-Report Research Synthesis, Independent Literature Validation, Skeptical Limitation Analysis, and Repository Audits.

---

## 1. System Architecture & Topology

DebugForge operates across **6 Decoupled Planes**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    DEBUGFORGE ARCHITECTURAL TOPOLOGY                      │
├───────────────────────────────────────────────────────────────────────────┤
│ 1. CONTROL & ORCHESTRATION PLANE                                          │
│    - TrueForge official SDK client runtime (@truefoundry/trueforge)       │
│    - Session management, SSE turn streaming, and approval state machines │
├───────────────────────────────────────────────────────────────────────────┤
│ 2. INTELLIGENCE & PROVIDER PLANE                                          │
│    - Provider-agnostic model router (Anthropic, OpenAI, Google, Ollama)   │
│    - Strict schema validation, temperature 0.0, fail-closed credentials   │
├───────────────────────────────────────────────────────────────────────────┤
│ 3. TOOL & MCP PLANE                                                       │
│    - Streamable HTTP/SSE MCP server exposing 5 core diagnostics tools:     │
│      • debugforge_ingest_error                                            │
│      • debugforge_analyze_trace                                           │
│      • debugforge_reproduce                                               │
│      • debugforge_auto_patch                                              │
│      • debugforge_verify_fix                                              │
├───────────────────────────────────────────────────────────────────────────┤
│ 4. EXECUTION & SANDBOX PLANE                                              │
│    - Daytona TypeScript SDK runner managing isolated OCI microVMs         │
│    - Execution timeouts, child process cleanup, and air-gapped test modes │
├───────────────────────────────────────────────────────────────────────────┤
│ 5. CAUSALITY, REPRODUCTION & VERIFICATION PLANE                           │
│    - Task Memory Store + Autonomous Supervisor Watchdog                   │
│    - Causal Provenance Engine + Runtime Probe Manager                     │
│    - Dual-Gated BRT Engine + Unified Variation Operator                   │
│    - Anti-Gaming Sentinel + Concurrency Schedule Perturbation             │
├───────────────────────────────────────────────────────────────────────────┤
│ 6. GOVERNANCE & HITL GATEWAY                                              │
│    - Single-use HMAC nonces, patch hash matching, and replay protection   │
│    - Phase-level financial ($2.00 cap) and action budget circuit breakers │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Interfaces & Type Contracts

```typescript
// Task Memory
export interface TaskMemoryEntry {
  taskId: string;
  runId: string;
  verifiedFacts: string[];
  rejectedHypotheses: Array<{
    hypothesisId: string;
    description: string;
    targetFile: string;
    rejectedReason: string;
    timestamp: string;
  }>;
  attemptHistory: Array<{
    attemptNumber: number;
    mutationSummary: string;
    patchHash: string;
    verificationResult: "PASS" | "FAIL";
    timestamp: string;
  }>;
}

// Autonomous Supervisor
export interface TrajectoryAnomaly {
  type: "REPEATED_FAILURE" | "OSCILLATING_EDITS" | "STAGNANT_PROGRESS" | "EXCESSIVE_RETRIES";
  severity: "HIGH" | "CRITICAL";
  details: string;
  recommendedAction: "STRATEGY_RESET" | "ROLLBACK_CHECKPOINT" | "EXPAND_SEARCH_RADIUS";
}

// Variation Operator
export interface CodeMutation {
  mutationId: string;
  type: "insert" | "replace" | "delete" | "guard_insertion" | "refactor" | "rollback";
  filePath: string;
  startLine: number;
  endLine: number;
  originalCode: string;
  replacementCode: string;
  beforeHash: string;
  afterHash: string;
  reason: string;
  rollbackMetadata?: { originalContent: string };
}

// Causal Provenance Graph
export interface CausalProvenanceGraph {
  rootDefectCategory: string;
  crashSite: CausalNode;
  proximateCause: CausalNode;
  infectionOrigin: CausalNode;
  propagationPath: CausalNode[];
  overallConfidence: number;
  evidenceSummary: string;
}

// BRT Validation Report
export interface BRTValidationReport {
  isValid: boolean;
  stage: "pre-patch" | "post-patch";
  exitCode: number;
  stdout: string;
  stderr: string;
  matchedSignature: boolean;
  failureReason?: string;
}
```

---

## 3. Seven Execution States & State Machine

```
STATE_IDLE 
  ➔ STATE_REPRODUCING (Synthesize BRT Candidate; Validate Pre-Patch Non-Zero Exit)
  ➔ STATE_ISOLATING_RCA (Trace Stack Frames; Decouple Crash Site from Origin)
  ➔ STATE_SYNTHESIZING_PATCH (Line-Bounded AST Mutation with Rollback Metadata)
  ➔ STATE_VERIFYING (Independent Triple-Lock: Post-Patch BRT + Regression + Anti-Gaming)
       ├─ [Lock Fails] ──> Autonomous Supervisor ──> Checkpoint Rollback / Strategy Reset
       └─ [Locks Pass] ──> STATE_HUMAN_GATE (Cryptographic HMAC Nonce + Diff Review)
                             ➔ STATE_RESOLVED (Patch Applied to Target Repo; Trace Logged)
```

---

## 4. Triple-Lock Verification Gates

1. **Lock 1 (BRT Resolution Gate)**:
   - Bug reproduction script executed against patched workspace MUST exit with code 0 and emit `[BRT_EXECUTION_PASS]`.
2. **Lock 2 (Regression Gate)**:
   - Existing repository test suite executed against patched workspace MUST pass 100% with zero regressions.
3. **Lock 3 (Anti-Gaming & Invariant Gate)**:
   - Pre-change test tree SHA-256 hashes must match (zero unauthorized test edits).
   - Unified diff scanner must confirm zero `try/catch` exception masking or `.skip` test skips.

---

## 5. Phase-Level Financial & Action Circuit Breakers

- **Ingress & RCA Localization**: Max $\$0.30$ USD (50,000 tokens / 10 tool calls).
- **Patch Synthesis**: Max $\$1.00$ USD (150,000 tokens / 10 attempts).
- **Verification & Mutation**: Max $\$0.70$ USD (100,000 tokens / 5 test runs).
- **Total Session Cap**: Max **$\$2.00$ USD / 300,000 tokens / 25 total steps**.
- **Action Cycle Detector**: 3 consecutive identical failures or alternating patch hash cycles ($A \to B \to A$) trigger an immediate hard stop and rollback to the baseline checkpoint.

---

## 6. Implementation & Verification Sequence

```
Step 1: Ingress & Error Extraction
  └── Parse error logs, stack frames, and unhandled promise rejections into ErrorReport.

Step 2: Causal Provenance & Slicing
  └── Reconstruct Causal Provenance Graph; decouple Crash Site from Infection Origin.

Step 3: Deterministic BRT Synthesis & Pre-Patch Gate
  └── Generate minimal reproduction test; execute pre-patch and assert failure with signature match.

Step 4: Surgical Line Mutation
  └── Synthesize line-bounded AST mutation via Variation Operator; record before/after SHA-256 hashes.

Step 5: Independent Triple-Lock Verification
  └── Execute post-patch BRT (Lock 1), regression suites (Lock 2), and Anti-Gaming scan (Lock 3).

Step 6: Cryptographic Human Sign-Off
  └── Generate single-use HMAC nonce; require human operator approval of unified diff and blast radius.

Step 7: Disk Commit & Telemetry Archival
  └── Apply patch permanently to target directory; record verified facts to TaskMemoryStore.
```

---

## 7. Definition of Completion

1. **Build Quality**: Clean monorepo compile (`npm run build:all`) with 0 TypeScript/ESLint errors across packages.
2. **Test Quality**: 100% test pass rate across all 6 test suites (`npm test`).
3. **Benchmark Quality**: 100% Verified Resolution Rate on DebugForge-Bench v0 (`npm run bench`).
4. **Live E2E Quality**: 100% pass on real TrueForge SSE turn and tool invocation streaming (`npm run test:live`).
5. **Zero Speculative Inventions**: No fake credentials, no mock passes, and no unsupported vendor locks.
