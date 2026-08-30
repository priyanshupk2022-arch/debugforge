# 🔥 DebugForge — Autonomous AI Debugging Agent Harness

> **"AI writes code in seconds. Debugging takes hours. DebugForge fixes that."**  
> An autonomous AI agent harness built on the **TrueForge Agent Harness**, **Daytona Sandboxes**, and **Qodo Code Review** that reproduces, diagnoses, and auto-heals runtime bugs inside isolated sandboxes before code reaches production.

---

## 🚀 Quick Install

### Linux / macOS / WSL2 (One-line curl)
```bash
curl -fsSL https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.sh | bash
```

### Windows Native PowerShell
```powershell
iex (irm https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.ps1)
```

### Global NPM
```bash
npm install -g @debugforge/cli
```

---

## ⚡ Quickstart Commands

```bash
# 1. Diagnose and auto-heal a failing project with interactive HITL approval
debugforge diagnose --target fixtures/null-propagation-api

# 2. Continuous watch mode (auto-debugs on test failures)
debugforge watch --target fixtures/race-condition-app --test "npm test"

# 3. Conversational autonomous agent prompt
debugforge agent "Fix the silent null crash under database connection pool load" --target fixtures/null-propagation-api
```

---

## 🧩 Provider-Agnostic Model Architecture

> [!IMPORTANT]
> **DebugForge is model-provider agnostic and uses the provider/model configured by the operator through the TrueForge runtime.**  
> Operators can seamlessly switch between OpenAI, Anthropic, Google Gemini, DeepSeek, and Custom LLMs without modifying source code.

### Operator Configuration Examples

#### 1. Anthropic Claude (e.g. Claude 3.5 Sonnet)
```bash
export DEBUGFORGE_MODEL_PROVIDER=anthropic
export DEBUGFORGE_MODEL=claude-3-5-sonnet-latest
export ANTHROPIC_API_KEY="sk-ant-..."
```

#### 2. Google Gemini (e.g. Gemini 2.0 Flash)
```bash
export DEBUGFORGE_MODEL_PROVIDER=google
export DEBUGFORGE_MODEL=gemini-2.0-flash
export GEMINI_API_KEY="AIzaSy..."
```

#### 3. OpenAI (e.g. GPT-4o / o3-mini)
```bash
export DEBUGFORGE_MODEL_PROVIDER=openai
export DEBUGFORGE_MODEL=gpt-4o
export OPENAI_API_KEY="sk-proj-..."
```

#### 4. Custom / DeepSeek / Local LLM
```bash
export DEBUGFORGE_MODEL_PROVIDER=deepseek
export DEBUGFORGE_MODEL=deepseek-chat
export DEEPSEEK_API_KEY="sk-..."
export DEBUGFORGE_BASE_URL="https://api.deepseek.com/v1"
```

---

## 🧠 The 5-Stage Autonomous Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. INGEST   │ ──► │ 2. REPRODUCE │ ──► │  3. TRACE    │ ──► │ 4. AUTO-PATCH│ ──► │   5. HITL    │
│    ERROR     │     │  IN SANDBOX  │     │  ROOT CAUSE  │     │   & VERIFY   │     │   APPROVAL   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Ingest Error**: Ingests raw stack traces, unhandled rejections, and test runner logs into structured models.
2. **Reproduce in Sandbox**: Provisions an isolated Daytona workspace and replicates the bug with real exit codes.
3. **Trace Root Cause**: Traces dynamic execution backwards from the crash site to locate the true infection origin (not superficial band-aids).
4. **Auto-Patch & Verify**: Synthesizes surgical AST diffs and asserts **Triple-Lock Verification** (Lock 1: Bug fixed, Lock 2: Zero regressions, Lock 3: Stress passed).
5. **HITL Approval**: Provides a Human-in-the-Loop decision gate with single-use nonce for cryptographic operator sign-off (`AWAITING_APPROVAL`).
   - **Approved**: Nonce and patch hash validated -> patch written directly to disk -> post-apply checks.
   - **Rejected**: Execution halted immediately -> workspace files remain untouched.

---

## 🔍 Qodo Code Review Evidence

DebugForge enforces automated pull request code quality and security reviews on every substantive change via **Qodo PR-Agent**:

