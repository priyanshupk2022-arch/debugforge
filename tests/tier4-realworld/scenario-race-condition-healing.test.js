/**
 * Tier 4 Real-World Scenario: Race Condition App Auto-Healing
 * End-to-end autonomous reproduction, dynamic backward causal tracing, mutex injection, and verification.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, assertTripleLockPassed } = require('../harness');

describe('Tier 4 Scenario: Race Condition App Auto-Healing', () => {
  it('T4-2: Executes full auto-healing lifecycle for Race Condition micro-app', async () => {
    const engine = new MockDebugForgeEngine();

    const rawError = [
      'AssertionError: Expected account balance >= 0, but received -900',
      '    at assertLedger (/app/fixtures/race-condition-app/test/concurrency.test.ts:38:5)',
      '    at async Promise.all (/app/fixtures/race-condition-app/test/concurrency.test.ts:25:3)',
    ].join('\n');

    const result = await engine.diagnose({
      errorInput: rawError,
      testCommand: 'npm test',
      workspacePath: 'fixtures/race-condition-app',
      autoApprove: true,
    });

    // 1. Validate resolution
    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');

    // 2. Validate Root Cause Isolation
    assert.strictEqual(result.causalTrace.rootCause.file, 'wallet/account.ts');
    assert.strictEqual(result.causalTrace.rootCause.symbolName, 'transfer');

    // 3. Validate Triple-Lock Lock 3 Concurrency Pass
    assertTripleLockPassed(result.patchResult.tripleLock);
    assert.strictEqual(result.patchResult.tripleLock.lock3_stressTest.passed, true);
  });
});
