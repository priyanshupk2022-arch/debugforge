/**
 * Tier 3 Integration Tests: Triple-Lock Differential Verification
 * Tests sequential execution and gatekeeping of Locks 1, 2, and 3.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, assertTripleLockPassed } = require('../harness');

describe('Tier 3: Triple-Lock Differential Verification', () => {
  it('T3-5: Enforces sequential execution of Lock 1 (Target Test) -> Lock 2 (Full Suite) -> Lock 3 (Stress Test)', async () => {
    const engine = new MockDebugForgeEngine();
    const trace = {
      rootCause: { id: 'o', type: 'INFECTION_ORIGIN', file: 'pool.ts', line: 24, symbolName: 'acq' },
      propagationPath: [],
      crashSite: { id: 'c', type: 'CRASH_SITE', file: 'order.ts', line: 42, symbolName: 'ord' },
      confidence: 0.95,
      explanation: 'Pool timeout',
      graphAscii: 'G',
    };

    const patchRes = await engine.auto_patch_and_verify(trace, '/app');
    assertTripleLockPassed(patchRes.tripleLock);

    assert.strictEqual(patchRes.tripleLock.lock1_targetTest.lockName, 'Lock 1 (Target Test)');
    assert.strictEqual(patchRes.tripleLock.lock2_fullSuite.lockName, 'Lock 2 (Full Suite)');
    assert.strictEqual(patchRes.tripleLock.lock3_stressTest.lockName, 'Lock 3 (Stress Test)');
  });

  it('T3-6: Detects regression when full suite fails (Lock 2 failure) and blocks patch deployment', () => {
    const failingTripleLock = {
      lock1_targetTest: { lockName: 'Lock 1 (Target Test)', passed: true, command: 'npm test', exitCode: 0, durationMs: 10, outputSummary: 'ok' },
      lock2_fullSuite: { lockName: 'Lock 2 (Full Suite)', passed: false, command: 'npm test', exitCode: 1, durationMs: 20, outputSummary: '2 regressions found' },
      lock3_stressTest: { lockName: 'Lock 3 (Stress Test)', passed: true, command: 'npm test', exitCode: 0, durationMs: 30, outputSummary: 'ok' },
      allPassed: false,
      score: 66,
    };

    assert.strictEqual(failingTripleLock.allPassed, false);
    assert.ok(failingTripleLock.score < 100);
  });
});
