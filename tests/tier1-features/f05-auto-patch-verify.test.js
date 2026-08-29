/**
 * Feature F5: MCP Tool `auto_patch_and_verify` Tests
 * Tests AST patch synthesis, unified diff formatting, and Triple-Lock verification.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  MockDebugForgeEngine,
  validatePatchResult,
  assertUnifiedDiffValid,
  assertTripleLockPassed,
} = require('../harness');

describe('Feature F5: MCP Tool `auto_patch_and_verify`', () => {
  const sampleCausalGraph = {
    rootCause: {
      id: 'origin_1',
      type: 'INFECTION_ORIGIN',
      file: 'src/db/pool.ts',
      line: 24,
      symbolName: 'acquireConnection',
      expression: 'return null;',
      description: 'Pool timeout returns null',
    },
    propagationPath: [],
    crashSite: {
      id: 'crash_1',
      type: 'CRASH_SITE',
      file: 'src/orders.ts',
      line: 88,
      symbolName: 'processOrder',
      expression: 'total.toFixed(2)',
      description: 'Crash site',
    },
    confidence: 0.95,
    explanation: 'Database connection pool timeout returns null',
    graphAscii: '[Origin] -> [Crash]',
  };

  it('F5-1: Generates valid unified diff formatting with standard headers', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.auto_patch_and_verify(sampleCausalGraph, '/app');

    validatePatchResult(result);
    assertUnifiedDiffValid(result.unifiedDiff);
    assert.ok(result.unifiedDiff.includes('--- a/src/db/pool.ts'));
    assert.ok(result.unifiedDiff.includes('+++ b/src/db/pool.ts'));
  });

  it('F5-2: Executes Triple-Lock verification and asserts all 3 locks pass', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.auto_patch_and_verify(sampleCausalGraph, '/app');

    assertTripleLockPassed(result.tripleLock);
    assert.strictEqual(result.tripleLock.lock1_targetTest.passed, true);
    assert.strictEqual(result.tripleLock.lock2_fullSuite.passed, true);
    assert.strictEqual(result.tripleLock.lock3_stressTest.passed, true);
    assert.strictEqual(result.tripleLock.score, 100);
  });

  it('F5-3: Records execution metrics (exitCode, durationMs, command) for each lock', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.auto_patch_and_verify(sampleCausalGraph, '/app');

    const locks = [
      result.tripleLock.lock1_targetTest,
      result.tripleLock.lock2_fullSuite,
      result.tripleLock.lock3_stressTest,
    ];

    for (const lock of locks) {
      assert.strictEqual(lock.exitCode, 0);
      assert.ok(lock.durationMs >= 0);
      assert.ok(lock.command.length > 0);
      assert.ok(lock.outputSummary.length > 0);
    }
  });

  it('F5-4: Includes original and patched content buffers in file patch list', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.auto_patch_and_verify(sampleCausalGraph, '/app');

    assert.ok(result.patches.length >= 1);
    const p = result.patches[0];
    assert.strictEqual(p.filePath, 'src/db/pool.ts');
    assert.ok(p.originalContent.length > 0);
    assert.ok(p.patchedContent.length > 0);
    assert.notStrictEqual(p.originalContent, p.patchedContent);
  });

  it('F5-5: Emits unique patch ID and ISO timestamp', async () => {
    const engine = new MockDebugForgeEngine();
    const res1 = await engine.auto_patch_and_verify(sampleCausalGraph, '/app');
    const res2 = await engine.auto_patch_and_verify(sampleCausalGraph, '/app');

    assert.ok(res1.patchId.startsWith('patch_'));
    assert.notStrictEqual(res1.patchId, res2.patchId);
    assert.ok(!isNaN(Date.parse(res1.verifiedAt)));
  });
});
