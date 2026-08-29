# Project: DebugForge

Autonomous AI Debugging Agent Harness built on TrueForge ReAct loop, Daytona Sandboxes, and Qodo Code Review.

## Architecture
- **Monorepo Structure**: npm workspaces containing `packages/core`, `packages/cli`, `packages/web`, and `fixtures/*`.
- **`packages/core` (`@debugforge/core`)**:
  - ReAct reasoning loop (`Think -> Act -> Observe`) with finite state machine (`IDLE`, `INGESTING`, `REPRODUCING`, `TRACING`, `PATCHING`, `VERIFYING`, `HITL_WAITING`, `APPLIED`, `FAILED`).
  - 5 TrueForge-compliant MCP Debug Tools: `ingest_error`, `reproduce_in_sandbox`, `trace_and_analyze`, `auto_patch_and_verify`, `hitl_approval`.
  - Dynamic backward causal tracing engine (AST data-flow graph to isolate infection origin from crash site).
  - Daytona Sandbox runner abstraction (`ISandboxRunner`, `DaytonaSandboxRunner`, `LocalProcessSandboxRunner`).
  - Triple-Lock Differential Verification Engine (Lock 1: failing test passes, Lock 2: full regression suite passes, Lock 3: stress/concurrency test passes).
  - AST-based surgical patch synthesizer.
- **`packages/cli` (`debugforge`)**:
  - React Ink high-performance Terminal UI (`HeaderHUD`, `StreamingThoughtFeed`, `CausalTraceVisualizer`, `UnifiedDiffViewer`, `TripleLockBadgeGrid`, `HITLPrompt`, `FooterStatusBar`).
  - Commander subcommands: `debugforge diagnose [error]`, `debugforge watch`, `debugforge agent "prompt"`.
- **`packages/web` (`@debugforge/web`)**:
  - React 19 + Vite 6 + Tailwind CSS 3.4 responsive landing page & dashboard.
  - Hero banner with 2026 Developer Productivity Paradox statistics (67% AI debugging time, 43% post-test failure rate, 10x MTTR).
  - One-line quick installer section (cURL, PowerShell, npm) with copy-to-clipboard.
  - Visual interactive 5-stage pipeline diagram and live terminal simulator.
  - Competitive comparison matrix vs Cursor, Sentry, SWE-agent.
  - Live incident triage HUD & reproduction stats.
- **`fixtures/`**:
  - `fixtures/null-propagation-api`: Silent null cascade from DB pool timeout crashing order processing.
  - `fixtures/race-condition-app`: Concurrent asynchronous read-modify-write race condition corrupting state.
  - `fixtures/memory-leak-server`: Event-listener & unbounded cache memory leak under load.
