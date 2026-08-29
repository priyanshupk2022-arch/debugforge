# 🏛️ DebugForge Architecture Specification

## Overview
**DebugForge** is an autonomous AI debugging agent harness built for high-scale software engineering teams. It ingests runtime failures, provisions isolated execution sandboxes, performs dynamic backward causal root cause analysis (RCA), generates surgical multi-file AST diffs, independently validates repairs via a Triple-Lock verification mechanism, and enforces cryptographic Human-in-the-Loop (HITL) approval gates.

---

## 🏗️ System Components

```
User / Terminal / Web UI
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                 TRUEFORGE AGENT HARNESS                     │
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │   Agent ReAct Loop    │   │    Model Provider Router  │  │
│  │  (Turn State Machine) │   │     (GPT-4o / o3-mini)    │  │
│  └──────────┬────────────┘   └─────────────┬─────────────┘  │
│             │                              │                │
│             ▼                              ▼                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Model Context Protocol (MCP) Server          │  │
│  │  • debugforge_ingest_error                            │  │
│  │  • debugforge_reproduce_in_sandbox                    │  │
│  │  • debugforge_trace_and_analyze                       │  │
│  │  • debugforge_auto_patch                              │  │
│  │  • debugforge_verify_fix                              │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
       ┌──────────────────────┴──────────────────────┐
       ▼                                             ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│       DAYTONA SANDBOX        │     │         HITL GATE            │
│  • Remote Container (Node22) │     │  • HMAC-SHA256 Signatures    │
│  • Ephemeral Lifecycle       │     │  • Anti-Replay Nonces        │
│  • Stdout/Stderr/Exit-Code   │     │  • Expiration TTL            │
│  • Isolated Working Copy     │     │  • Audit Trail Logging       │
└──────────────────────────────┘     └──────────────────────────────┘
```

---

## 🔄 5-Stage Autonomous Debugging Pipeline

### 1. Ingest Error (`debugforge_ingest_error`)
- Ingests raw stack traces, stderr streams, unhandled promise rejections, and test runner outputs.
- Extracts culprit frames, function names, source file paths, and line numbers into strongly-typed Zod error models.

### 2. Reproduce in Sandbox (`debugforge_reproduce_in_sandbox`)
- Spins up an ephemeral **Daytona Sandbox** container.
- Materializes the target project into the isolated container.
- Executes reproduction test commands with strict timeouts and captures exact exit codes and execution logs.

### 3. Dynamic Backward Causal Tracing (`debugforge_trace_and_analyze`)
- Traces execution state backwards from the **Crash Site** to the **Infection Origin**.
- Separates proximate symptoms from the true root cause (e.g., database pool exhaustion causing downstream undefined dereferences).

### 4. Auto-Patch & Triple-Lock Verification (`debugforge_auto_patch` & `debugforge_verify_fix`)
- Generates surgical, minimal unified diffs confined strictly to culprit files.
- Executes **Triple-Lock Verification**:
  - **Lock 1**: Original failure is no longer reproducible.
  - **Lock 2**: Existing test suites pass without regression.
  - **Lock 3**: Targeted concurrency/invariant load assertions pass.

### 5. Cryptographic HITL Gatekeeper (`hitlGatekeeper`)
- Blocks automatic workspace merging.
- Emits single-use HMAC-SHA256 signed nonces with expiration timers.
- Requires operator sign-off before applying changes.

---

## 📦 Monorepo Structure

- `packages/core`: Core ReAct loop, TrueForge MCP server, Daytona sandbox manager, HITL gatekeeper, and tools.
- `packages/cli`: Interactive terminal UI with Claude Code-style live streaming thoughts, trace tree views, and HUD status bar.
- `packages/web`: React 19 + Tailwind CSS landing page and interactive failure simulator.
- `fixtures/`: 3 reproducible real-world bug testbeds (`null-propagation-api`, `race-condition-app`, `memory-leak-server`).
- `.github/workflows/ci.yml`: CI pipeline integrating monorepo test gates and Qodo PR-Agent automated review.
