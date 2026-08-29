/**
 * Tier 3 Integration Tests: Watch Mode Auto-Debug Pipeline
 * Tests continuous background watch triggering auto-healing upon test failure.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine } = require('../harness');

describe('Tier 3: Watch Mode Auto-Debug Pipeline', () => {
  it('T3-7: Completes end-to-end watch triggered diagnosis cycle', async () => {
    const engine = new MockDebugForgeEngine();
    const watchGen = engine.watch('/app', 'npm test');

    const result = (await watchGen.next()).value;
    assert.ok(result);
    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');
    assert.ok(result.patchResult.tripleLock.allPassed);
  });
});
