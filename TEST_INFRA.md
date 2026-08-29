# DebugForge: E2E Test Infrastructure & Opaque-Box Test Methodology

**Document Version:** 1.0.0  
**Project:** DebugForge (Autonomous AI Debugging Agent Harness)  
**Author:** Test Writer (M0 E2E Test Suite Engineer)  
**Target Root:** `c:\Users\priya\Documents\antigravity\modest-planck`

---

## 1. Executive Summary & Testing Philosophy

DebugForge is an autonomous AI debugging agent harness that reproduces, diagnoses via backward causal tracing, and auto-heals runtime bugs inside isolated Daytona sandboxes.

The **DebugForge Test Infrastructure** is engineered on strict **opaque-box testing principles**. Tests evaluate system behavior, contract conformity, differential state transformations, and observable outputs (exit codes, structured JSON payloads, AST unified diffs, terminal streams, and web component contracts) without coupling to internal private implementation details.

### Core Testing Pillars:
1. **Opaque-Box Verification**: All assertions evaluate public interfaces, CLI commands, MCP tool contracts, file-system transformations, and HTTP/DOM fixtures.
2. **Deterministic Oracles**: Expected outputs are derived from authoritative specifications (`PROJECT.md`, `ORIGINAL_REQUEST.md`), standard AST grammar rules, and mathematical invariance properties (e.g. balance $\ge 0$, listener count $= 0$, triple-lock exit codes).
3. **4-Tier Test Pyramid**:
   - **Tier 1 (Feature Coverage)**: $\ge 5$ discrete, comprehensive tests per feature (F1 through F22) yielding $\ge 110$ foundational feature tests.
   - **Tier 2 (Boundary & Corner Cases)**: Empty payloads, malformed stack traces, circular causal loops, execution timeouts, Unicode/special escaping, and sandbox failures.
   - **Tier 3 (Cross-Feature Integration)**: Multi-stage workflows combining Error Ingestion $\to$ Sandbox Reproduction $\to$ Backward Causal Tracing $\to$ AST Patch Synthesis $\to$ Triple-Lock Verification $\to$ HITL Approval Gate $\to$ CLI/TUI Streaming.
   - **Tier 4 (Real-World Application Scenarios)**: Full end-to-end auto-healing of real micro-apps (`null-propagation-api`, `race-condition-app`, `memory-leak-server`, and multi-file cascade systems).
4. **Hermetic & Dual-Mode Execution**: Tests operate seamlessly in both isolated mock/oracle mode (enabling milestone verification during development) and live binary/package mode.
5. **Zero-Flakiness Guarantee**: Isolated temporary worktrees, scrubbed process environments, deterministic mock timers, and bounded concurrency.

---

## 2. 4-Tier Test Architecture Matrix

```
                      ┌──────────────────────────────────────┐
                      │               TIER 4                 │
                      │   Real-World Micro-App Auto-Healing  │
                      │  (Null Cascade, Race Mutex, Leaks)   │
                      └──────────────────┬───────────────────┘
                                         │
                      ┌──────────────────▼───────────────────┐
                      │               TIER 3                 │
                      │   Cross-Feature Integration Workflows│
                      │ (Ingest ➔ Sandbox ➔ Trace ➔ Lock ➔ HITL) │
                      └──────────────────┬───────────────────┘
                                         │
                      ┌──────────────────▼───────────────────┐
                      │               TIER 2                 │
                      │   Boundary, Stress & Malformed Cases │
                      │ (Timeouts, OOM, Circular DAGs, Esc)  │
                      └──────────────────┬───────────────────┘
                                         │
                      ┌──────────────────▼───────────────────┐
                      │               TIER 1                 │
                      │   Feature Coverage (F1 to F22)       │
                      │    (>= 5 tests per feature)          │
                      └──────────────────────────────────────┘
```

### 2.1 Tier 1: Feature Coverage Matrix (F1 – F22)

