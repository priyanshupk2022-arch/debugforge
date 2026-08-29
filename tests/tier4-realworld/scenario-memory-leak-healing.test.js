/**
 * Tier 4 Real-World Scenario: Memory Leak Server Auto-Healing
 * End-to-end autonomous reproduction, dynamic backward causal tracing, unsubscription repair, and verification.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, assertTripleLockPassed } = require('../harness');

describe('Tier 4 Scenario: Memory Leak Server Auto-Healing', () => {
  it('T4-3: Executes full auto-healing lifecycle for Memory Leak micro-app', async () => {
    const engine = new MockDebugForgeEngine();

    const rawError = [
      'MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1001 telemetry listeners added to [MetricsEmitter].',
      '    at ClientSession.create (/app/fixtures/memory-leak-server/src/server/session.ts:22:15)',
      '    at /app/fixtures/memory-leak-server/test/leak.test.ts:44:5',
    ].join('\n');

    const result = await engine.diagnose({
      errorInput: rawError,
      testCommand: 'npm test',
      workspacePath: 'fixtures/memory-leak-server',
      autoApprove: true,
    });

    // 1. Validate resolution
    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');

    // 2. Validate Root Cause Isolation
    assert.strictEqual(result.causalTrace.rootCause.file, 'server/session.ts');
    assert.strictEqual(result.causalTrace.rootCause.line, 22);

    // 3. Validate Triple-Lock
    assertTripleLockPassed(result.patchResult.tripleLock);
  });
});
