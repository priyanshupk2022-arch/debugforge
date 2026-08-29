/**
 * Feature F11: Fixture 1 `null-propagation-api` Tests
 * Tests reproduction, causal tracing, and auto-repair of the silent null cascade bug.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, createTempWorkspace, cleanTempWorkspace } = require('../harness');

describe('Feature F11: Fixture 1 `null-propagation-api`', () => {
  it('F11-1: Simulates DB pool timeout causing silent null cascade in order processing', async () => {
    // Simulated buggy fixture code
    const pool = {
      acquire: async (timeout = true) => (timeout ? null : { query: () => ({ id: 1, name: 'Item' }) }),
    };

    const inventory = {
      getItem: async () => {
        const conn = await pool.acquire(true);
        if (!conn) return null; // Bug: returns null silently
        return conn.query();
      },
    };

    const pricing = {
      calculate: async () => {
        const item = await inventory.getItem();
        if (!item) return {}; // Bug: returns empty object missing total
        return { total: 100 };
      },
    };

    let crashed = false;
    try {
      const p = await pricing.calculate();
      const formatted = p.total.toFixed(2); // Crash site
    } catch (err) {
      crashed = true;
      assert.ok(err instanceof TypeError);
    }
    assert.strictEqual(crashed, true, 'Must deterministically crash on null cascade');
  });

  it('F11-2: Traces blame from order.ts crash site back to db/pool.ts origin', async () => {
    const engine = new MockDebugForgeEngine();
    const errorPayload = {
      errorType: 'TypeError',
      message: 'Cannot read properties of undefined (reading "toFixed")',
      rawLog: 'TypeError: Cannot read properties of undefined\n    at formatOrder (services/order.ts:42:25)',
      stackFrames: [{ file: 'services/order.ts', line: 42, column: 25, functionName: 'formatOrder', isInternal: false }],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/fixtures/null-api' },
    };

    const trace = await engine.trace_and_analyze(errorPayload, '/fixtures/null-api');
    assert.strictEqual(trace.rootCause.file, 'db/pool.ts');
    assert.strictEqual(trace.rootCause.type, 'INFECTION_ORIGIN');
    assert.strictEqual(trace.crashSite.file, 'services/order.ts');
  });

  it('F11-3: Synthesizes surgical AST patch with retry or exception handling', async () => {
    const engine = new MockDebugForgeEngine();
    const trace = {
      rootCause: { id: 'o', type: 'INFECTION_ORIGIN', file: 'src/db/pool.ts', line: 24, symbolName: 'acquireConnection' },
      propagationPath: [],
      crashSite: { id: 'c', type: 'CRASH_SITE', file: 'src/services/order.ts', line: 42, symbolName: 'formatOrder' },
      confidence: 0.95,
      explanation: 'Pool timeout returns null',
      graphAscii: 'G',
    };

    const patchRes = await engine.auto_patch_and_verify(trace, '/fixtures/null-api');
    assert.ok(patchRes.unifiedDiff.includes('retryAcquire()') || patchRes.unifiedDiff.includes('PoolTimeoutException'));
  });

  it('F11-4: Achieves 100% test pass on Triple-Lock verification after patch application', async () => {
    const engine = new MockDebugForgeEngine();
    const trace = {
      rootCause: { id: 'o', type: 'INFECTION_ORIGIN', file: 'src/db/pool.ts', line: 24, symbolName: 'acquireConnection' },
      propagationPath: [],
      crashSite: { id: 'c', type: 'CRASH_SITE', file: 'src/services/order.ts', line: 42, symbolName: 'formatOrder' },
      confidence: 0.95,
      explanation: 'Pool timeout returns null',
      graphAscii: 'G',
    };

    const patchRes = await engine.auto_patch_and_verify(trace, '/fixtures/null-api');
    assert.strictEqual(patchRes.tripleLock.lock1_targetTest.passed, true);
    assert.strictEqual(patchRes.tripleLock.lock2_fullSuite.passed, true);
    assert.strictEqual(patchRes.tripleLock.lock3_stressTest.passed, true);
    assert.strictEqual(patchRes.tripleLock.score, 100);
  });

  it('F11-5: Runs end-to-end `diagnose` flow on Null Propagation API fixture', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.diagnose({
      errorInput: 'TypeError: Cannot read properties of undefined (reading "toFixed") at order.ts:42',
      workspacePath: 'fixtures/null-propagation-api',
      autoApprove: true,
    });

    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');
    assert.strictEqual(result.causalTrace.rootCause.file, 'db/pool.ts');
  });
});
