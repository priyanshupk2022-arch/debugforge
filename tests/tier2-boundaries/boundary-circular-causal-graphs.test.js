/**
 * Tier 2 Boundary Tests: Circular Causal Graphs & Recursion
 * Tests DAG cycle detection, recursive call stack resolution, and deep call chains.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, assertCausalDAGValid } = require('../harness');

describe('Tier 2: Circular Causal Graphs & Recursion', () => {
  it('T2-8: Prevents cyclic loops in dynamic causal graph generation on recursive functions', async () => {
    const engine = new MockDebugForgeEngine();
    const recursiveError = {
      errorType: 'RangeError',
      message: 'Maximum call stack size exceeded',
      rawLog: 'RangeError: Maximum call stack size exceeded\n    at a (fn.ts:1:1)\n    at b (fn.ts:2:1)\n    at a (fn.ts:1:1)',
      stackFrames: [
        { file: 'fn.ts', line: 1, column: 1, functionName: 'a', isInternal: false },
        { file: 'fn.ts', line: 2, column: 1, functionName: 'b', isInternal: false },
        { file: 'fn.ts', line: 1, column: 1, functionName: 'a', isInternal: false },
      ],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/app' },
    };

    const graph = await engine.trace_and_analyze(recursiveError, '/app');
    assertCausalDAGValid(graph);
    assert.strictEqual(graph.rootCause.type, 'INFECTION_ORIGIN');
    assert.strictEqual(graph.crashSite.type, 'CRASH_SITE');
  });

  it('T2-9: Unwinds deep call chain (50 levels) into concise blame graph without duplicate node IDs', async () => {
    const engine = new MockDebugForgeEngine();
    const deepFrames = [];
    for (let i = 1; i <= 50; i++) {
      deepFrames.push({ file: `step_${i}.ts`, line: i, column: 1, functionName: `step_${i}`, isInternal: false });
    }

    const deepError = {
      errorType: 'TypeError',
      message: 'Deep cascade error',
      rawLog: '',
      stackFrames: deepFrames,
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/app' },
    };

    const graph = await engine.trace_and_analyze(deepError, '/app');
    assertCausalDAGValid(graph);
  });
});
