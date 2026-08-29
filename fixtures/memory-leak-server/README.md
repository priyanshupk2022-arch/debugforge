# Bug Fixture 3: Memory Leak Server

## Scenario Description
A real-time telemetry distribution server manages streaming client connections. On connection, each `ClientSession` registers an event listener with a singleton `GlobalTelemetryBroker` and allocates a 64KB buffer stored in an `UnboundedTelemetryCache`. When client sessions disconnect, the session fails to unregister its listener and fails to purge its cached buffer. Under sustained load (1,000 connect/disconnect cycles), Node.js triggers `MaxListenersExceededWarning`, memory continuously inflates, and closures are permanently retained.

## Root Cause vs Crash Site
- **Infection Origin (Root Cause):** `src/server/session.ts:58` — `disconnect()` fails to call `broker.removeListener()` and `cache.deleteSessionData()`.
- **Propagation Step 1:** `src/server/emitter.ts:25` — Singleton `GlobalTelemetryBroker` listener array retains references to disconnected `ClientSession` instances.
- **Propagation Step 2:** `src/server/cache.ts:18` — `UnboundedTelemetryCache` map retains 64KB allocated buffers indefinitely.
- **Crash / Leak Site:** `test/leak.test.ts:54` — Assertion failure when listener count or cache entries exceed 0 after all sessions disconnect.

## Reproduction
```bash
npm run build
npm test
# Or run standalone reproduction:
npm run test:reproduce
```

## Auto-Patch & Verification Strategy
1. **Lifecycle Unsubscription (`src/server/session.ts`):** In `ClientSession.disconnect()`, invoke `this.broker.removeListener('telemetry', this.telemetryHandler)` and `this.cache.deleteSessionData(this.sessionId)`.
2. **WeakMap / Eviction Buffer (`src/server/cache.ts`):** Implement LRU or WeakRef-based cache storage to prevent unbounded growth.
3. **Triple-Lock Verification:** Verify single-session disconnects cleanly, full regression suite passes, and 10,000-session stress test maintains 0 dangling listeners and constant heap usage.
