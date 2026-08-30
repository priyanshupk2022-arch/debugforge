# ⚡ Forensic Audit: TrueForge & MCP Integration (`audit/TRUEFORGE-FORENSIC-AUDIT.md`)

> **Integration Forensics**: Deep audit of official TrueForge SDK usage (`@truefoundry/trueforge-sdk` / `@truefoundry/trueforge`), MCP tool registration, SSE stream transport, and live vs local execution modes.

---

## 1. TrueForge SDK & MCP Trace Analysis

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    TRUEFORGE LIVE EXECUTION TRACE                         │
├───────────────────────────────────────────────────────────────────────────┤
│ 1. TrueForge Server Startup:                                              │
│    node ./packages/core/node_modules/@truefoundry/trueforge/dist/cli.js   │
│    Listening on: http://localhost:8790                                    │
├───────────────────────────────────────────────────────────────────────────┤
│ 2. Mock LLM SSE Provider:                                                 │
│    Listening on: http://localhost:3102                                    │
│    Registered in TrueForge as: live-tf-mock-llm/debug-model               │
├───────────────────────────────────────────────────────────────────────────┤
│ 3. DebugForge MCP Server:                                                 │
│    Listening on: http://localhost:3101/sse                                │
│    Registered in TrueForge as: debugforge (remote SSE)                    │
├───────────────────────────────────────────────────────────────────────────┤
│ 4. Server-Side Session & Turn Dispatch:                                   │
│    TrueForge client.sessions.create({ agent: 'debugforge-live-e2e-agent' })│
│    TrueForge client.sessions.createTurnStream(sessionId, ...)             │
├───────────────────────────────────────────────────────────────────────────┤
│ 5. Tool Call Execution:                                                   │
│    TrueForge Server invokes MCP tool: debugforge_ingest_error             │
│    DebugForge tool executes: ingestError() on input payload               │
│    DebugForge returns: { category: "null_dereference", crashSite: ... }   │
│    TrueForge stream emits: { type: "tool.response", content: ... }        │
│    TrueForge turn completes: { type: "turn.done", status: "done" }        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Forensic Findings on TrueForge & MCP

1. **Official SDK Usage**: **GENUINE & VERIFIED ✅**. The codebase imports `TrueForge` from `@truefoundry/trueforge-sdk` and invokes real server API endpoints (`client.server.getCapabilities`, `client.settings.modelProviders.createOrUpdate`, `client.settings.mcpServers.createOrUpdate`, `client.agents.create`, `client.sessions.create`, `client.sessions.createTurnStream`).
2. **Local Mock LLM Provider in Tests**: In `trueforge-live.test.ts`, an in-process HTTP/SSE server simulates OpenAI chat completion chunks on port 3102. This allows `npm run test:live` to run deterministically without internet access or paid OpenAI keys while testing the **genuine** TrueForge server, real SSE streaming, and real MCP HTTP transport.
3. **MCP Tool Handlers**: All 5 standard tools (`debugforge_ingest_error`, `debugforge_analyze_trace`, `debugforge_reproduce`, `debugforge_auto_patch`, `debugforge_verify_fix`) are registered with Zod schemas and executable over HTTP/SSE.
