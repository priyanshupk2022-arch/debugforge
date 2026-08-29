/**
 * Feature F6: MCP Tool `hitl_approval` Tests
 * Tests Human-in-the-Loop approval gate decisions (APPLY, EDIT, REJECT, EXPLAIN).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, validateHITLResponse } = require('../harness');

describe('Feature F6: MCP Tool `hitl_approval`', () => {
  const dummyPatch = {
    patchId: 'patch_123',
    patches: [{ filePath: 'src/db.ts', originalContent: 'a', patchedContent: 'b', diff: '+b' }],
    unifiedDiff: '--- a/src/db.ts\n+++ b/src/db.ts\n@@ -1 +1 @@\n-a\n+b',
    tripleLock: {
      lock1_targetTest: { lockName: 'Lock 1 (Target Test)', passed: true, command: 'npm test', exitCode: 0, durationMs: 10, outputSummary: 'ok' },
      lock2_fullSuite: { lockName: 'Lock 2 (Full Suite)', passed: true, command: 'npm test', exitCode: 0, durationMs: 20, outputSummary: 'ok' },
      lock3_stressTest: { lockName: 'Lock 3 (Stress Test)', passed: true, command: 'npm test', exitCode: 0, durationMs: 30, outputSummary: 'ok' },
      allPassed: true,
      score: 100,
    },
    verifiedAt: new Date().toISOString(),
  };

  const dummyCausal = {
    rootCause: { id: 'o1', type: 'INFECTION_ORIGIN', file: 'src/db.ts', line: 1, symbolName: 'fn', expression: 'x', description: 'desc' },
    propagationPath: [],
    crashSite: { id: 'c1', type: 'CRASH_SITE', file: 'src/api.ts', line: 10, symbolName: 'run', expression: 'y', description: 'desc' },
    confidence: 0.9,
    explanation: 'Test explanation',
    graphAscii: 'ASCII_GRAPH',
  };

  it('F6-1: Handles APPLY decision and transitions engine to APPLIED state', async () => {
    const engine = new MockDebugForgeEngine();
    const res = await engine.hitl_approval(dummyPatch, dummyCausal, 'APPLY', 'Approved by lead dev');

    validateHITLResponse(res);
    assert.strictEqual(res.decision, 'APPLY');
    assert.strictEqual(engine.status, 'APPLIED');
    assert.strictEqual(res.feedback, 'Approved by lead dev');
  });

  it('F6-2: Handles REJECT decision and transitions engine to FAILED state', async () => {
    const engine = new MockDebugForgeEngine();
    const res = await engine.hitl_approval(dummyPatch, dummyCausal, 'REJECT', 'Needs alternative approach');

    validateHITLResponse(res);
    assert.strictEqual(res.decision, 'REJECT');
    assert.strictEqual(engine.status, 'FAILED');
    assert.strictEqual(res.feedback, 'Needs alternative approach');
  });

  it('F6-3: Handles custom interactive hitlHandler callback hook', async () => {
    let receivedProposal = null;
    const engine = new MockDebugForgeEngine({
      hitlHandler: async (proposal) => {
        receivedProposal = proposal;
        return 'APPLY';
      },
    });

    const res = await engine.hitl_approval(dummyPatch, dummyCausal);
    assert.ok(receivedProposal, 'Proposal must be forwarded to hitlHandler');
    assert.strictEqual(receivedProposal.patchId, 'patch_123');
    assert.strictEqual(receivedProposal.targetFile, 'src/db.ts');
    assert.strictEqual(receivedProposal.tripleLockStatus.lock1OriginalPass, true);
    assert.strictEqual(res.decision, 'APPLY');
  });

  it('F6-4: Records operator identifier and ISO timestamp', async () => {
    const engine = new MockDebugForgeEngine();
    const res = await engine.hitl_approval(dummyPatch, dummyCausal, 'APPLY');

    assert.ok(res.operator.length > 0);
    assert.ok(!isNaN(Date.parse(res.timestamp)));
  });

  it('F6-5: Preserves modified diff when operator submits EDIT decision', async () => {
    const customModifiedDiff = '--- a/src/db.ts\n+++ b/src/db.ts\n@@ -1 +1 @@\n-a\n+custom_b';
    const engine = new MockDebugForgeEngine({
      hitlHandler: async () => 'EDIT',
    });

    const res = await engine.hitl_approval(dummyPatch, dummyCausal, 'EDIT', 'Manual refinement');
    assert.strictEqual(res.decision, 'EDIT');
    assert.strictEqual(res.feedback, 'Manual refinement');
  });
});
