# 🔌 MODEL CONTEXT PROTOCOL (MCP) LIVE PROOF & TOOL CATALOG

**Target Commit:** `1300f55`  
**Protocol Version:** MCP 2024-11-05 (JSON-RPC 2.0 / Server-Sent Events SSE)  
**Package:** `@modelcontextprotocol/sdk: ^1.1.1`  
**Endpoints:** `http://localhost:3101/sse`, `http://localhost:3101/messages`, `http://localhost:3101/tools`  

---

## 1. Exposed Diagnostic MCP Tool Catalog

DebugForge exposes 5 high-assurance diagnostic tools conforming to official Zod schemas and Model Context Protocol specifications:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          DEBUGFORGE DIAGNOSTIC MCP TOOLS                               │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ Tool Name                      │ Purpose & Diagnostic Contract                         │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ debugforge_ingest_error        │ Parses raw logs/stack traces into structured models   │
│ debugforge_reproduce           │ Provisions isolated sandbox & validates defect        │
│ debugforge_analyze_trace       │ Dynamic backward causal tracing from crash to origin  │
│ debugforge_auto_patch          │ Synthesizes minimal, surgical unified diff patches    │
│ debugforge_verify_fix          │ Triple-Lock verification + local mutation testing     │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 2. Tool Schema & Parameter Contracts

### 1. `debugforge_ingest_error`
- **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "rawError": { "type": "string", "description": "Raw stack trace or runtime exception log" }
    },
    "required": ["rawError"]
  }
  ```
- **Output:** Structured `ErrorReport` with `category`, `crashSite`, `stackFrames`, and `errorType`.

### 2. `debugforge_reproduce`
- **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "projectPath": { "type": "string" },
      "testCommand": { "type": "string", "default": "npm test" },
      "timeoutMs": { "type": "number", "default": 30000 }
    },
    "required": ["projectPath"]
  }
  ```
- **Output:** `SandboxExecResult` with `workspaceId`, `exitCode`, `reproduced: boolean`, and stdout/stderr captures.

### 3. `debugforge_analyze_trace`
- **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "errorReport": { "type": "object" },
      "projectPath": { "type": "string" }
    },
    "required": ["errorReport"]
  }
  ```
- **Output:** `RootCauseAnalysis` with `crashSite`, `infectionOrigin`, `causalChain`, `hypotheses`, and `confidence`.

### 4. `debugforge_auto_patch`
- **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "rca": { "type": "object" },
      "projectPath": { "type": "string" },
      "applyImmediately": { "type": "boolean", "default": false }
    },
    "required": ["rca", "projectPath"]
  }
  ```
- **Output:** `PatchResult` with `patches` (unified diff hunks, originalCode, patchedCode) and `blastRadius`.

### 5. `debugforge_verify_fix`
- **Input Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "patch": { "type": "object" },
      "projectPath": { "type": "string" },
      "testCommand": { "type": "string" },
      "runMutationCheck": { "type": "boolean", "default": true }
    },
    "required": ["patch", "projectPath"]
  }
  ```
- **Output:** `TripleLockResult` with `lock1_bugFixed`, `lock2_noRegressions`, `lock3_stressPassed`, `mutationScore`, and `allPassed: boolean`.

---

## 3. Real Transport & Validation Proof

- **Transport Binding:** Implemented via `SSEServerTransport` in `packages/core/src/mcp/http-server.ts`.
- **Validation Failure Gate:** Malformed arguments or missing required parameters trigger strict Zod schema validation errors (`Invalid tool arguments for <tool_name>`), failing closed without unhandled exceptions.
- **Fail-Closed Availability:** Unreachable MCP endpoints in TrueForge required mode immediately yield tool response errors or halt turn execution safely.
