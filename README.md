# 🔥 DebugForge — Autonomous AI Debugging Agent Harness

> **"AI writes code in seconds. Debugging takes hours. DebugForge fixes that."**  
> An autonomous AI agent harness built on the **TrueForge Agent Harness SDK**, **Daytona Sandboxes**, and **Qodo Code Review** that reproduces, diagnoses, and auto-heals runtime bugs inside isolated sandboxes before code reaches production.

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
# 1. Diagnose and auto-heal a failing project
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
5. **HITL Approval**: Provides a Human-in-the-Loop decision gate with single-use nonce for cryptographic operator sign-off.

---

## 📊 Market Comparison

| Capability | Cursor / Copilot | Sentry / Datadog | SWE-agent | **DebugForge (Ours)** |
| :--- | :--- | :--- | :--- | :--- |
| **Sandbox Reproduction** | ❌ Manual | ❌ Alert only | ⚠️ Docker CLI | **✅ Ephemeral Daytona Sandbox** |
| **Infection vs Crash Site** | ❌ Crash site band-aid | ❌ Stack trace frame | ⚠️ Static grep | **✅ Dynamic Backward Causal Trace** |
| **Triple-Lock Verification** | ❌ None | ❌ None | ⚠️ Test exit code | **✅ Bug Fixed + Regression + Stress** |
| **TrueForge MCP Tools** | ❌ Proprietary | ❌ Proprietary | ❌ None | **✅ Native Open MCP Registry** |
| **Qodo Code Review** | ❌ None | ❌ None | ❌ None | **✅ Automated PR Quality Gate** |

---

## 📦 Monorepo Architecture

```
debugforge/
├── packages/
│   ├── core/         # ReAct agent loop, Daytona sandbox, TrueForge MCP tools, HITL gate
│   ├── cli/          # Claude Code-style terminal UI, diff viewer, trace visualizer
│   └── web/          # High-end React 19 + Tailwind CSS landing page & simulator
├── fixtures/         # 3 Reproducible real-world microservices (Null cascade, Race condition, Memory leak)
├── .github/          # GitHub Actions CI with Qodo PR-Agent automated review
├── install.sh        # Linux/macOS curl installer
└── install.ps1       # Windows PowerShell installer
```

---

## 🧪 Testing & Verification

```bash
# Run all core engine tests
npm --prefix packages/core test

# Build production web frontend
npm --prefix packages/web run build

# Start local web landing page
npm --prefix packages/web run dev
```

---

## 🏆 Hackathon Submission Metadata

- **Track**: Autonomous AI Agents & Developer Tools
- **Harness**: TrueForge Agent SDK (`@truefoundry/trueforge`)
- **Sandbox Provider**: Daytona Sandboxes
- **Code Review**: Qodo PR-Agent (`Codium-ai/pr-agent`)
- **Author**: Priyanshu
- **License**: MIT