| Feature ID | Feature Name | Minimum Target | Test Suite File | Focus Areas |
|---|---|---|---|---|
| **F1** | ReAct Reasoning Loop | 5 tests | `tests/tier1-features/f01-react-loop.test.js` | Think-Act-Observe state machine, transition order, iteration budget, cycle limit abort, step event emissions |
| **F2** | MCP Tool: `ingest_error` | 5 tests | `tests/tier1-features/f02-ingest-error.test.js` | Node/V8 stack trace parser, Jest/Vitest output parsing, file frame resolution, context line extraction, structured payload schema |
| **F3** | MCP Tool: `reproduce_in_sandbox` | 5 tests | `tests/tier1-features/f03-reproduce-sandbox.test.js` | Daytona workspace launch, local process fallback, exit code capture, stderr log matching, failure reproduction assertion |
| **F4** | MCP Tool: `trace_and_analyze` | 5 tests | `tests/tier1-features/f04-trace-analyze.test.js` | AST backward data-flow traversal, crash site vs infection origin blame, causal DAG structure, ASCII DAG rendering, confidence scoring |
| **F5** | MCP Tool: `auto_patch_and_verify` | 5 tests | `tests/tier1-features/f05-auto-patch-verify.test.js` | Surgical AST patch synthesis, unified diff formatting, Lock 1 (failing test pass), Lock 2 (regression pass), Lock 3 (stress pass) |
| **F6** | MCP Tool: `hitl_approval` | 5 tests | `tests/tier1-features/f06-hitl-approval.test.js` | APPLY, EDIT, REJECT, EXPLAIN decision handlers, state mutation, feedback storage, auto-approve flag |
| **F7** | Daytona & Hermetic Sandbox Engine | 5 tests | `tests/tier1-features/f07-sandbox-engine.test.js` | `ISandboxRunner` interface, workspace creation/teardown, file read/write isolation, execution timeouts, env var sanitization |
| **F8** | Commander CLI Subcommands | 5 tests | `tests/tier1-features/f08-cli-commands.test.js` | `diagnose`, `watch`, `agent` command dispatch, CLI flags parsing (`--test`, `--workspace`, `--sandbox`, `--yes`, `--max-steps`), help/version output |
| **F9** | React Ink Terminal UI | 5 tests | `tests/tier1-features/f09-terminal-ui.test.js` | HeaderHUD, StreamingThoughtFeed, CausalTraceVisualizer, UnifiedDiffViewer, TripleLockBadgeGrid, HITLPrompt, FooterStatusBar rendering |
| **F10** | CLI Watch Mode Daemon | 5 tests | `tests/tier1-features/f10-watch-mode.test.js` | File watcher triggering, debouncing rapid edits, auto-invoking diagnosis on test failure, recovery on fix, graceful stop |
| **F11** | Fixture 1: `null-propagation-api` | 5 tests | `tests/tier1-features/f11-fixture-null-api.test.js` | DB pool timeout simulation, null order cascade crash, deterministic test failure, AST patch application, post-patch 100% test pass |
| **F12** | Fixture 2: `race-condition-app` | 5 tests | `tests/tier1-features/f12-fixture-race-condition.test.js` | Async read-modify-write race, double-spend negative balance reproduction, concurrency stress test, mutex wrapping, post-patch test pass |
| **F13** | Fixture 3: `memory-leak-server` | 5 tests | `tests/tier1-features/f13-fixture-memory-leak.test.js` | Event listener leak & unbounded cache, MaxListenersExceeded reproduction, listener count assertion, cleanup patch verification |
| **F14** | Web Hero Banner | 5 tests | `tests/tier1-features/f14-web-hero-banner.test.js` | 2026 Developer Productivity Paradox metrics (67% AI debugging, 43% post-test failure, 10x MTTR), typography, CTA actions, responsive layout |
| **F15** | Web Quick Installers | 5 tests | `tests/tier1-features/f15-web-quick-install.test.js` | Tabbed selector (cURL bash, PowerShell, npm, npx), copy-to-clipboard functionality, script URL accuracy, snippet syntax styling |
| **F16** | Web 5-Stage Pipeline Diagram | 5 tests | `tests/tier1-features/f16-web-pipeline-diagram.test.js` | 5 pipeline stages visualization, stage metadata schemas, interactive inspection drawer, JSON parameter sample display |
| **F17** | Web Live Terminal Simulator | 5 tests | `tests/tier1-features/f17-web-terminal-simulator.test.js` | Interactive CLI emulator, scenario selector (Null, Race, Leak), streaming thought feed, unified diff view, HITL action buttons |
| **F18** | Web Comparison Matrix | 5 tests | `tests/tier1-features/f18-web-comparison-matrix.test.js` | Matrix data vs Cursor, Sentry, SWE-agent, capability checkmarks, feature row categorization, tooltip descriptions |
| **F19** | Root Build & Compilation | 5 tests | `tests/tier1-features/f19-build-compilation.test.js` | Root `npm run build`, `packages/web` build, TypeScript composite project references, tsconfig declarations, zero compile errors |
| **F20** | Qodo CI/CD Workflow | 5 tests | `tests/tier1-features/f20-ci-cd-workflow.test.js` | `.github/workflows/ci.yml` syntax, security audit step, secret scan step, anti-cheat AST gate, Qodo PR-Agent action config |
| **F21** | Cross-Platform Installers | 5 tests | `tests/tier1-features/f21-installers.test.js` | `install.sh` syntax & Node version checks, `install.ps1` syntax & execution, fallback binary resolution, help text display |
| **F22** | Comprehensive E2E Verification | 5 tests | `tests/tier1-features/f22-comprehensive-e2e.test.js` | Full workspace sanity, cross-package exports, zero placeholder stubs, end-to-end integration test execution |

