# 🧊 DebugForge Baseline Freeze (`.debugforge/BASELINE.md`)

**Baseline Commit**: `58ab177`  
**Timestamp**: 2026-08-30T10:41:00Z  
**Environment**: Node.js v22+ / Windows (PowerShell) / TrueForge SDK v0.1.3 / Daytona SDK v0.207.0

---

## 1. Baseline Test Execution Results

### A. Full Monorepo Build (`npm run build:all`)
```
> debugforge@1.0.0 build:all
> npm --prefix packages/core run build && npm --prefix packages/cli run build && npm --prefix packages/web run build

✓ @debugforge/core compiled with 0 errors
✓ @debugforge/cli compiled with 0 errors
✓ @debugforge/web built in 1.99s (1817 modules transformed)
```

### B. Offline Test Suite (`npm test`)
```
▶ DebugForge Adversarial & Security Boundary Suite (5 tests passed)
▶ DebugForge Bug Reproduction Test (BRT) & Anti-Gaming Sentinel Suite (6 tests passed)
▶ DebugForge Core Engine Suite (9 tests passed)
▶ TrueForge Official SDK Architecture & Contract Test (4 tests passed)
▶ TrueForge Live Server Integration & Full E2E Chain Suite (2 live skipped, 2 offline passed)
ℹ tests 28 | suites 5 | pass 26 | fail 0 | skipped 2 (Exit Code 0)
```

### C. Live TrueForge Integration Gate (`npm run test:live`)
```
[DebugForge MCP] Real MCP HTTP/SSE Server listening on http://localhost:3101 (SSE endpoint: http://localhost:3101/sse)
[TrueForge Full E2E Proof] Live Chain Verified:
  - Session ID:   01m18g672dect6a6x79kdv7p20
  - Turn ID:      01m18g672m5jf7zhpdsw5g7yz7.local
  - MCP Tool:     debugforge_ingest_error
  - Tool Error:   TypeError (null_dereference)
  - Turn Status:  done
ℹ tests 4 | suites 1 | pass 4 | fail 0 | skipped 0 (Exit Code 0)
```

---

## 2. Baseline Architecture Inventory

- **Core Engine**: `packages/core/src` (Error ingestion, sandbox runner, AST patcher, Triple-Lock verifier, MCP server, TrueForge runtime, provider resolver, BRT generator, anti-gaming sentinel).
- **CLI Subsystem**: `packages/cli/src` (Interactive diagnosis command with HITL nonce apply path, status bar HUD).
- **Web Subsystem**: `packages/web/src` (Vite + React dashboard).
- **Fixtures**: `fixtures/null-propagation-api`, `fixtures/race-condition-app`, `fixtures/memory-leak-server`.
