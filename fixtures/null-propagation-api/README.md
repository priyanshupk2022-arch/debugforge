# Bug Fixture 1: Null Propagation API

## Scenario Description
An e-commerce order processing service experiences a database connection pool timeout. Rather than throwing a `PoolTimeoutException` or implementing a retry policy, `pool.acquireConnection()` returns `null`. This unhandled `null` silently propagates through inventory and pricing services, resulting in an undefined total that causes a `TypeError` crash downstream in `order.ts`.

## Root Cause vs Crash Site
- **Infection Origin (Root Cause):** `src/db/pool.ts:28` — Connection pool returns `null` silently on timeout.
- **Propagation Step 1:** `src/services/inventory.ts:40` — Inventory service receives `null` connection and returns `null` item.
- **Propagation Step 2:** `src/services/pricing.ts:32` — Pricing service calculates total with missing item, leaving `total: undefined`.
- **Crash Site:** `src/services/order.ts:48` — `order.pricing.total.toFixed(2)` throws `TypeError: Cannot read properties of undefined (reading 'toFixed')`.

## Reproduction
```bash
npm run build
npm test
# Or run standalone reproduction:
npm run test:reproduce
```

## Auto-Patch & Verification Strategy
1. **Fix at Infection Origin (`src/db/pool.ts`):** Throw a `PoolTimeoutException` or implement retry with exponential backoff.
2. **Defensive Safe Navigation (`src/services/order.ts`):** Add nullish coalescing `(order.pricing?.total ?? 0).toFixed(2)` and inventory validation.
3. **Triple-Lock Verification:** Verify target checkout test passes, full regression suite passes, and concurrent multi-order stress test passes.
