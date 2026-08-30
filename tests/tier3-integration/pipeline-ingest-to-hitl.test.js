/**
 * Tier 3 Integration Tests: Pipeline Ingest to HITL
 * Tests full 5-stage MCP pipeline chaining from error ingestion to human sign-off.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, assertTripleLockPassed, assertCausalDAGValid } = require('../harness');

describe('Tier 3: Pipeline Ingest to HITL', () => {
  it('T3-1: Chains ingest_error -> reproduce -> trace -> patch -> hitl seamlessly', async () => {
    const engine = new MockDebugForgeEngine();

    // 1. Ingest
    const rawError = 'TypeError: Cannot read properties of null (reading "query")\n    at queryDb (src/db/pool.ts:24:10)';
    const parsed = await engine.ingest_error(rawError, 'TypeError');
    assert.strictEqual(parsed.errorType, 'TypeError');

    // 2. Reproduce
    const sandboxRes = await engine.reproduce_in_sandbox('/app', 'npm test');
    assert.ok(sandboxRes.sandboxId);
    assert.strictEqual(typeof sandboxRes.reproduced, 'boolean');

    // 3. Trace
    const trace = await engine.trace_and_analyze(parsed, '/app');
    assertCausalDAGValid(trace);

    // 4. Patch & Verify
    const patchRes = await engine.auto_patch_and_verify(trace, '/app');
    assertTripleLockPassed(patchRes.tripleLock);

    // 5. HITL Gate
    const hitlRes = await engine.hitl_approval(patchRes, trace, 'APPLY', 'Verified pipeline pass');
    assert.strictEqual(hitlRes.decision, 'APPLY');
    assert.strictEqual(engine.status, 'APPLIED');
  });

  it('T3-2: Halts pipeline transition if HITL operator issues REJECT decision', async () => {
    const engine = new MockDebugForgeEngine();
    const parsed = await engine.ingest_error('Error: sample');
    const trace = await engine.trace_and_analyze(parsed, '/app');
    const patch = await engine.auto_patch_and_verify(trace, '/app');

    const hitl = await engine.hitl_approval(patch, trace, 'REJECT', 'Operator rejected diff');
    assert.strictEqual(hitl.decision, 'REJECT');
    assert.strictEqual(engine.status, 'FAILED');
  });
});
