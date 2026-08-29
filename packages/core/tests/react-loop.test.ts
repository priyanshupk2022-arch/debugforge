import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ReActLoopRunner } from '../src/agent/react-loop.js';
import { ReActStep } from '../src/types/index.js';

describe('ReActLoopRunner', () => {
  let tempWs: string;

  test('executes complete ReAct loop (Think -> Act -> Observe -> HITL -> Apply)', async () => {
    tempWs = path.join(os.tmpdir(), `df_react_e2e_${Date.now()}`);
    fs.mkdirSync(path.join(tempWs, 'src'), { recursive: true });

    // Target application file with reproducible bug
    fs.writeFileSync(
      path.join(tempWs, 'src', 'db.js'),
      `module.exports = {
  getPool: async function() {
    if (true) {
      return null; // Silent timeout returning null
    }
  }
};`
    );

    fs.writeFileSync(
      path.join(tempWs, 'test.js'),
      `const assert = require('assert');
const { getPool } = require('./src/db.js');
async function run() {
  const p = await getPool();
  assert.ok(p !== null, 'Connection pool must not be null');
}
run();`
    );

    const streamedSteps: ReActStep[] = [];
    const runner = new ReActLoopRunner({
      workspaceRoot: tempWs,
      sandboxMode: 'local',
      onStepStream: (step) => {
        streamedSteps.push(step);
      },
      hitlHandler: async () => 'APPLY',
    });

    const result = await runner.runDiagnoseLoop({
      targetPath: tempWs,
      testCommand: 'node test.js',
      errorLog: "AssertionError: Connection pool must not be null\n    at run (c:\\test\\test.js:5:10)",
      autoApprove: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'APPLIED');
    assert.ok(result.totalIterations >= 3);
    assert.ok(streamedSteps.length > 5);

    // Verify step sequence includes THINK, ACT, OBSERVE
    const phases = streamedSteps.map((s) => s.phase);
    assert.ok(phases.includes('THINK'));
    assert.ok(phases.includes('ACT'));
    assert.ok(phases.includes('OBSERVE'));

    fs.rmSync(tempWs, { recursive: true, force: true });
  });
});
