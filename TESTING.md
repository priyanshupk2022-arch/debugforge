# 🧪 DebugForge Testing & Verification Guide

## 1. Test Strategy Overview

DebugForge employs a multi-tiered testing strategy spanning unit tests, contract tests, security boundaries, adversarial cases, and full end-to-end golden fixtures.

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST SUITE TIERS                         │
├─────────────────────────┬───────────────────────────────────┤
│ Tier 1: Unit & Contract │ Zod Schemas, Error Parsing, MCP   │
│ Tier 2: Adversarial     │ Nonce Replay, Timeouts, Fail-Close│
│ Tier 3: Golden Fixtures │ Null Cascade, Race, Memory Leak   │
│ Tier 4: Monorepo Build  │ Core, CLI, Web Compilation        │
└─────────────────────────┴───────────────────────────────────┘
```

---

## 2. Test Commands

### Run All Unit & Adversarial Tests
```bash
npm run test
# Runs: node --test packages/core/dist/tests/core.test.js packages/core/dist/tests/adversarial.test.js
```

### Full Monorepo Build Verification
```bash
npm run build:all
# Compiles: packages/core, packages/cli, packages/web
```

### Run Autonomous Golden Fixtures
```bash
# Demo 1: Silent Null Propagation Cascade
npm run demo:null

# Demo 2: Asynchronous Race Condition
npm run demo:race

# Demo 3: Memory Leak Eviction
npm run demo:memory
```

---

## 3. Golden Fixture Test Matrix

| Fixture | Bug Description | Expected Root Cause | Verification Criteria |
| :--- | :--- | :--- | :--- |
| `fixtures/null-propagation-api` | DB pool exhaustion returns `undefined` in `user-service.js:8` | Pool timeout in `user-service.js` | Triple-Lock: 100% tests pass |
| `fixtures/race-condition-app` | Concurrent read-modify-write drops counts | Missing async mutex in `src/index.js` | Triple-Lock: 10/10 concurrency check |
| `fixtures/memory-leak-server` | Unbounded global cache array | Missing LRU ring buffer in `src/index.js` | Triple-Lock: Cache capped at 50 |
