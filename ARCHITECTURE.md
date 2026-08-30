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
│  1. Provider-Agnostic Model Registration:                   │
│     client.settings.modelProviders.createOrUpdate(...)      │
│     (Supports OpenAI, Anthropic, Google, DeepSeek, etc.)    │
│                                                             │
│  2. Agent Registration:                                     │
│     client.agents.create({ manifest: { model, mcpServers }})│
│                                                             │
│  3. MCP Server Registration:                                │
│     client.settings.mcpServers.createOrUpdate(...)          │
│                                                             │
│  4. Session Lifecycle:                                      │
│     client.sessions.create({ agent: { name } })             │
│                                                             │
│  5. Turn Execution & SSE Stream:                            │
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

---

## 🧩 Provider-Agnostic Model Subsystem

> **Design Principle**: DebugForge is model-provider agnostic and uses the provider/model configured by the operator through the TrueForge runtime.

### 1. Model Resolution & Normalization Layer (`packages/core/src/agent/provider.ts`)
- Dynamically resolves configured provider (`openai`, `anthropic`, `google-gemini`, `custom`, `together-ai`, `fireworks`, `alibaba`, `zai`).
- Validates that required API credentials exist for the chosen provider (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`).
- Fails closed in production/live mode if selected credentials are missing.
- Prevents dummy credentials from ever entering live execution paths.

### 2. Provider-Neutral Routing Layer (`packages/core/src/agent/router.ts`)
- Adaptively routes between deep reasoning tasks (`rca`, `patch`) and fast tasks (`triage`, `verify`) using models native to the operator's chosen provider.

### 3. TrueForge Manifest Generation
- Converts normalized configurations into official TrueForge SDK `ModelProviderManifest` schemas and provisions agents with full model URIs (e.g. `anthropic/claude-3-5-sonnet-latest` or `google-gemini/gemini-2.0-flash`).

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

### 5. Cryptographic HITL Gatekeeper & Apply Path (`hitlGatekeeper` & `applyPatch`)
- Transitions to `AWAITING_APPROVAL`.
- Emits single-use HMAC-SHA256 signed nonces with expiration timers and SHA-256 patch diff hash tamper verification.
- **Approved**: Nonce evaluated, signature confirmed, diff hash checked -> `applyPatch()` modifies target project files on disk -> post-apply checks.
- **Rejected**: Operator rejection records `status: 'rejected'` -> workspace remains completely untouched.

---

## 📦 Monorepo Structure

- `packages/core`: Official `@truefoundry/trueforge-sdk` integration, TrueForge MCP server, Daytona sandbox runner, HITL gatekeeper, provider abstraction, and domain tools.
- `packages/cli`: Interactive terminal UI with Claude Code-style live streaming thoughts, trace tree views, and HUD status bar.
- `packages/web`: React 19 + Tailwind CSS landing page and interactive failure simulator.
- `fixtures/`: 3 reproducible real-world bug testbeds (`null-propagation-api`, `race-condition-app`, `memory-leak-server`).
- `.github/workflows/ci.yml`: CI pipeline integrating monorepo test gates and Qodo PR-Agent automated review.
