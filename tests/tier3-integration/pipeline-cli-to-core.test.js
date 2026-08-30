/**
 * Tier 3 Integration Tests: CLI Bridge to Core Engine
 * Tests event streaming and data flow from Core engine into CLI / TUI interface.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, stripAnsi } = require('../harness');

describe('Tier 3: CLI Bridge to Core Engine', () => {
  it('T3-3: Streams ReAct thoughts and tool actions in real time to CLI listener', async () => {
    const receivedSteps = [];
    const engine = new MockDebugForgeEngine({
      onStepStream: (step) => {
        receivedSteps.push(step);
      },
    });

    const result = await engine.diagnose({
      errorInput: 'TypeError: Order processing failed',
      autoApprove: true,
    });

    assert.ok(receivedSteps.length >= 5);
    assert.strictEqual(receivedSteps[0].type, 'THOUGHT');
    assert.strictEqual(result.resolved, true);
  });

  it('T3-4: Propagates user approval from interactive CLI prompt back to Engine HITL handler', async () => {
    let capturedProposal = null;
    const engine = new MockDebugForgeEngine({
      hitlHandler: async (proposal) => {
        capturedProposal = proposal;
        return 'APPLY';
      },
    });

    const result = await engine.diagnose({
      errorInput: 'Error: Database connection timeout',
    });

    assert.ok(capturedProposal);
    assert.ok(capturedProposal.targetFile.includes('db/pool.ts'));
    assert.strictEqual(result.hitlResponse.decision, 'APPLY');
    assert.strictEqual(result.status, 'APPLIED');
  });
});
