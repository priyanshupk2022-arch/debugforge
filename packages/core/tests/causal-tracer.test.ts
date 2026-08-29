import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BackwardCausalTracer } from '../src/tracer/causal-tracer.js';
import { ParsedErrorPayload } from '../src/types/index.js';

describe('BackwardCausalTracer', () => {
  let tempWs: string;

  test('traces null propagation cascade to infection origin', async () => {
    tempWs = path.join(os.tmpdir(), `df_trace_null_${Date.now()}`);
    fs.mkdirSync(path.join(tempWs, 'src'), { recursive: true });

    fs.writeFileSync(
      path.join(tempWs, 'src', 'db.ts'),
      `export async function getConnection() {
  // Database connection pool timeout returns null
  return null;
}`
    );

    fs.writeFileSync(
      path.join(tempWs, 'src', 'orderService.ts'),
      `import { getConnection } from './db.js';
export async function createOrder() {
  const conn = await getConnection();
  return { conn };
}`
    );

    fs.writeFileSync(
      path.join(tempWs, 'src', 'billingService.ts'),
      `export async function charge(order: any) {
  return order.conn.query();
}`
    );

    const tracer = new BackwardCausalTracer({ workspacePath: tempWs });

    const parsedError: ParsedErrorPayload = {
      errorType: 'TypeError',
      message: "Cannot read properties of null (reading 'query')",
      rawLog: 'TypeError: Cannot read properties of null (reading query)',
      stackFrames: [
        {
          file: path.join(tempWs, 'src', 'billingService.ts'),
          line: 2,
          column: 16,
          functionName: 'charge',
          isInternal: false,
        },
        {
          file: path.join(tempWs, 'src', 'orderService.ts'),
          line: 4,
          column: 10,
          functionName: 'createOrder',
          isInternal: false,
        },
      ],
      environment: { nodeVersion: 'v22.0.0', platform: 'win32', cwd: tempWs },
    };

    const graph = await tracer.trace(parsedError);

    assert.equal(graph.crashSite.type, 'CRASH_SITE');
    assert.equal(graph.rootCause.type, 'INFECTION_ORIGIN');
    assert.ok(graph.propagationPath.length >= 1);
    assert.ok(graph.confidence >= 0.9);
    assert.ok(graph.graphAscii.includes('INFECTION ORIGIN'));
    assert.ok(graph.graphAscii.includes('CRASH SITE'));
    assert.ok(graph.explanation.includes('Dynamic Backward Causal Tracing'));

    fs.rmSync(tempWs, { recursive: true, force: true });
  });

  test('traces concurrency race condition', async () => {
    tempWs = path.join(os.tmpdir(), `df_trace_race_${Date.now()}`);
    fs.mkdirSync(path.join(tempWs, 'src'), { recursive: true });

    const tracer = new BackwardCausalTracer({ workspacePath: tempWs });
    const parsedError: ParsedErrorPayload = {
      errorType: 'AssertionError',
      message: 'Concurrent race condition: expected balance 1000 to be 500',
      rawLog: 'AssertionError: balance mismatch',
      stackFrames: [
        {
          file: 'src/account.ts',
          line: 18,
          column: 5,
          functionName: 'transfer',
          isInternal: false,
        },
      ],
      environment: { nodeVersion: 'v22.0.0', platform: 'win32', cwd: tempWs },
    };

    const graph = await tracer.trace(parsedError);
    assert.equal(graph.rootCause.type, 'INFECTION_ORIGIN');
    assert.ok(graph.rootCause.description.includes('mutex') || graph.rootCause.description.includes('race') || graph.rootCause.description.includes('read-modify-write'));
    assert.equal(graph.crashSite.type, 'CRASH_SITE');

    fs.rmSync(tempWs, { recursive: true, force: true });
  });
});
