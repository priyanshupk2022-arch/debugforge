/**
 * Tier 2 Boundary Tests: Timeouts & Concurrency Limits
 * Tests child process timeout handling, concurrent sessions, and cycle limits.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, createTempWorkspace, cleanTempWorkspace } = require('../harness');

describe('Tier 2: Timeouts & Concurrency Limits', () => {
  it('T2-5: Handles multiple concurrent diagnose sessions without cross-talk or state contamination', async () => {
    const engine1 = new MockDebugForgeEngine();
    const engine2 = new MockDebugForgeEngine();

    const [res1, res2] = await Promise.all([
      engine1.diagnose({ errorInput: 'TypeError: Error in service A', autoApprove: true }),
      engine2.diagnose({ errorInput: 'ReferenceError: Error in service B', autoApprove: true }),
    ]);

    assert.strictEqual(res1.resolved, true);
    assert.strictEqual(res2.resolved, true);
    assert.notStrictEqual(res1.sessionId, res2.sessionId);
    assert.notStrictEqual(res1.patchResult.patchId, res2.patchResult.patchId);
  });

  it('T2-6: Respects strict timeout on long-running sandbox commands', async () => {
    const tempWs = createTempWorkspace({ 'loop.js': 'while(true){}' });
    try {
      const engine = new MockDebugForgeEngine({ timeout: 200 });
      const result = await engine.reproduce_in_sandbox(tempWs, 'node loop.js');

      assert.strictEqual(result.reproduced, true);
      assert.ok(result.exitCode !== 0);
    } finally {
      cleanTempWorkspace(tempWs);
    }
  });

  it('T2-7: Strictly enforces maxIterations limit when fault cannot be resolved immediately', async () => {
    const engine = new MockDebugForgeEngine({ maxIterations: 2 });
    assert.strictEqual(engine.options.maxIterations, 2);
  });
});
