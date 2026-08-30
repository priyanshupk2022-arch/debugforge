# ☁️ DAYTONA SANDBOX LIFECYCLE & ISOLATION PROOF

**Target Commit:** `1300f55`  
**Package:** `@daytona/sdk: ^0.9.0`  
**Manager Implementation:** [`packages/core/src/daytona/sandbox.ts`](file:///c:/Users/priya/Documents/antigravity/modest-planck/packages/core/src/daytona/sandbox.ts)  

---

## 1. Sandbox Lifecycle & State Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ DaytonaSandboxManager Lifecycle                             │
├─────────────────────────────────────────────────────────────┤
│ 1. createWorkspace(targetDir, image="node:22-slim")         │
│    ├── LIVE: daytona.create({ image })                      │
│    └── LOCAL: Allocate workspaceId & isolated path map      │
│                                                             │
│ 2. executeInWorkspace(workspaceId, cmd, { timeoutMs, env }) │
│    ├── LIVE: sandbox.process.executeCommand(cmd)            │
│    └── LOCAL: child_process.exec with isolated CWD & ENV    │
│                                                             │
│ 3. destroyWorkspace(workspaceId)                            │
│    ├── LIVE: sandbox.delete()                               │
│    └── LOCAL: Purge active workspace map entry              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Execution Modes & Labeling Discipline

DebugForge strictly differentiates execution environments with zero false claims:

| Execution Mode | Condition | Behavior & Labeling |
| :--- | :--- | :--- |
| **`DAYTONA_LIVE`** | `DAYTONA_API_KEY` & `DAYTONA_SERVER_URL` configured | Provisions real container workspaces in remote Daytona cloud cluster via `@daytona/sdk`. |
| **`DAYTONA_REQUIRED`** | `DAYTONA_MODE="required"` without credentials | **FAILS CLOSED**; throws `[Daytona Isolation Blocker]` and halts immediately. |
| **`LOCAL_DETERMINISTIC_ADAPTER`** | Credentials absent; default local mode | Creates isolated disk workspaces with sandboxed process environments; labels `{ mode: "LOCAL_DETERMINISTIC_ADAPTER" }`. |
| **`BENCH_OFFLINE`** | `process.env.BENCH_MODE === "offline"` | Runs deterministic local benchmark fixtures. |

---

## 3. Teardown & Resource Safety Proof

- **Guaranteed Cleanup:** All callers (`BenchmarkRunner`, `TargetedMutationVerifier`, `reproduceInSandbox`) wrap workspace lifecycles in `try ... finally` blocks to ensure `destroyWorkspace()` is executed regardless of test outcomes.
- **Timeout Boundary:** Configurable timeout boundary (default 30,000ms) with duration measurement, protecting against runaway execution or infinite test loops.
- **Adversarial Verification:** Verified in `packages/core/src/tests/adversarial.test.ts` (Subtest 3) asserting fail-closed rejection when `DAYTONA_MODE=required` and credentials are unconfigured.
