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
TrueForge Server (http://localhost:8790)
       │
       ▼
Model Turn (openai/gpt-4o)
       │
       ▼
DebugForge MCP Server (http://localhost:3000/sse)
       │
       ▼
Daytona Sandbox Container (@daytona/sdk)
       │
       ▼
Runtime Observation & State Mutation
       │
       ▼
Next Turn / HITL Approval Checkpoint
```

### Local TrueForge Server Startup
```bash
# 1. Start official TrueForge server in standalone mode
npx @truefoundry/trueforge --port 8790

# 2. Start DebugForge MCP server
npm run mcp

# 3. Run live end-to-end integration gate
npm run test:live
```

### Live Server Verification Evidence:
```
[DebugForge MCP] Real MCP HTTP/SSE Server listening on http://localhost:3001 (SSE endpoint: http://localhost:3001/sse)
[TrueForge Live Gate Proof] Successfully verified live TrueForge server session: 01m184rwz2azwpngky3e3c6hse for agent: 01m184pnxh8z65whm5z3x97mzz
✔ should execute full live TrueForge server integration loop when TRUEFORGE_LIVE_TEST=true (83.12ms)
```

---

## 🧪 Testing & Verification

```bash
# Run all unit, contract, and adversarial test suites
npm test

# Run live TrueForge server integration gate
npm run test:live

# Execute 3 Golden Demo Fixtures
npm run demo:null     # Null dereference infection origin -> Triple-Lock PASSED
npm run demo:race     # Race condition under concurrency -> Mutex Triple-Lock PASSED
npm run demo:memory   # Memory leak bounded ring buffer -> Triple-Lock PASSED
```

---

## 📦 Monorepo Structure

```
debugforge/
├── packages/
│   ├── core/         # TrueForge SDK harness bridge, real MCP HTTP server, Daytona runner, HITL gatekeeper
│   ├── cli/          # Claude Code-style terminal UI with HUD status bar & AWAITING_APPROVAL prompt
│   └── web/          # React 19 + Tailwind CSS landing page & failure simulator
├── fixtures/         # 3 Reproducible real-world microservices (Null cascade, Race condition, Memory leak)
├── .github/          # GitHub Actions CI with Qodo PR-Agent automated review
├── install.sh        # Linux/macOS curl installer
└── install.ps1       # Windows PowerShell installer
```

---

## 📄 License

Apache-2.0 © 2026 Priyanshu & DebugForge Contributors.