- **CI/CD & Deployment**:
  - GitHub Actions CI (`.github/workflows/ci.yml`) incorporating Qodo PR-Agent automated review and test gates.
  - Cross-platform installers (`install.sh`, `install.ps1`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | ReAct Reasoning Loop | State machine (`Think -> Act -> Observe`) with step streaming and cycle limits | M1 | ORIGINAL_REQUEST §R1 |
| F2 | MCP Tool: `ingest_error` | Ingest and parse stack traces, error logs, and failing test outputs into structured diagnostic contexts | M1 | ORIGINAL_REQUEST §R1 |
| F3 | MCP Tool: `reproduce_in_sandbox` | Spin up isolated Daytona workspace (with hermetic local process fallback), execute reproduction command, capture exit codes and logs | M1 | ORIGINAL_REQUEST §R1 |
| F4 | MCP Tool: `trace_and_analyze` | Dynamic backward causal tracing from crash site through propagation chain to infection origin (root cause) | M1 | ORIGINAL_REQUEST §R1 |
| F5 | MCP Tool: `auto_patch_and_verify` | Synthesize surgical AST patches and execute Triple-Lock differential verification (failing test, regression suite, stress test) | M1 | ORIGINAL_REQUEST §R1 |
| F6 | MCP Tool: `hitl_approval` | TrueForge Human-in-the-Loop decision gate ([Apply], [Edit], [Reject]) | M1 | ORIGINAL_REQUEST §R1 |
| F7 | Daytona & Hermetic Sandbox Engine | Sandbox runner abstraction supporting `@daytona/sdk` and isolated local execution | M1 | ORIGINAL_REQUEST §R1 |
| F8 | Commander CLI Subcommands | `debugforge diagnose [error]`, `debugforge watch`, `debugforge agent "prompt"` | M2 | ORIGINAL_REQUEST §R2 |
| F9 | React Ink Terminal UI | Streaming thought feed, unified diff viewer (green/red), causal trace graph visualizer, HUD bar, HITL approval prompt | M2 | ORIGINAL_REQUEST §R2 |
| F10 | CLI Watch Mode Daemon | File watcher monitoring test runs and auto-triggering diagnose on failure | M2 | ORIGINAL_REQUEST §R2 |
| F11 | Fixture 1: `null-propagation-api` | Standalone micro-app with DB pool timeout causing silent null cascade in order processing, with test triggers | M3 | ORIGINAL_REQUEST §R4 |
| F12 | Fixture 2: `race-condition-app` | Standalone micro-app with async read-modify-write race condition corrupting state under concurrency, with test triggers | M3 | ORIGINAL_REQUEST §R4 |
| F13 | Fixture 3: `memory-leak-server` | Standalone micro-app with event listener and cache leak under sustained load, with test triggers | M3 | ORIGINAL_REQUEST §R4 |
| F14 | Web Hero Banner | 2026 Developer Productivity Paradox stats (67% AI debug time, 43% post-test failure rate, 10x MTTR) | M4 | ORIGINAL_REQUEST §R3 |
| F15 | Web Quick Installers | Tabbed one-line installer section (curl bash, PowerShell, npm global) with copy-to-clipboard | M4 | ORIGINAL_REQUEST §R3 |
| F16 | Web 5-Stage Pipeline Diagram | Interactive visual representation of the ReAct debug workflow | M4 | ORIGINAL_REQUEST §R3 |
| F17 | Web Live Terminal Simulator | Interactive simulator demonstrating streaming thoughts, diff view, and HITL gate | M4 | ORIGINAL_REQUEST §R3 |
| F18 | Web Comparison Matrix | Feature comparison vs Cursor, Sentry, SWE-agent | M4 | ORIGINAL_REQUEST §R3 |
| F19 | Root Build & Compilation | Monorepo root `npm run build` and `npm --prefix packages/web run build` compiling cleanly with 0 errors | M5 | ORIGINAL_REQUEST §R5 |
| F20 | Qodo CI/CD Workflow | `.github/workflows/ci.yml` with automated test gates and Qodo PR-Agent review integration | M5 | ORIGINAL_REQUEST §R5 |
| F21 | Cross-Platform Installers | Root `install.sh` and `install.ps1` installer scripts | M5 | ORIGINAL_REQUEST §R5 |
| F22 | Comprehensive E2E Verification | 100% test pass on unit and integration test suite across all packages and fixtures (`npm test`) | M6 (Final) | ORIGINAL_REQUEST §R5 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | E2E Testing Suite Track | Independent test harness, test runner, Tiers 1-4 test cases (`TEST_INFRA.md` -> `TEST_READY.md`) | None | IN_PROGRESS |
| M1 | Core Agent & MCP Debug Tools | `packages/core`: ReAct loop, 5 MCP tools, Daytona sandbox runner, backward causal tracer, AST patcher, Triple-Lock verifier, HITL gate | None | PLANNED |
| M2 | Interactive CLI & Terminal UI | `packages/cli`: React Ink TUI components, Commander subcommands (`diagnose`, `watch`, `agent`), event bridge to core | M1 | PLANNED |
| M3 | Reproducible Bug Fixtures | `fixtures/`: `null-propagation-api`, `race-condition-app`, `memory-leak-server` with automated test scripts and verify triggers | None | PLANNED |
| M4 | Premium Web Landing & Dashboard | `packages/web`: React 19 + Vite 6 + Tailwind CSS landing page, hero paradox stats, terminal simulator, 5-stage diagram, comparison matrix | None | PLANNED |
| M5 | CI/CD, Installers & System Integration | `.github/workflows/ci.yml` (Qodo PR-Agent), `install.sh`, `install.ps1`, root `package.json` build/test scripts, `README.md` | M1, M2, M3, M4 | PLANNED |
| M6 | Final Milestone: E2E Test Pass & Adversarial Hardening | Pass 100% of E2E test suite (Tiers 1-4) + Tier 5 Adversarial Coverage Hardening | M0, M1, M2, M3, M4, M5 | PLANNED |

---

## Interface Contracts

### `packages/core` ↔ `packages/cli`
- **`DebugForgeEngine`**:
  ```typescript
  export interface EngineOptions {
    apiKey?: string;
    daytonaApiKey?: string;
    daytonaServerUrl?: string;
    workspaceRoot?: string;
    sandboxMode?: 'daytona' | 'local' | 'auto';
    maxIterations?: number;
    hitlHandler?: (proposal: PatchProposal) => Promise<HITLDecision>;
    onStepStream?: (step: ReActStep) => void;
  }
  
  export class DebugForgeEngine {
    constructor(options: EngineOptions);
    diagnose(input: DiagnosticInput): Promise<DiagnosticResult>;
    watch(watchPath: string, testCommand: string): AsyncIterableIterator<DiagnosticResult>;
    runAgentLoop(prompt: string): Promise<AgentSessionResult>;
  }
  ```
- **Events & Step Streaming**:
  ```typescript
  export interface ReActStep {
    id: string;
    iteration: number;
    phase: 'THINK' | 'ACT' | 'OBSERVE';
    thought?: string;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    toolOutput?: Record<string, unknown>;
    timestamp: number;
  }
  ```
- **HITL Approval**:
  ```typescript
  export interface PatchProposal {
    patchId: string;
    targetFile: string;
    diff: string;
    explanation: string;
    tripleLockStatus: {
      lock1OriginalPass: boolean;
      lock2RegressionPass: boolean;
      lock3StressPass: boolean;
    };
  }
  export type HITLDecision = 'APPLY' | 'EDIT' | 'REJECT';
  ```

### `packages/core` ↔ `fixtures/*`
- Engine runs reproduction commands in isolated sandboxes against fixtures:
  - `npm test` or `npm start` in fixture directory.
  - Ingests stderr/stdout and stack trace.
  - Applies patch, verifies Lock 1, Lock 2, and Lock 3.

---

## Code Layout
```
c:\Users\priya\Documents\antigravity\modest-planck\
├── .github/
│   └── workflows/
│       └── ci.yml                      # CI workflow with Qodo PR-Agent & test gates
├── fixtures/
│   ├── null-propagation-api/           # DB pool timeout -> silent null order crash
│   │   ├── package.json
│   │   ├── src/
│   │   └── test/
│   ├── race-condition-app/             # Concurrent async read-modify-write race
│   │   ├── package.json
│   │   ├── src/
│   │   └── test/
│   └── memory-leak-server/             # Event listener & unbounded cache leak
│       ├── package.json
│       ├── src/
│       └── test/
├── packages/
│   ├── core/                           # @debugforge/core (ReAct engine, MCP tools, sandbox, tracer, patcher)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── agent/                 # ReAct loop, state machine
│   │   │   ├── tools/                 # 5 MCP debug tools
│   │   │   ├── sandbox/               # Daytona & Local sandbox runner
│   │   │   ├── tracer/                # Dynamic backward causal tracer
│   │   │   ├── patcher/               # AST patch synthesizer & verifier
│   │   │   └── types/                 # Interfaces and contracts
│   │   └── test/
│   ├── cli/                            # debugforge CLI & React Ink TUI
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── bin/
│   │   │   └── debugforge.js
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── cli.ts                 # Commander commands (diagnose, watch, agent)
│   │   │   └── ui/                    # React Ink components (HUD, Feed, Diff, HITL, Trace)
│   │   └── test/
│   └── web/                            # @debugforge/web (React 19 + Vite 6 + Tailwind CSS)
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           └── components/            # Hero, Simulator, Pipeline, Matrix, Install
├── tests/                              # E2E Test Track test harness & tests
│   ├── e2e/
│   ├── runners/
│   └── test-suites/
├── install.sh                          # One-line bash installer
├── install.ps1                         # One-line PowerShell installer
├── package.json                        # Root workspace manifest
├── tsconfig.json                       # Monorepo TypeScript config
└── README.md                           # Documentation & architecture guide
```
