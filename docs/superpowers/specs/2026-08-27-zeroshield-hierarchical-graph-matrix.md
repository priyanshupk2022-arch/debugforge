# ZEROSHIELD — Institutional Hierarchical Execution Graph Matrix (2000+ Leaf Sub-Nodes DAG)
## Enterprise Master Task & Execution Topology for Autonomous Multi-Agent Swarms
**Project:** ZeroShield (Autonomous Cyber Red-Team & Exploit Immunizer)  
**Standard:** 10/10 Institutional Graph Engineering Runtime (Antigravity 2.0)  
**Date:** 2026-08-27  
**Status:** Canonical Multi-Agent Execution Blueprint (Hardened & Formally Verified)

---

## 🏛️ THE 3 FOUNDATIONAL PILLARS OF GRAPH ENGINEERING

To eliminate non-deterministic LLM loops, ZeroShield's architecture is formally modeled as a **Stateful Executable Directed Graph**:

```
                       ┌────────────────────────────────────────────────────────┐
                       │           SHARED STATE (`ZeroShieldState`)             │
                       │   • Ingested AST AST Tree      • Exploit PoC Traces    │
                       │   • Active Vulnerability Maps  • Patch Diff Candidates │
                       │   • Daytona Sandbox Session    • Lineage Tree History  │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
         ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
         │                                         │                                         │
         ▼                                         ▼                                         ▼
┌──────────────────┐  Fixed Edge       ┌──────────────────┐  Conditional Edge    ┌──────────────────┐
│   AST HUNTER     │ ────────────────► │  RED EXPLOIT     │ ───────────────────► │  BLUE AVO        │
│   (SAST Node)    │                   │  ARENA (Sandbox) │  (If Exploit Proven) │  PATCHER (Agent) │
└──────────────────┘                   └──────────────────┘                      └─────────┬────────┘
                                                                                           │
         ┌─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼ Parallel Fan-Out Edges
┌───────────────────────────────────────┬───────────────────────────────────────┐
│                                       │                                       │
│   Lock 1: Exploit Blockage Probe      │   Lock 2: Golden Inputs Verifier      │
└───────────────────┬───────────────────┴───────────────────┬───────────────────┘
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │ Joined Fan-In Edge (Both Pass)
                                        ▼
                               ┌──────────────────┐
                               │ CRYPTOGRAPHIC    │
                               │ HITL GATE (Human)│
                               └──────────────────┘
```

### 1. Nodes (The Isolated Units of Execution)
Nodes are discrete, bounded units that execute specific sub-tasks. In ZeroShield, nodes belong to 4 distinct execution classes:
* **Specialized LLM Agent Nodes:** 
  - `VulnerabilityHunterAgent`: Scans AST paths and identifies tainted input flows.
  - `RedExploitCrafterAgent`: Generates targeted HTTP/CLI exploit payloads.
  - `BluePatcherAgent`: Applies NVIDIA AVO evolutionary logic to synthesize secure code patches.
  - `SupervisorCriticAgent`: Monitors execution history for stagnation and deadlock patterns.
* **Deterministic Tool Nodes ($0-Token Code):** 
  - `ASTParserNode`: Parses TypeScript/JavaScript into AST trees using TypeScript Compiler API.
  - `LevenshteinComparatorNode`: Calculates textual edit distance between consecutive candidate diffs.
  - `DiffFormatterNode`: Generates unified colored ANSI diffs.
* **Isolated Sandbox Nodes:**
  - `DaytonaProvisionerNode`: Boots ephemeral Linux micro-containers.
  - `SocketReadinessProbeNode`: Polls container ports until target server is online.
  - `ExploitExecutionNode`: Dispatches payloads and captures exfiltration signatures.
  - `TestSuiteRunnerNode`: Executes `npm test` inside the sandbox.
* **Human-in-the-Loop (HITL) Gate Nodes:**
  - `CryptographicApprovalNode`: Freezes graph execution, presents Before/After CVSS score drops and AST diffs, and awaits HMAC-signed human authorization.