- **Representative Pull Request**: [PR #2 — TrueForge Standalone Harness, Real MCP Server & Live E2E Integration](https://github.com/priyanshupk2022-arch/zeroshield/pull/2) (Merged)
- **Qodo Review Findings**:
  - Identified requirement for explicit `DAYTONA_MODE=required` fail-closed verification.
  - Recommended cryptographic HMAC-SHA256 signature binding and anti-replay nonces for Human-in-the-Loop approval checkpoints.
  - Verified Triple-Lock independent execution preventing false positive merges.
- **Remediation & Review Trail**:
  - Implemented constant-time `crypto.timingSafeEqual` signature validation and SHA-256 patch diff hash tamper protection.
  - Added dedicated adversarial test suite (`adversarial.test.ts`) validating fail-closed gates.
  - Follow-up Qodo review passed with all gates clean.

---

## 🌐 TrueForge Live Evidence

DebugForge provides genuine integration with the official **TrueForge Agent Harness**:

```
CLI / User Input
       │
       ▼
TrueForge Server (localhost:8790)
       │ (Manages Session & Agent Turn Lifecycle)
       ▼
TrueForge Model Execution (Configured Provider/Model)
       │ (Emits Tool Call: call_tool -> debugforge_ingest_error)
       ▼
DebugForge Streamable HTTP/SSE MCP Server (localhost:3101)
       │ (5 Registered MCP Diagnostics Tools)
       ▼
Daytona Sandbox Execution Boundary (@daytona/sdk)
       │ (Real Container / Ephemeral Environment)
       ▼
DebugForge Observation Stream
       │ (SSE: tool.response -> turn.done)
       ▼
Independent Triple-Lock Verification Gates
       │ (Lock 1: Fix, Lock 2: Regressions, Lock 3: Invariants)
       ▼
Cryptographic Human-in-the-Loop Gatekeeper
       │ (Single-Use Nonce, Anti-Replay, Tamper Detection)
       ▼
Actual Workspace Patch Application
```

### Verified Live End-to-End Execution Trace (`npm run test:live`)
```
[DebugForge MCP] Real MCP HTTP/SSE Server listening on http://localhost:3101 (SSE endpoint: http://localhost:3101/sse)
[TrueForge Full E2E Proof] Live Chain Verified:
  - Session ID:   01m188azwnvxb6dw73f8w98bzd
  - Turn ID:      01m188azwwmgybykw5phrhxzt8.local
  - MCP Tool:     debugforge_ingest_error
  - Tool Error:   TypeError (null_dereference)
  - Turn Status:  done
▶ TrueForge Live Server Integration & Full E2E Chain Suite
  ✔ should execute full live TrueForge turn with real MCP tool invocation and stream observation (151.78ms)
  ✔ should enforce real cryptographic nonce approval path (AWAITING_APPROVAL -> approve -> workspace modified / reject -> untouched) (1.11ms)
  ✔ should fail closed when TrueForge server is unavailable in required mode (2.33ms)
  ✔ should fail closed when MCP endpoint is unavailable or unreachable in TrueForge (42.77ms)
✔ TrueForge Live Server Integration & Full E2E Chain Suite (1583.77ms)
```

---

## 🧪 Testing Strategies

| Test Command | Purpose | Environment Requirements |
| :--- | :--- | :--- |
| `npm test` | Multi-tier unit, contract, and adversarial tests | Offline / None |
| `npm run test:live` | Deterministic TrueForge live turn & MCP chain verification | Local TrueForge Server |
| `npm run test:provider` | Real Provider Smoke Test (Opt-in) | `REAL_PROVIDER_TEST=true` + Provider Key |

---

## 📂 Project Architecture

```
debugforge/
├── packages/
│   ├── core/           # Diagnostics engine, TrueForge bridge, Daytona runner, MCP tools, HITL
│   ├── cli/            # Claude Code-style interactive terminal UI, watch daemon
│   └── web/            # Real-time visual debugger dashboard (React, Tailwind, Lucide)
├── fixtures/           # Reproducible failure fixtures (Null Pointer, Race Condition, Memory Leak)
├── HACKATHON_EVIDENCE.md
├── ARCHITECTURE.md
├── TESTING.md
├── SECURITY.md
└── DEMO.md
```

---

## 🛡️ Security Model

- **Fail-Closed Verification**: If required credentials (`DAYTONA_MODE=required` or `TRUEFORGE_MODE=required`) or servers are unreachable, execution stops immediately without destructive modifications.
- **Zero Dummy Keys**: No fake keys enter production execution paths. Missing keys for selected providers fail closed.
- **Cryptographic HITL Gate**: Enforces single-use nonces, HMAC-SHA256 signatures, and SHA-256 patch diff hash tamper protection.
- **Triple-Lock Verification**: Every patch must independently pass reproduction test, regression suite, and load invariant check before human review.
