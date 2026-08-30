# 🎬 DEBUGFORGE FINAL CANONICAL LIVE DEMO RUN

**Target Commit:** `1300f55`  
**Demo Target:** `fixtures/null-propagation-api`  
**Command:** `debugforge diagnose --target fixtures/null-propagation-api`  
**Environment:** Live TrueForge MCP Server + Local Deterministic Sandbox Adapter  

---

## 1. Canonical 5-Stage Demo Execution Trace

```
┌─────────────────────────────────────────────────────────────┐
│                    DEBUGFORGE CLI v1.0.0                    │
│      Autonomous AI Debugging & Sandbox Remediation          │
└─────────────────────────────────────────────────────────────┘
  Provider: Anthropic / claude-3-5-sonnet-latest (Adaptive Routing)
  Target:   fixtures/null-propagation-api
  Test Cmd: npm test

[SANDBOX] Stage 1: Ingesting error signals and provisioning isolated execution workspace...
✔ Sandbox workspace provisioned: ws_null_propagation_7fa1 (mode: LOCAL_DETERMINISTIC_ADAPTER)
✖ Reproduction test failed (Exit Code 1):
  TypeError: Cannot read properties of undefined (reading 'tier')
    at calculateDiscount (src/services/pricing-service.ts:18:24)
    at checkoutOrder (src/controllers/order-controller.ts:42:12)

[MODEL REASONING] Stage 2: Constructing backward causal provenance DAG...
✔ Proximate Crash Site: src/services/pricing-service.ts:18
✔ Root Infection Origin: src/controllers/order-controller.ts:39 (Passed undefined customer record)
✔ Causal Confidence: 0.88 (Decoupled from crash site)

[BRT SYNTHESIS] Stage 3: Synthesizing deterministic Bug Reproduction Test...
✔ BRT test generated: test/brt-null-propagation.test.js
✔ Pre-patch validation: Exit Code 1 [BRT_DEFECT_REPRODUCED] confirmed.

[AUTO-PATCH] Stage 4: Synthesizing minimal surgical AST patch & Blast Radius...
✔ Culprit File: src/services/pricing-service.ts
✔ Blast Radius: 2 direct callers (order-controller.ts, invoice-service.ts), 1 test file (pricing.test.ts)
✔ Scope Widening: Full regression suite recommended.

[TRIPLE-LOCK] Evaluating Verification Gates:
  ✔ Lock 1 (Bug Fixed): Original defect reproduction resolved (Exit Code 0).
  ✔ Lock 2 (No Regressions): All existing tests pass (100% pass rate).
  ✔ Lock 3 (Stress Verified): Mutation verification score 1.0 (2/2 mutants killed).
  ✔ Anti-Gaming Sentinel: 0 cheating anti-patterns detected.
  ✔ Oracle State: INFERRED (Ready for Human Gatekeeper).

┌─────────────────────────────────────────────────────────────┐
│              ✋ HUMAN-IN-THE-LOOP APPROVAL GATE              │
└─────────────────────────────────────────────────────────────┘
  Status:           AWAITING_APPROVAL
  Single-Use Nonce: c9f4b82d3e1a0f7b9c2a1e8d4f0b6e3a
  Files Affected:   1 file(s) (src/services/pricing-service.ts)
  Verification:     Triple-Lock Gates Verified (100% test pass)
  Risk Level:       LOW (Confined strictly to identified culprit AST nodes)

  Apply verified patch to workspace? (y/N): y

  ✔ [OPERATOR SIGN-OFF] Human approval granted (Nonce: c9f4b82d3e1a0f7b9c2a1e8d4f0b6e3a).
  ✔ Verified patch applied to workspace.
  ✔ Execution Duration: 1,420ms | Provider: Anthropic (claude-3-5-sonnet-latest)
```
