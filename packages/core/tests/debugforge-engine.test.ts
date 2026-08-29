import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DebugForgeEngine } from '../src/agent/engine.js';

describe('DebugForgeEngine', () => {
  let tempWs: string;

  test('diagnose method runs end-to-end diagnosis', async () => {
    tempWs = path.join(os.tmpdir(), `df_engine_diag_${Date.now()}`);
    fs.mkdirSync(path.join(tempWs, 'src'), { recursive: true });

    fs.writeFileSync(
      path.join(tempWs, 'src', 'db.ts'),
      `export async function getConnection() {
  if (true) {
    return null;
  }
}`
    );

    fs.writeFileSync(
      path.join(tempWs, 'test.js'),
      `const assert = require('assert');
const { getConnection } = require('./src/db.js');
async function run() {
  const c = await getConnection();
  assert.ok(c !== null);
}
run();`
    );

    const engine = new DebugForgeEngine({
      workspaceRoot: tempWs,
      sandboxMode: 'local',
    });

    const result = await engine.diagnose({
      targetPath: tempWs,
      testCommand: 'node test.js',
      errorLog: 'AssertionError: pool was null',
      autoApprove: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'APPLIED');
    assert.ok(result.summary.includes('Successfully diagnosed root cause'));

    fs.rmSync(tempWs, { recursive: true, force: true });
  });

  test('runAgentLoop processes natural language prompt', async () => {
    tempWs = path.join(os.tmpdir(), `df_engine_agent_${Date.now()}`);
    fs.mkdirSync(path.join(tempWs, 'src'), { recursive: true });

    fs.writeFileSync(
      path.join(tempWs, 'src', 'db.ts'),
      `export async function getConnection() {
  if (true) {
    return null;
  }
}`
    );

    fs.writeFileSync(
      path.join(tempWs, 'test.js'),
      `const assert = require('assert');
const { getConnection } = require('./src/db.js');
async function run() {
  const c = await getConnection();
  assert.ok(c !== null);
}
run();`
    );

    const engine = new DebugForgeEngine({
      workspaceRoot: tempWs,
      sandboxMode: 'local',
    });

    const result = await engine.runAgentLoop('Diagnose and fix database timeout with test: "node test.js"');
    assert.ok(result.totalIterations >= 1);

    fs.rmSync(tempWs, { recursive: true, force: true });
  });
});
