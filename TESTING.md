# 🧪 DebugForge Testing & Verification Guide

## 1. Test Strategy Overview

DebugForge employs an isolated, multi-tiered testing strategy with clear separation between deterministic CI tests, live TrueForge harness topology verification, and opt-in real provider smoke testing.

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST SUITE TIERS                         │
├─────────────────────────┬───────────────────────────────────┤
│ Tier 1: Unit & Security │ Zod Schemas, HITL Nonce, Parsing  │
│ Tier 2: TrueForge Live  │ Real TF Server, Session, MCP SSE  │
│ Tier 3: Real Provider   │ Opt-In Real LLM Smoke Test        │
│ Tier 4: Golden Fixtures │ Null Cascade, Race, Memory Leak   │
└─────────────────────────┴───────────────────────────────────┘
```

---

## 2. Test Commands & Executions

### A. Multi-Tier Offline Test Suite (`npm test`)
Executes unit, contract, and security boundary tests offline without external network dependencies:
```bash
npm test
```
- **Adversarial & Security Boundary Suite**: Anti-replay nonce protection, tamper detection on modified patch diffs, fail-closed behavior on missing credentials, malformed log parsing resilience.
- **Core Engine Suite**: Error ingestion and classification, 5 TrueForge MCP tools registration, provider dynamic resolution across Anthropic/Google/OpenAI/Custom, complexity-based model routing, and disk patch application via `applyPatch`.
- **TrueForge SDK Architecture Test**: Verifies official `@truefoundry/trueforge-sdk` client structure and fail-closed gates.

### B. Deterministic TrueForge Live Integration Gate (`npm run test:live`)
Verifies full end-to-end TrueForge server integration using a local TrueForge instance and deterministic mock completions for CI:
```bash
npm run test:live
```
- Starts local TrueForge server (`http://localhost:8790`).
- Starts real DebugForge Streamable HTTP/SSE MCP server (`http://localhost:3101/sse`).
- Verifies real server session creation, turn stream emission, tool invocation (`call_tool` -> `debugforge_ingest_error`), and observation return.
- Verifies Human-in-the-Loop single-use nonce lifecycle.
- Asserts fail-closed behavior for unreachable TrueForge server and unreachable MCP endpoints.

### C. Real Multi-Provider Smoke Test (`npm run test:provider`)
Opt-in smoke test connecting to live LLM providers (Anthropic, Google Gemini, OpenAI, DeepSeek). Gated behind `REAL_PROVIDER_TEST=true` to prevent unintentional API usage or costs in CI:
```bash
# Example: Google Gemini Smoke Test
DEBUGFORGE_MODEL_PROVIDER=google GEMINI_API_KEY="..." REAL_PROVIDER_TEST=true npm run test:provider

# Example: Anthropic Smoke Test
DEBUGFORGE_MODEL_PROVIDER=anthropic ANTHROPIC_API_KEY="..." REAL_PROVIDER_TEST=true npm run test:provider

# Example: OpenAI Smoke Test
DEBUGFORGE_MODEL_PROVIDER=openai OPENAI_API_KEY="..." REAL_PROVIDER_TEST=true npm run test:provider
```

---

## 3. Golden Fixture Test Matrix

| Fixture | Bug Description | Expected Root Cause | Verification Criteria |
| :--- | :--- | :--- | :--- |
| `fixtures/null-propagation-api` | DB pool exhaustion returns `undefined` in `user-service.js:8` | Pool timeout in `user-service.js` | Triple-Lock: 100% tests pass |
| `fixtures/race-condition-app` | Concurrent read-modify-write drops counts | Missing async mutex in `src/index.js` | Triple-Lock: 10/10 concurrency check |
| `fixtures/memory-leak-server` | Unbounded global cache array | Missing LRU ring buffer in `src/index.js` | Triple-Lock: Cache capped at 50 |
