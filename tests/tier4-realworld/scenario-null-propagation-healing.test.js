/**
 * Tier 4 Real-World Scenario: Null Propagation API Auto-Healing
 * End-to-end autonomous reproduction, dynamic backward causal tracing, AST patching, and verification.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, assertTripleLockPassed } = require('../harness');

describe('Tier 4 Scenario: Null Propagation API Auto-Healing', () => {
  it('T4-1: Executes full auto-healing lifecycle for Null Propagation micro-app', async () => {
    const engine = new MockDebugForgeEngine();

    const rawError = [
      'TypeError: Cannot read properties of undefined (reading "toFixed")',
      '    at formatInvoice (/app/fixtures/null-propagation-api/src/services/order.ts:42:25)',
      '    at checkout (/app/fixtures/null-propagation-api/src/services/order.ts:88:12)',
      '    at /app/fixtures/null-propagation-api/test/order.test.ts:18:9',
    ].join('\n');

    const result = await engine.diagnose({
      errorInput: rawError,
      testCommand: 'npm test',
      workspacePath: 'fixtures/null-propagation-api',
      autoApprove: true,
    });

    // 1. Validate resolution
    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');

    // 2. Validate Root Cause Isolation
    assert.strictEqual(result.causalTrace.rootCause.file, 'db/pool.ts');
    assert.strictEqual(result.causalTrace.crashSite.file, '/app/fixtures/null-propagation-api/src/services/order.ts');

    // 3. Validate Triple-Lock
    assertTripleLockPassed(result.patchResult.tripleLock);

    // 4. Validate unified diff
    assert.ok(result.patchResult.unifiedDiff.includes('--- a/db/pool.ts'));
    assert.ok(result.patchResult.unifiedDiff.includes('+++ b/db/pool.ts'));
  });
});
