# Bug Fixture 2: Race Condition App

## Scenario Description
A financial wallet service handles fund transfers between accounts. The transfer logic executes a read-check-modify-write sequence across asynchronous boundaries (`await auditLogger.logAsyncTransfer(...)`). Under high concurrency, multiple requests read the same initial balance before any write executes, causing double-spending and balance overdraft into negative amounts.

## Root Cause vs Crash Site
- **Infection Origin (Root Cause):** `src/services/transfer.ts:27` — Non-atomic read-modify-write without mutex or transaction isolation.
- **Propagation Step 1:** `src/services/transfer.ts:38` — Balance check evaluated on stale in-memory read.
- **Propagation Step 2:** `src/services/audit.ts:19` — Asynchronous delay interleaves concurrent event loop ticks.
- **Crash / Corruption Site:** `test/concurrency.test.ts:74` — Assertion failure when account balance drops below zero (-$900).

## Reproduction
```bash
npm run build
npm test
# Or run standalone reproduction:
npm run test:reproduce
```

## Auto-Patch & Verification Strategy
1. **Mutex / Async Lock (`src/services/transfer.ts`):** Wrap `executeTransfer` with a keyed per-account async mutex or sequential queue.
2. **Atomic CAS / Optimistic Concurrency:** Validate version/timestamp before commit and retry on conflict.
3. **Triple-Lock Verification:** Verify sequential transfers pass, regression transfers pass, and 100-request high-concurrency stress test maintains `balance >= 0`.
