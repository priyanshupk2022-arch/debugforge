/**
 * Feature F2: MCP Tool `ingest_error` Tests
 * Tests stack trace parsing, test failure extraction, frame context, and payload contracts.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, generateV8StackTrace, validateParsedError } = require('../harness');

describe('Feature F2: MCP Tool `ingest_error`', () => {
  it('F2-1: Parses standard Node.js V8 stack traces into structured frames', async () => {
    const engine = new MockDebugForgeEngine();
    const rawTrace = generateV8StackTrace('TypeError', 'Cannot read properties of null (reading "items")', [
      { functionName: 'calculateTotal', file: '/src/services/pricing.ts', line: 42, column: 15 },
      { functionName: 'processOrder', file: '/src/services/order.ts', line: 88, column: 5 },
    ]);

    const parsed = await engine.ingest_error(rawTrace, 'TypeError');
    validateParsedError(parsed);

    assert.strictEqual(parsed.errorType, 'TypeError');
    assert.strictEqual(parsed.message, 'TypeError: Cannot read properties of null (reading "items")');
    assert.strictEqual(parsed.stackFrames.length, 2);
    assert.strictEqual(parsed.stackFrames[0].file, '/src/services/pricing.ts');
    assert.strictEqual(parsed.stackFrames[0].line, 42);
    assert.strictEqual(parsed.stackFrames[0].column, 15);
    assert.strictEqual(parsed.stackFrames[0].functionName, 'calculateTotal');
  });

  it('F2-2: Distinguishes application frames from internal node_modules frames', async () => {
    const engine = new MockDebugForgeEngine();
    const rawTrace = [
      'Error: Database timeout',
      '    at ConnectionPool.acquire (/app/src/db/pool.ts:24:10)',
      '    at Module._compile (node:internal/modules/cjs/loader:1100:14)',
      '    at Object.runInContext (node_modules/jest-runner/index.js:55:12)',
    ].join('\n');

    const parsed = await engine.ingest_error(rawTrace);
    assert.strictEqual(parsed.stackFrames[0].isInternal, false);
    assert.strictEqual(parsed.stackFrames[1].isInternal, true);
    assert.strictEqual(parsed.stackFrames[2].isInternal, true);
  });

  it('F2-3: Ingests failing test suite metadata and expected/actual assertion data', async () => {
    const engine = new MockDebugForgeEngine();
    const failingTestInfo = {
      suiteName: 'OrderServiceSuite',
      testName: 'should calculate order pricing accurately under pool timeout',
      expected: '200',
      actual: '500',
      errorMessage: 'Expected status 200 but received 500',
    };

    const parsed = await engine.ingest_error('Test failed: OrderServiceSuite', 'AssertionError', failingTestInfo);
    assert.ok(parsed.failingTest, 'failingTest info must be attached');
    assert.strictEqual(parsed.failingTest.suiteName, 'OrderServiceSuite');
    assert.strictEqual(parsed.failingTest.expected, '200');
    assert.strictEqual(parsed.failingTest.actual, '500');
  });

  it('F2-4: Gracefully handles empty or unparseable raw log input with fallback frame', async () => {
    const engine = new MockDebugForgeEngine();
    const parsed = await engine.ingest_error('', 'UnknownError');
    
    validateParsedError(parsed);
    assert.strictEqual(parsed.errorType, 'UnknownError');
    assert.ok(parsed.stackFrames.length >= 1, 'Should populate fallback frame');
  });

  it('F2-5: Captures runtime environment metadata (Node version, platform, cwd)', async () => {
    const engine = new MockDebugForgeEngine();
    const parsed = await engine.ingest_error('ReferenceError: x is not defined');
    
    assert.ok(parsed.environment.nodeVersion.startsWith('v'), 'Must capture valid node version');
    assert.ok(parsed.environment.platform.length > 0, 'Must capture platform');
    assert.ok(parsed.environment.cwd.length > 0, 'Must capture cwd');
  });
});
