import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LocalProcessSandboxRunner } from '../src/sandbox/local-runner.js';

describe('LocalProcessSandboxRunner', () => {
  const runner = new LocalProcessSandboxRunner();
  let tempSrcDir: string;

  test('creates isolated workspace and executes command', async () => {
    tempSrcDir = path.join(os.tmpdir(), `df_test_src_${Date.now()}`);
    fs.mkdirSync(tempSrcDir, { recursive: true });
    fs.writeFileSync(path.join(tempSrcDir, 'hello.txt'), 'Hello DebugForge');

    const workspaceId = await runner.createWorkspace(tempSrcDir);
    assert.ok(workspaceId.startsWith('df_sandbox_'));

    const content = await runner.readFile(workspaceId, 'hello.txt');
    assert.equal(content, 'Hello DebugForge');

    // Write file in sandbox
    await runner.writeFile(workspaceId, 'sub/test.js', 'console.log("inside sandbox");');
    const readSub = await runner.readFile(workspaceId, 'sub/test.js');
    assert.equal(readSub, 'console.log("inside sandbox");');

    // Execute command in sandbox
    const result = await runner.executeCommand(workspaceId, 'node -e "console.log(12345)"');
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /12345/);
    assert.equal(result.sandboxType, 'local');

    // Clean up
    await runner.destroyWorkspace(workspaceId);
    assert.throws(() => runner.getWorkspacePath(workspaceId));

    // Clean up tempSrcDir
    fs.rmSync(tempSrcDir, { recursive: true, force: true });
  });

  test('captures non-zero exit code and stderr on failure', async () => {
    tempSrcDir = path.join(os.tmpdir(), `df_test_fail_${Date.now()}`);
    fs.mkdirSync(tempSrcDir, { recursive: true });

    const workspaceId = await runner.createWorkspace(tempSrcDir);
    const result = await runner.executeCommand(
      workspaceId,
      'node -e "console.error(\'crash reason\'); process.exit(1);"'
    );

    assert.equal(result.exitCode, 1);
    assert.equal(result.reproduced, true);
    assert.match(result.stderr, /crash reason/);

    await runner.destroyWorkspace(workspaceId);
    fs.rmSync(tempSrcDir, { recursive: true, force: true });
  });
});
