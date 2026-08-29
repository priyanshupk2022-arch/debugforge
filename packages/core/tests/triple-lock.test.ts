import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TripleLockVerifier } from '../src/patcher/triple-lock.js';
import { LocalProcessSandboxRunner } from '../src/sandbox/local-runner.js';
import { FilePatch } from '../src/types/index.js';

describe('TripleLockVerifier', () => {
  let tempWs: string;
  const runner = new LocalProcessSandboxRunner();

  test('verifies all 3 locks pass when patch fixes failing test', async () => {
    tempWs = path.join(os.tmpdir(), `df_lock_pass_${Date.now()}`);
    fs.mkdirSync(tempWs, { recursive: true });

    // Initial failing file
    fs.writeFileSync(path.join(tempWs, 'calc.js'), 'module.exports = { add: (a, b) => a - b };');
    fs.writeFileSync(
      path.join(tempWs, 'test.js'),
      'const assert = require("assert"); const { add } = require("./calc.js"); assert.strictEqual(add(2, 3), 5);'
    );

    const workspaceId = await runner.createWorkspace(tempWs);

    const verifier = new TripleLockVerifier({
      sandbox: runner,
      workspaceId,
      targetTestCommand: 'node test.js',
      regressionTestCommand: 'node test.js',
      stressTestCommand: 'node test.js',
    });

    const candidatePatch: FilePatch = {
      filePath: 'calc.js',
      originalContent: 'module.exports = { add: (a, b) => a - b };',
      patchedContent: 'module.exports = { add: (a, b) => a + b };',
      diff: '',
    };

    const result = await verifier.verify([candidatePatch]);

    assert.equal(result.lock1OriginalPass, true);
    assert.equal(result.lock2RegressionPass, true);
    assert.equal(result.lock3StressPass, true);
    assert.equal(result.allPassed, true);
    assert.equal(result.score, 100);

    await runner.destroyWorkspace(workspaceId);
    fs.rmSync(tempWs, { recursive: true, force: true });
  });

  test('detects regression when Lock 2 fails', async () => {
    tempWs = path.join(os.tmpdir(), `df_lock_reg_${Date.now()}`);
    fs.mkdirSync(tempWs, { recursive: true });

    fs.writeFileSync(path.join(tempWs, 'calc.js'), 'module.exports = { add: (a, b) => a + b };');

    const workspaceId = await runner.createWorkspace(tempWs);

    const verifier = new TripleLockVerifier({
      sandbox: runner,
      workspaceId,
      targetTestCommand: 'node -e "process.exit(0)"',
      regressionTestCommand: 'node -e "process.exit(1)"', // Fails regression
      stressTestCommand: 'node -e "process.exit(0)"',
    });

    const result = await verifier.verify([]);

    assert.equal(result.lock1OriginalPass, true);
    assert.equal(result.lock2RegressionPass, false);
    assert.equal(result.allPassed, false);
    assert.equal(result.score, 70); // 40 (Lock1) + 30 (Lock3)

    await runner.destroyWorkspace(workspaceId);
    fs.rmSync(tempWs, { recursive: true, force: true });
  });
});