---

### 2. Edges & Routing Topology (The Control Paths)
Edges define the exact execution transitions, branch conditions, and data flow between nodes:
* **Fixed Linear Edges ($\to$):** Deterministic sequential transitions (e.g. `ASTParserNode` $\to$ `SinkMatcherNode`).
* **Conditional Branching Edges ($\xrightarrow{\text{condition}}$):**
  - *Exploit Verification Branch:* If `exploitConfirmed === true` $\to$ route to `BlueAgentPatcherNode`; else $\to$ mark as non-exploitable and route to `ReportGeneratorNode`.
  - *Immunization Retry Branch:* If `immunizationPassed === false` and `iteration < 3` $\to$ route back to `BlueAgentPatcherNode`.
  - *Supervisor Backtrack Branch:* If `cyclicLoopDetected === true` $\to$ force-route back to previous clean parent node in the Lineage DAG.
* **Parallel Fan-Out Edges ($\rightrightarrows$):** Concurrent non-blocking execution (e.g. firing `Lock 1 (Exploit Blockage Probe)` and `Lock 2 (Golden Inputs Verifier)` in parallel to cut verification latency by 50%).
* **Joined Fan-In Edges ($\rightleftarrows$):** Synchronizing and merging parallel branches into a unified assertion record before proceeding to the HITL gate.

---

### 3. Shared State (`ZeroShieldState` — The Central Memory Bus)
The single source of truth that travels along all edges. Every node reads from and writes to this typed state:

```typescript
export interface ZeroShieldState {
  // 1. Session & Target Context
  sessionId: string;
  targetRepoPath: string;
  targetGitBranch: string;
  startTime: number;

  // 2. AST & Vulnerability State
  astProjectRef: unknown;
  discoveredSinks: VulnerabilityReport[];
  activeVulnerabilityIndex: number;

  // 3. Daytona Sandbox State
  daytonaSandboxId?: string;
  sandboxPort?: number;
  sandboxReady: boolean;
  activeExploitPoC?: {
    payload: Record<string, unknown>;
    capturedProofSignature: string;
    verifiedAt: number;
  };

  // 4. AVO Patch & Evolution Lineage
  currentPatchIteration: number;
  maxIterations: number;
  candidatePatches: SecurityPatchNode[];
  lineageDAG: {
    nodes: Map<string, SecurityPatchNode>;
    committedPath: string[];
    deadEndNodes: string[];
  };

  // 5. Triple-Lock Verification State
  verificationResults?: {
    lock1ExploitBlocked: boolean;
    lock2GoldenInputsPassed: boolean;
    lock3UnitTestsPassed: boolean;
    compositeScore: number;
  };

  // 6. HITL & PR Delivery State
  hitlApprovalToken?: string;
  hitlStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  generatedPullRequestUrl?: string;
  qodoReviewStatus?: 'PENDING' | 'PASSED' | 'ACTION_REQUIRED';
}
```

---

## 🗺️ MASTER EXECUTION TOPOLOGY & 13 DOMAIN CLUSTERS (2000+ LEAF SUB-NODES)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│              ZEROSHIELD HIERARCHICAL GRAPH (13 CLUSTERS & 2000+ SUB-NODES)                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • Cluster 1: Monorepo Foundation & Universal Type Schemas (N_1.0 - N_1.160)                      │
│ • Cluster 2: AST Security Analysis & Vulnerability Hunter (N_2.0 - N_2.180)                      │
│ • Cluster 3: Red Agent Ephemeral Arena & Daytona Sandboxing (N_3.0 - N_3.200)                    │
│ • Cluster 4: Blue Agent NVIDIA AVO Patching & Repair Engine (N_4.0 - N_4.220)                    │
│ • Cluster 5: Triple-Lock Immunization Assertion & Verifier (N_5.0 - N_5.160)                     │
│ • Cluster 6: Out-of-Band Supervisor & Loop Breaker (N_6.0 - N_6.140)                             │
│ • Cluster 7: TrueForge MCP Tool Server & SDK Integration (N_7.0 - N_7.160)                       │
│ • Cluster 8: Cryptographic Human-in-the-Loop (HITL) Gate (N_8.0 - N_8.140)                       │
│ • Cluster 9: Vulnerable Target Applications & Fixtures (N_9.0 - N_9.150)                         │
│ • Cluster 10: Interactive Hacker-Grade CLI TUI (@zeroshield/cli) (N_10.0 - N_10.180)             │
│ • Cluster 11: Web Security Command Center (@zeroshield/web) (N_11.0 - N_11.200)                  │
│ • Cluster 12: 4-Tier Test Gates & Anti-Cheat Suite (N_12.0 - N_12.180)                           │
│ • Cluster 13: CI/CD, Qodo Review Trail & Hackathon Submission (N_13.0 - N_13.120)                │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Detailed Cluster Decompositions

