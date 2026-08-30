# ⚡ Harness Reliability & Resilience Audit (`audit/HARNESS-RELIABILITY.md`)

> **Objective**: Attack the TrueForge orchestration and Model Context Protocol (MCP) stream lifecycle under network drops, tool timeouts, and unconfigured providers.

---

## 1. Failure Modes & Resilience Verification

| Failure Mode | Injected Condition | Subsystem Handling | Audit Result |
| :--- | :--- | :--- | :--- |
| **Unreachable TrueForge Server** | `TRUEFORGE_MODE=required`, `TRUEFORGE_BASE_URL=http://localhost:9999` | `packages/core/src/mcp/trueforge-runtime.ts` throws `[TrueForge Harness Blocker]`. | **PASS ✅** (Fails closed) |
| **Missing Provider API Credentials** | `DEBUGFORGE_MODEL_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=""` | `packages/core/src/agent/provider.ts` throws `[Model Provider Blocker]`. | **PASS ✅** (Fails closed) |
| **Invalid / Unsupported Provider Type** | `DEBUGFORGE_MODEL_PROVIDER=random-vendor` | `packages/core/src/agent/provider.ts` throws `[TrueForge Provider Blocker]`. | **PASS ✅** (Fails closed; no silent fallback) |
| **Unreachable Daytona Daemon** | `DAYTONA_MODE=required`, invalid API key | `packages/core/src/daytona/sandbox.ts` throws `[Daytona Isolation Blocker]`. | **PASS ✅** (Fails closed) |
| **Malformed Tool Ingestion Input** | Binary logs, empty string, or unparseable text | `packages/core/src/tools/ingest-error.ts` safely parses into default fallback frame. | **PASS ✅** (No uncaught crash) |
| **Stream Interruption / SSE Drop** | SSE stream closes before `turn.done` | TrueForge runtime handles stream errors and throws descriptive error. | **PASS ✅** (Handled cleanly) |

---

## 2. Idempotency & Rollback Guarantees

- **Disk Safety**: In production mode, target workspace files are never modified until Human-in-the-Loop approval is granted.
- **Single-Use Nonces**: Prevents re-execution or replay of historical patch applications.
- **Fail-Closed Principle**: Any unexpected network error, unconfigured key, or unhandled exception terminates the turn safely without corrupted state.
