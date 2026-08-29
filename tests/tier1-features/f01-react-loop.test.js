/**
 * Feature F1: ReAct Reasoning Loop Tests
 * Tests state machine transitions, step streaming, cycle limits, and convergence.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, validateReActStep } = require('../harness');

describe('Feature F1: ReAct Reasoning Loop', () => {
  it('F1-1: Transitions through expected ReAct lifecycle states', async () => {
    const engine = new MockDebugForgeEngine();
    assert.strictEqual(engine.status, 'IDLE');

    const result = await engine.diagnose({
      errorInput: 'TypeError: Cannot read properties of undefined',
      testCommand: 'npm test',
      autoApprove: true,
    });

    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');
    assert.ok(result.steps.length >= 5, 'Should have executed at least 5 ReAct steps');
  });

  it('F1-2: Streams ReAct steps sequentially with monotonically increasing indices', async () => {
    const streamedSteps = [];
    const engine = new MockDebugForgeEngine({
      onStepStream: (step) => {
        validateReActStep(step);
        streamedSteps.push(step);
      },
    });

    await engine.diagnose({
      errorInput: 'AssertionError: balance < 0',
      autoApprove: true,
    });

    assert.ok(streamedSteps.length >= 5, 'Should have received streamed steps');
    for (let i = 0; i < streamedSteps.length; i++) {
      assert.strictEqual(streamedSteps[i].stepIndex, i + 1, `Step index at ${i} should be ${i + 1}`);
    }
  });

  it('F1-3: Enforces max iterations limit and prevents unbounded loops', async () => {
    const engine = new MockDebugForgeEngine({ maxIterations: 3 });
    assert.strictEqual(engine.options.maxIterations, 3);
    
    const result = await engine.diagnose({
      errorInput: 'Simulated recursive failure',
      autoApprove: true,
    });

    assert.ok(result.steps.length <= 10, 'Step count must stay bounded by iteration control');
  });

  it('F1-4: Records valid step types (THOUGHT, ACTION, OBSERVATION, SYNTHESIS)', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.diagnose({
      errorInput: 'RangeError: Maximum call stack size exceeded',
      autoApprove: true,
    });

    const stepTypes = result.steps.map(s => s.type);
    assert.ok(stepTypes.includes('THOUGHT'), 'Must record THOUGHT step');
    assert.ok(stepTypes.includes('ACTION'), 'Must record ACTION step');
    assert.ok(stepTypes.includes('OBSERVATION'), 'Must record OBSERVATION step');
    assert.ok(stepTypes.includes('SYNTHESIS'), 'Must record SYNTHESIS step');
  });

  it('F1-5: Emits valid timestamps and duration metrics on every step', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.diagnose({
      errorInput: 'Error: Connection lost',
      autoApprove: true,
    });

    for (const step of result.steps) {
      assert.ok(typeof step.durationMs === 'number' && step.durationMs >= 0, 'Duration must be non-negative number');
      assert.ok(!isNaN(Date.parse(step.timestamp)), 'Timestamp must be valid ISO string');
    }
  });
});