#### CLUSTER 1: Foundation, Workspace & Shared Type Contracts (`N_1.0` - `N_1.160`)
* `N_1.1.1` - `N_1.1.40`: Monorepo root `package.json`, workspaces (`packages/core`, `packages/cli`, `packages/web`), `tsconfig.json` with strict ES2022 NodeNext settings.
* `N_1.2.1` - `N_1.2.60`: Type schemas for `ZeroShieldState`, `VulnerabilityReport`, `SecurityPatchNode`, `SecuritySupervisorAlert`.
* `N_1.3.1` - `N_1.3.60`: Core error hierarchy, diff formatting, and zero-token deterministic data plumbing.

#### CLUSTER 2: AST Security Analysis & Vulnerability Hunter (`N_2.0` - `N_2.180`)
* `N_2.1.1` - `N_2.1.50`: TypeScript Compiler API project context builder & recursive node visitor.
* `N_2.2.1` - `N_2.2.70`: Sink matchers for CWE-78 (Command Injection), CWE-1321 (Prototype Pollution), and CWE-287 (Broken Auth / JWT).
* `N_2.3.1` - `N_2.3.60`: Exploit template generation & golden legitimate input synthesis.

#### CLUSTER 3: Red Agent Ephemeral Exploit Arena & Daytona Sandboxing (`N_3.0` - `N_3.200`)
* `N_3.1.1` - `N_3.1.60`: `@daytonaio/sdk` container orchestration with isolated process limits.
* `N_3.2.1` - `N_3.2.40`: `SocketReadinessProbe` dynamic port sniffer with sub-50ms health polling.
* `N_3.3.1` - `N_3.3.60`: HTTP/CLI payload dispatcher, exfiltration proof capture (`root:x:0:0`), and 0% false positive emission.
* `N_3.4.1` - `N_3.4.40`: Local Docker/Process fallback runner for instant offline video recording.

#### CLUSTER 4: Blue Agent NVIDIA AVO Patching & Repair Engine (`N_4.0` - `N_4.220`)
* `N_4.1.1` - `N_4.1.60`: 5-step AVO loop (`Inspect` $\to$ `Plan` $\to$ `Act` $\to$ `Evaluate` $\to$ `Repeat`).
* `N_4.2.1` - `N_4.2.80`: AST patchers injecting `execFile` parameter arrays, Zod schemas, and `jwt.verify`.
* `N_4.3.1` - `N_4.3.80`: Lineage DAG persistence and negative constraint distillation.

#### CLUSTER 5: Triple-Lock Immunization Assertion & Verifier (`N_5.0` - `N_5.160`)
* `N_5.1.1` - `N_5.1.50`: Parallel Lock 1 (Assert exploit blocked: HTTP 400/403).
* `N_5.2.1` - `N_5.2.50`: Parallel Lock 2 (Assert golden legitimate inputs pass: HTTP 200 OK).
* `N_5.3.1` - `N_5.3.60`: Joined Lock 3 (Assert repository test suite: Exit Code 0).