---

### 2.2 Tier 2: Boundary & Corner Cases

- **Empty / Malformed Inputs**: Empty log strings, missing stack traces, corrupted error strings, unparseable JSON frames.
- **Timeouts & Deadlocks**: Long-running tests hitting timeout limits, hanging child processes, unhandled promise hangs.
- **Circular Causal Graphs**: Recursive function calls, cyclic symbol references, self-referencing prototype mutations.
- **Escaping & Character Encoding**: ANSI escape sequences, control characters, Windows CRLF vs Unix LF, Unicode emojis in logs, path traversal characters.
- **Sandbox Failures & Resource Limits**: Read-only directories, failed container creation, out-of-memory limits, missing reproduction commands.

---

### 2.3 Tier 3: Cross-Feature Integration Workflows

- **Pipeline Ingestion to HITL Approval**: `ingest_error` $\to$ `reproduce_in_sandbox` $\to$ `trace_and_analyze` $\to$ `auto_patch_and_verify` $\to$ `hitl_approval`.
- **CLI Bridge to Core Engine**: Commander CLI dispatching options into `DebugForgeEngine`, streaming step events to React Ink TUI, handling interactive user keystrokes.
- **Triple-Lock Verification Protocol**: Sequential execution of Lock 1 (reproduction test) $\to$ Lock 2 (regression suite) $\to$ Lock 3 (concurrency/stress load test).
- **Watch Mode Continuous Loop**: File change event $\to$ Debounce $\to$ Trigger reproduction $\to$ Auto-patch $\to$ Verify $\to$ Idle state.

---

### 2.4 Tier 4: Real-World Micro-App Auto-Healing

- **Scenario 1 (Null Propagation Cascade)**:
  - Database pool exhaustion returns null connection.
  - Inventory returns null item.
  - Pricing returns undefined total.
  - Order processor crashes on `order.pricing.total.toFixed(2)`.
  - DebugForge pinpoints `pool.ts:24` as origin, generates null-coalescing and retry AST patch, verifies with Triple-Lock.
- **Scenario 2 (Async Race Condition)**:
  - Concurrent balance withdrawals on $100 balance.
  - Read-modify-write interleaved across async ticks results in -$900 double spend.
  - DebugForge pinpoints `account.ts:18`, injects `AsyncMutex` serialization lock, verifies 100 concurrent requests never drop balance below zero.
- **Scenario 3 (Unbounded Memory Leak)**:
  - Unregistered event listeners and unbounded telemetry cache map.
  - Sustained load creates 1,000 dangling listener functions.
  - DebugForge pinpoints `session.ts:22`, injects cleanup handler / listener removal, verifies listener count drops to 0.
- **Scenario 4 (Multi-File Full Lifecycle Auto-Healing)**:
  - Complex microservice with shared middleware, repository, and controller files.
  - Complete autonomous ingestion, diagnosis, AST repair, and differential verification.

