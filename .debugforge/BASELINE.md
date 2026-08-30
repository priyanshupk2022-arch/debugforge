# 📐 DebugForge Empirical Baseline Record (`.debugforge/BASELINE.md`)

> **Baseline Verification Record**: Captured at baseline commit `6b21bf1` prior to executing the high-assurance build campaign.

---

## 1. Empirical Baseline Execution Results

| Test Suite / Command | Execution Status | Exit Code | Verified Output & Invariants |
| :--- | :---: | :---: | :--- |
| `npm run build:all` | **PASS ✅** | `0` | Clean compile across `@debugforge/core`, `@debugforge/cli`, and `@debugforge/web` (0 TypeScript / Vite errors). |
| `npm test` | **PASS ✅** | `0` | 35/35 offline tests pass across 5 suites with 0 failures, 0 cancelled, 2 skipped live gates. |
| `npm run bench` | **PASS ✅** | `0` | 5/5 tasks resolved with 100% Verified Resolution Rate (`DF-001` through `DF-005`). |
| `npm run test:live` | **PASS ✅** | `0` | Live TrueForge SSE turn and real MCP tool invocation verified on `http://localhost:3101` (Session: `01m18sfn73hq85fkrqn0eh3tde`, Tool: `debugforge_ingest_error`, Turn Status: `done`). |

---

## 2. Integrity Audit & Codebase Search

A comprehensive audit of `@debugforge/core`, `@debugforge/cli`, and `@debugforge/web` confirmed:
- **No hardcoded credentials**: Environment variables (`TRUEFORGE_API_KEY`, `DAYTONA_API_KEY`, etc.) are resolved dynamically with strict fail-closed validation.
- **No mock passes in production mode**: Offline tests are explicitly labeled as `LOCAL_DEV_MODE`, and live tests enforce real SSE communication.
- **No silent exception swallowing**: All tool handlers and approval engines return structured error payloads.
- **Strict Anti-Gaming**: Test modifications (`.skip`, `try/catch` exception masking) are actively scanned and rejected.
