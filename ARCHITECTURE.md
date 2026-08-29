# 🏛️ DebugForge Architecture Specification

## Overview
**DebugForge** is an autonomous AI debugging agent harness built for high-scale software engineering teams. It ingests runtime failures, provisions isolated execution sandboxes, performs dynamic backward causal root cause analysis (RCA), generates surgical multi-file AST diffs, independently validates repairs via a Triple-Lock verification mechanism, and enforces cryptographic Human-in-the-Loop (HITL) approval gates.

---

## 🏗️ System Components & Execution Paths

### 1. Production Mode: Live TrueForge Harness & Server Architecture
In live TrueForge integration mode, DebugForge operates as an autonomous agent and registered MCP server inside the official TrueForge Agent Harness:

```
CLI / Web / User Request
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│             OFFICIAL TRUEFORGE HARNESS SERVER               │
│               (@truefoundry/trueforge-sdk)                  │
│                                                             │
│  1. Agent Registration:                                     │
│     client.agents.create({ manifest: { model, mcpServers }})│
│                                                             │
│  2. MCP Server Registration:                                │
│     client.settings.mcpServers.createOrUpdate(...)          │
│                                                             │
│  3. Session Lifecycle:                                      │
│     client.sessions.create({ agent: { name } })             │
│                                                             │
│  4. Turn Execution & SSE Stream:                            │
│     client.sessions.createTurnStream(session_id, input)     │
└─────────────────────────────┬───────────────────────────────┘
                              │ Calls registered MCP tools
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          DEBUGFORGE MCP SERVER (@modelcontextprotocol/sdk)  │
│  • debugforge_ingest_error                                  │
│  • debugforge_reproduce_in_sandbox                          │
│  • debugforge_trace_and_analyze                             │
│  • debugforge_auto_patch                                    │
│  • debugforge_verify_fix                                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
       ┌──────────────────────┴──────────────────────┐
       ▼                                             ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│   DAYTONA SANDBOX RUNNER     │     │       HITL GATEKEEPER        │
│      (@daytona/sdk)          │     │  • HMAC-SHA256 Signatures    │
│  • Remote Ephemeral Container│     │  • Patch Hash Tamper Detect  │
│  • Command Execution & Logs  │     │  • Anti-Replay Nonces        │
│  • Isolated Workspace Copy   │     │  • Expiration TTL            │
└──────────────────────────────┘     └──────────────────────────────┘
```

### 2. Local Developer Mode (`LOCAL_DEV_MODE: NOT_TRUEFORGE_RUNTIME`)
For offline unit tests, local development, and fast single-process CLI demos without an active TrueForge server cluster, DebugForge provides an explicit local reasoning engine (`runDebugAgent()`).
- **Clear Labeling**: Explicitly logs `[LOCAL_DEV_MODE: NOT_TRUEFORGE_RUNTIME]` with zero false claims of live server connections.
- **Fail-Closed Gate**: In `TRUEFORGE_MODE=required`, unconfigured or unreachable TrueForge servers halt immediately with a fail-closed blocker exception.

---

## 🔄 5-Stage Autonomous Debugging Pipeline

### 1. Ingest Error (`debugforge_ingest_error`)
- Ingests raw stack traces, stderr streams, unhandled promise rejections, and test runner outputs.
- Extracts culprit frames, function names, source file paths, and line numbers into strongly-typed Zod error models.

### 2. Reproduce in Sandbox (`debugforge_reproduce_in_sandbox`)
- Spins up an ephemeral **Daytona Sandbox** container (`@daytona/sdk`).
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
- Emits single-use HMAC-SHA256 signed nonces with expiration timers and SHA-256 patch diff hash tamper verification.
- Requires operator sign-off before applying changes.

---

## 📦 Monorepo Structure

- `packages/core`: Official `@truefoundry/trueforge-sdk` integration, TrueForge MCP server, Daytona sandbox runner, HITL gatekeeper, and domain tools.
- `packages/cli`: Interactive terminal UI with Claude Code-style live streaming thoughts, trace tree views, and HUD status bar.
- `packages/web`: React 19 + Tailwind CSS landing page and interactive failure simulator.
- `fixtures/`: 3 reproducible real-world bug testbeds (`null-propagation-api`, `race-condition-app`, `memory-leak-server`).
- `.github/workflows/ci.yml`: CI pipeline integrating monorepo test gates and Qodo PR-Agent automated review.