---

## 3. Test Harness Architecture & Oracle Specifications

The test harness located in `tests/harness/` provides:
1. **Contract Definitions & Zod Schemas (`contracts.js`)**: Authoritative schemas for `ParsedErrorPayload`, `SandboxExecutionResult`, `CausalTraceGraph`, `PatchVerificationResult`, `HITLResponse`, `ReActStep`, and `AgentSessionState`.
2. **Mock & Oracle Reference Engine (`mock-engine.js`)**: Reference implementation modeling the exact ReAct state machine, AST backward tracer, Triple-Lock engine, and MCP tool handlers.
3. **Hermetic Sandbox Runner (`sandbox-mock.js`)**: Isolated in-process and temporary scratch directory sandbox runner with exit code emulation, execution timeouts, and file synchronization.
4. **Test Utilities & Custom Assertions (`test-utils.js`)**:
   - `assertZodValid(schema, data)`: Contract validation assertion.
   - `assertUnifiedDiffValid(diff)`: Unified diff structure verifier.
   - `assertCausalDAGValid(graph)`: Graph integrity and topological order verifier.
   - `stripAnsi(text)`: ANSI color stripper for terminal output testing.
   - `createTempWorkspace(files)`: Hermetic temporary directory generator with automatic cleanup.

---

## 4. Test Execution Guide

### 4.1 Running the Full Test Suite
```bash
# Execute custom automated test runner across all 4 tiers
node tests/run-all-tests.js

# Or run with Node.js native test runner
node --test tests/**/*.test.js
```

### 4.2 Running Specific Test Tiers
```bash
# Run Tier 1 Feature tests only
node tests/run-all-tests.js --tier 1

# Run Tier 2 Boundary & Corner cases
node tests/run-all-tests.js --tier 2

# Run Tier 3 Integration Pipelines
node tests/run-all-tests.js --tier 3

# Run Tier 4 Real-World Micro-Apps
node tests/run-all-tests.js --tier 4
```

### 4.3 Filtering by Feature or Name
```bash
# Run specific feature tests (e.g. F01 ReAct loop or F11 Null API)
node tests/run-all-tests.js --filter f01
node tests/run-all-tests.js --filter f11
```

---

## 5. Anti-Flakiness & Isolation Guidelines

- **Workspace Hermeticity**: Every test creating or mutating files MUST use `createTempWorkspace()` and clean up in a `finally` block or `afterEach` hook.
- **Port Allocation**: Web and server tests MUST dynamically allocate ephemeral ports (port 0) to avoid `EADDRINUSE` conflicts during parallel test runs.
- **Process Cleanup**: Any spawned child processes must register `SIGTERM`/`SIGKILL` cleanup handlers.
- **Deterministic Assertions**: Do NOT assert on wall-clock execution duration; assert on exit codes, structural state, and data invariance.

---

## 6. Progressive Testability Roadmap across Milestones

| Milestone | Active Tiers Verified | Test Target |
|---|---|---|
| **M0** | Tiers 1-4 against Test Harness Oracles & Spec Schemas | Verify test harness, contracts, runner, and all test suites pass with 100% exit code 0 |
| **M1** | Tier 1 (F1-F7), Tier 2, Tier 3 against `packages/core` | Validate ReAct loop, 5 MCP tools, Daytona/Local sandbox, causal tracer, AST patcher, Triple-Lock |
| **M2** | Tier 1 (F8-F10), Tier 3 against `packages/cli` | Validate Commander subcommands, React Ink components, Watch daemon |
| **M3** | Tier 1 (F11-F13), Tier 4 against `fixtures/*` | Validate reproducible failures on micro-apps and auto-repair pipelines |
| **M4** | Tier 1 (F14-F18) against `packages/web` | Validate landing page components, hero stats, terminal simulator, matrix |
| **M5** | Tier 1 (F19-F21) against build, CI/CD, installers | Validate monorepo build, CI workflow, installer scripts |
| **M6** | Tier 1-4 Full End-to-End Live Verification | Complete final gate pass with 100% test pass on live system |

---
