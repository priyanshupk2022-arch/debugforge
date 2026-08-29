/**
 * Tier 4 Real-World Scenario: Multi-File Full Lifecycle Auto-Healing
 * Tests complete autonomous diagnostic cycle on a multi-service micro-application.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, assertTripleLockPassed, assertCausalDAGValid, validateSessionState } = require('../harness');

describe('Tier 4 Scenario: Multi-File Full Lifecycle Auto-Healing', () => {
  it('T4-4: End-to-end multi-file microservice autonomous triage, AST patch synthesis, and verification', async () => {
    const engine = new MockDebugForgeEngine();

    const result = await engine.diagnose({
      errorInput: 'TypeError: Cannot read properties of undefined (reading "toFixed") at order.ts:42',
      testCommand: 'npm test',
      workspacePath: 'fixtures/null-propagation-api',
      autoApprove: true,
    });

    // Validate full session state schema
    validateSessionState({
      sessionId: result.sessionId,
      targetPath: 'fixtures/null-propagation-api',
      testCommand: 'npm test',
      status: result.status,
      currentStep: result.steps.length,
      steps: result.steps,
      parsedError: result.parsedError,
      sandboxResult: result.sandboxResult,
      causalTrace: result.causalTrace,
      patchResult: result.patchResult,
      hitlResponse: result.hitlResponse,
    });

    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');
    assert.ok(result.steps.length >= 5);
    assertTripleLockPassed(result.patchResult.tripleLock);
    assertCausalDAGValid(result.causalTrace);
  });
});
