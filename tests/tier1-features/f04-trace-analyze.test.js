/**
 * Feature F4: MCP Tool `trace_and_analyze` Tests
 * Tests dynamic backward causal tracing, infection origin isolation, DAG structure, and ASCII rendering.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, validateCausalGraph, assertCausalDAGValid } = require('../harness');

describe('Feature F4: MCP Tool `trace_and_analyze`', () => {
  it('F4-1: Isolates infection origin (root cause) from downstream crash site', async () => {
    const engine = new MockDebugForgeEngine();
    const parsedError = {
      errorType: 'TypeError',
      message: 'Cannot read properties of null (reading "items")',
      rawLog: 'TypeError: Cannot read properties of null\n    at processOrder (orders.ts:88:12)',
      stackFrames: [
        { file: 'orders.ts', line: 88, column: 12, functionName: 'processOrder', isInternal: false },
      ],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/app' },
    };

    const graph = await engine.trace_and_analyze(parsedError, '/app');
    validateCausalGraph(graph);
    assertCausalDAGValid(graph);

    assert.strictEqual(graph.rootCause.type, 'INFECTION_ORIGIN');
    assert.strictEqual(graph.rootCause.file, 'db/pool.ts');
    assert.strictEqual(graph.rootCause.line, 24);

    assert.strictEqual(graph.crashSite.type, 'CRASH_SITE');
    assert.strictEqual(graph.crashSite.file, 'orders.ts');
    assert.strictEqual(graph.crashSite.line, 88);
  });

  it('F4-2: Builds valid propagation path connecting root cause to crash site', async () => {
    const engine = new MockDebugForgeEngine();
    const parsedError = {
      errorType: 'TypeError',
      message: 'Cannot read properties of null',
      rawLog: '',
      stackFrames: [{ file: 'orders.ts', line: 42, column: 1, functionName: 'checkout', isInternal: false }],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/app' },
    };

    const graph = await engine.trace_and_analyze(parsedError, '/app');
    assert.ok(graph.propagationPath.length >= 2, 'Propagation path should contain intermediate nodes');
    assert.strictEqual(graph.propagationPath[0].type, 'PROPAGATION_STEP');
    assert.strictEqual(graph.propagationPath[1].type, 'PROPAGATION_STEP');
  });

  it('F4-3: Generates clean ASCII visual DAG representation', async () => {
    const engine = new MockDebugForgeEngine();
    const parsedError = {
      errorType: 'TypeError',
      message: 'Null pointer exception',
      rawLog: '',
      stackFrames: [{ file: 'main.ts', line: 10, column: 1, functionName: 'run', isInternal: false }],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/app' },
    };

    const graph = await engine.trace_and_analyze(parsedError, '/app');
    assert.ok(graph.graphAscii.includes('[Infection Origin]'), 'ASCII graph must have [Infection Origin]');
    assert.ok(graph.graphAscii.includes('[Crash Site]'), 'ASCII graph must have [Crash Site]');
    assert.ok(graph.graphAscii.includes('│') || graph.graphAscii.includes('▼'), 'ASCII graph must have directional arrows');
  });

  it('F4-4: Emits confidence score between 0.0 and 1.0', async () => {
    const engine = new MockDebugForgeEngine();
    const parsedError = {
      errorType: 'AssertionError',
      message: 'AssertionError: balance dropped below zero',
      rawLog: '',
      stackFrames: [{ file: 'account.ts', line: 52, column: 1, functionName: 'verify', isInternal: false }],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/app' },
    };

    const graph = await engine.trace_and_analyze(parsedError, '/app');
    assert.ok(graph.confidence >= 0.8 && graph.confidence <= 1.0, 'Confidence must be high for deterministic race trace');
  });

  it('F4-5: Identifies root cause for concurrency race condition archetype', async () => {
    const engine = new MockDebugForgeEngine();
    const parsedError = {
      errorType: 'AssertionError',
      message: 'Account balance corrupted: -$900',
      rawLog: '',
      stackFrames: [{ file: 'wallet/account.ts', line: 30, column: 1, functionName: 'withdraw', isInternal: false }],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/app' },
    };

    const graph = await engine.trace_and_analyze(parsedError, '/app');
    assert.strictEqual(graph.rootCause.file, 'wallet/account.ts');
    assert.strictEqual(graph.rootCause.symbolName, 'transfer');
    assert.ok(graph.explanation.includes('Non-atomic'));
  });
});
