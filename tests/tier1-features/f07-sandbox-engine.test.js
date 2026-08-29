/**
 * Feature F7: Daytona & Hermetic Sandbox Engine Tests
 * Tests ISandboxRunner lifecycle, isolated file I/O, and environment scrubbing.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { MockSandboxRunner, LocalProcessSandboxRunner, createTempWorkspace, cleanTempWorkspace } = require('../harness');

describe('Feature F7: Daytona & Hermetic Sandbox Engine', () => {
  it('F7-1: Creates and initializes isolated workspace directory from source path', async () => {
    const tempSrc = createTempWorkspace({
      'index.js': 'console.log("source file");',
      'package.json': '{"name":"temp-src"}',
    });

    try {
      const runner = new LocalProcessSandboxRunner();
      const wsId = await runner.createWorkspace(tempSrc);

      assert.ok(wsId.startsWith('mock_ws_'));
      const content = await runner.readFile(wsId, 'index.js');
      assert.strictEqual(content, 'console.log("source file");');

      await runner.destroyWorkspace(wsId);
    } finally {
      cleanTempWorkspace(tempSrc);
    }
  });

  it('F7-2: Performs isolated file write and read inside sandbox workspace', async () => {
    const runner = new LocalProcessSandboxRunner();
    const wsId = await runner.createWorkspace(null);

    await runner.writeFile(wsId, 'src/math.js', 'module.exports = { add: (a, b) => a + b };');
    const content = await runner.readFile(wsId, 'src/math.js');

    assert.ok(content.includes('add: (a, b) => a + b'));
    await runner.destroyWorkspace(wsId);
  });

  it('F7-3: Executes commands within workspace context and captures exit codes', async () => {
    const runner = new LocalProcessSandboxRunner();
    const wsId = await runner.createWorkspace(null);

    await runner.writeFile(wsId, 'test.js', 'console.log("HELLO_SANDBOX"); process.exit(0);');
    const res = await runner.executeCommand(wsId, 'node test.js');

    assert.strictEqual(res.exitCode, 0);
    assert.ok(res.stdout.includes('HELLO_SANDBOX'));
    await runner.destroyWorkspace(wsId);
  });

  it('F7-4: Injects isolated environment variables into command execution', async () => {
    const runner = new LocalProcessSandboxRunner();
    const wsId = await runner.createWorkspace(null);

    await runner.writeFile(wsId, 'env.js', 'console.log(process.env.DEBUGFORGE_TEST_ENV);');
    const res = await runner.executeCommand(wsId, 'node env.js', { DEBUGFORGE_TEST_ENV: 'SECRET_SANDBOX_TOKEN' });

    assert.ok(res.stdout.includes('SECRET_SANDBOX_TOKEN'));
    await runner.destroyWorkspace(wsId);
  });

  it('F7-5: Destroys workspace and cleans up temporary filesystem resources', async () => {
    const runner = new LocalProcessSandboxRunner();
    const wsId = await runner.createWorkspace(null);
    const wsObj = runner.workspaces.get(wsId);
    const tempPath = wsObj.path;

    assert.ok(fs.existsSync(tempPath), 'Temp directory should exist while active');
    await runner.destroyWorkspace(wsId);

    assert.strictEqual(runner.workspaces.has(wsId), false, 'Workspace must be removed from map');
    assert.strictEqual(fs.existsSync(tempPath), false, 'Temp directory must be destroyed');
  });
});