#### CLUSTER 6: Out-of-Band Supervisor & Loop Breaker (`N_6.0` - `N_6.140`)
* `N_6.1.1` - `N_6.1.50`: Levenshtein distance deadlock detection on consecutive diffs.
* `N_6.2.1` - `N_6.2.50`: Score plateau detection forcing backtrack to parent DAG node.
* `N_6.3.1` - `N_6.3.40`: Hard limit $N = 3$ terminating runaway iterations.

#### CLUSTER 7: TrueForge MCP Tool Server & SDK Integration (`N_7.0` - `N_7.160`)
* `N_7.1.1` - `N_7.1.60`: MCP tools (`zeroshield_sast_scan`, `zeroshield_daytona_exploit`, `zeroshield_avo_patch`).
* `N_7.2.1` - `N_7.2.50`: SQLite session store with WAL mode for audit trail persistence.
* `N_7.3.1` - `N_7.3.50`: DeepSeek-style Code Mode batching script orchestrator.

#### CLUSTER 8: Cryptographic Human-in-the-Loop (HITL) Gate (`N_8.0` - `N_8.140`)
* `N_8.1.1` - `N_8.1.50`: State machine gate (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`).
* `N_8.2.1` - `N_8.2.50`: Visual AST diff generator and CVSS score drop calculator (9.8 $\to$ 0.0).
* `N_8.3.1` - `N_8.3.40`: GitHub feature branch creator and PR dispatcher.

#### CLUSTER 9: Vulnerable Target Applications & Fixtures (`N_9.0` - `N_9.150`)
* `N_9.1.1` - `N_9.1.50`: Command Injection Payment API fixture with test suite.
* `N_9.2.1` - `N_9.2.50`: Prototype Pollution Config Loader fixture with test suite.
* `N_9.3.1` - `N_9.3.50`: Broken Auth JWT Microservice fixture with test suite.

#### CLUSTER 10: Interactive Hacker-Grade CLI TUI (`packages/cli`) (`N_10.0` - `N_10.180`)
* `N_10.1.1` - `N_10.1.40`: Commander CLI routing and flag parser (`--auto-patch`, `--offline`).
* `N_10.2.1` - `N_10.2.70`: Animated ASCII radar scan and streaming Daytona container logs.
* `N_10.3.1` - `N_10.3.70`: Interactive terminal diff review and `[Y/N]` approval prompts.

#### CLUSTER 11: Web Security Command Center (`packages/web`) (`N_11.0` - `N_11.200`)
* `N_11.1.1` - `N_11.1.50`: Obsidian dark-theme React dashboard with Tailwind CSS.
* `N_11.2.1` - `N_11.2.50`: Radial CVSS risk gauge (9.8 Critical $\to$ 0.0 Clean).
* `N_11.3.1` - `N_11.3.50`: Red/Blue split-terminal visualizer with real-time payload traces.
* `N_11.4.1` - `N_11.4.50`: 1-Click HITL approval modal and Qodo PR review badge.

#### CLUSTER 12: 4-Tier Test Gates & Anti-Cheat Suite (`N_12.0` - `N_12.180`)
* `N_12.1.1` - `N_12.1.50`: Tier 1 Unit tests (`scanner.test.ts`, `patcher.test.ts`, `hitl.test.ts`).
* `N_12.2.1` - `N_12.2.50`: Tier 2 E2E integration tests against all 3 vulnerable fixtures.
* `N_12.3.1` - `N_12.3.40`: Tier 3 Adversarial evasion tests (obfuscated injection vectors).
* `N_12.4.1` - `N_12.4.40`: Tier 4 Concurrency and sandbox stress tests.

#### CLUSTER 13: CI/CD, Qodo Review Trail & Hackathon Submission (`N_13.0` - `N_13.120`)
* `N_13.1.1` - `N_13.1.40`: GitHub Actions CI pipeline running lint, build, and 4-tier test suites.
* `N_13.2.1` - `N_13.2.40`: Automated Qodo review verification script (`npm run qodo:verify`).
* `N_13.3.1` - `N_13.3.40`: Master README documentation with architecture diagrams and video assets.
