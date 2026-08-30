# 🩺 Root Cause Analysis (RCA) Red-Team Audit (`audit/RCA-AUDIT.md`)

> **Objective**: Evaluate whether DebugForge accurately distinguishes between the immediate **Crash Site**, the **Proximate Cause**, and the true **Infection Origin**.

---

## 1. Attack Scenarios & Disambiguation Evaluation

### Scenario 1: Silent Null Propagation Across Service Boundaries
- **Crash Site**: `order-service.js:14:22` (Throws `TypeError: Cannot read properties of undefined (reading 'email')`)
- **Proximate Cause**: `user` object is undefined when `user.email` is dereferenced.
- **Infection Origin**: `user-service.js:8:5` (Database pool timeout caught and swallowed returning `undefined`).
- **Naive LLM Behavior**: Patches `order-service.js` with `user?.email || ""` (symptom masking; leaves order without customer data).
- **DebugForge Behavior**: Traces execution back to `user-service.js`, synthesizes retry logic on DB pool exhaustion, and verifies user data is properly propagated.

### Scenario 2: Upstream Async State Mutation
- **Crash Site**: `render.js:45` (Throws invariant violation on negative balance)
- **Proximate Cause**: State balance was set to `-50`.
- **Infection Origin**: `account.js:12` (Missing mutex allowing simultaneous double-withdrawals).
- **DebugForge Behavior**: Isolates concurrent race condition, injects transaction mutex, and verifies via 10/10 concurrency test iterations.

---

## 2. Causal Engine Verification Invariants

1. **Decoupling Invariant**: A tool call to `debugforge_trace_and_analyze` must explicitly output separate entries for `crashSite`, `proximateCause`, and `infectionOrigin`.
2. **Confidence Score**: The causal engine assigns a confidence score ($0.0 - 1.0$) based on stack trace frame depth and runtime evidence.
3. **No Unbacked Claims**: An infection origin is only certified if runtime execution traces or stack frames support data flow from the culprit file.
