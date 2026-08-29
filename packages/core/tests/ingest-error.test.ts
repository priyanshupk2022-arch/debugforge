import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { IngestErrorTool } from '../src/tools/ingest-error.js';

describe('IngestErrorTool', () => {
  const tool = new IngestErrorTool();

  test('parses Node.js / V8 TypeError stack trace', async () => {
    const rawTrace = `TypeError: Cannot read properties of null (reading 'amount')
    at BillingService.processPayment (c:\\app\\src\\billingService.ts:88:14)
    at OrderService.processOrder (c:\\app\\src\\orderService.ts:45:22)
    at Object.test (c:\\app\\tests\\order.test.ts:18:9)`;

    const parsed = await tool.execute({ rawLog: rawTrace });

    assert.equal(parsed.errorType, 'TypeError');
    assert.match(parsed.message, /Cannot read properties of null/);
    assert.equal(parsed.stackFrames.length, 3);
    assert.equal(parsed.stackFrames[0].functionName, 'BillingService.processPayment');
    assert.equal(parsed.stackFrames[0].line, 88);
    assert.equal(parsed.stackFrames[0].column, 14);
    assert.equal(parsed.stackFrames[0].isInternal, false);
  });

  test('parses failing test runner logs', async () => {
    const testLog = `✖ Order Processing Test
  AssertionError [ERR_ASSERTION]: Expected status 200 but got 500
    at c:\\app\\tests\\api.test.ts:32:10`;

    const parsed = await tool.execute({ testOutput: testLog });

    assert.equal(parsed.errorType, 'AssertionError');
    assert.ok(parsed.failingTest);
    assert.equal(parsed.failingTest?.testName, 'Order Processing Test');
    assert.match(parsed.failingTest?.errorMessage || '', /500/);
  });

  test('filters internal node runtime frames', async () => {
    const mixedTrace = `ReferenceError: config is not defined
    at init (c:\\app\\src\\index.ts:12:5)
    at Module._compile (node:internal/modules/cjs/loader:1234:14)
    at node:internal/main/run_main_module:28:49`;

    const parsed = await tool.execute({ rawLog: mixedTrace });

    assert.equal(parsed.stackFrames[0].isInternal, false);
    assert.equal(parsed.stackFrames[1].isInternal, true);
    assert.equal(parsed.stackFrames[2].isInternal, true);
  });
});
