# DEBUGFORGE FINAL RELEASE BASELINE

**Recorded Timestamp:** August 30, 2026  
**Baseline Commit:** `1300f55`  
**Branch:** `main`  
**Working Tree:** Clean  
**Node.js Version:** `v24.15.0`  
**OS Platform:** Windows (win32)  
**Package Versions:**  
- `@debugforge/core`: `1.0.0`
- `@debugforge/cli`: `1.0.0`
- `@debugforge/web`: `1.0.0`
- `@truefoundry/trueforge`: `0.1.4`
- `@truefoundry/trueforge-sdk`: `0.1.3`
- `@daytona/sdk`: `0.9.0`
- `@modelcontextprotocol/sdk`: `1.1.1`

---

## Baseline Execution Evidence

### 1. Build Verification (`npm run build:all`)
- **Exit Code:** `0`
- **Duration:** 1.92s
- **Output:**
  - `@debugforge/core`: `tsc` compiled cleanly.
  - `@debugforge/cli`: `tsc` compiled cleanly.
  - `@debugforge/web`: `tsc -b && vite build` compiled 1817 modules into `dist/`.

### 2. Full Test Suite (`npm test`)
- **Exit Code:** `0`
- **Duration:** 2.15s
- **Test Summary:**
  - `core.test.js`: 9 / 9 passed
  - `adversarial.test.js`: 5 / 5 passed
  - `brt-and-anti-gaming.test.js`: 6 / 6 passed
  - `nextgen-subsystems.test.js`: 8 / 8 passed
  - `remediation.test.ts`: 6 / 6 passed
  - `trueforge-integration.test.js`: 4 / 4 passed
  - `trueforge-live.test.js`: 4 / 4 passed (2 offline gated)
  - **Total:** 44 tests (42 passed, 0 failed, 2 skipped offline)

### 3. Live TrueForge E2E Integration (`npm run test:live`)
- **Exit Code:** `0`
- **Duration:** 1.57s
- **Proof:**
  - TrueForge Daemon Port: `8790`
  - MCP SSE Endpoint: `http://localhost:3101/sse`
  - Session ID: `01m193r9tnye66exhn0khep1xx`
  - Turn ID: `01m193r9txhxs403x80nhzcsf5.local`
  - Tool Invocation: `debugforge_ingest_error`
  - Status: `done`

### 4. Benchmark Suite (`npm run bench`)
- **Exit Code:** `0`
- **Duration:** 2.14s
- **Resolution Rate:** 100.0% (5 / 5 tasks passed)
- **Execution Mode:** `BENCH_LOCAL` (Isolated disk workspaces under `.debugforge/bench-workspaces`)
