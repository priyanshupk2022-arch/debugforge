/**
 * Tier 2 Boundary Tests: Sandbox Failures & Fault Injection
 * Tests missing directories, invalid commands, double destruction, and execution errors.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { LocalProcessSandboxRunner } = require('../harness');

describe('Tier 2: Sandbox Failures & Fault Injection', () => {
  it('T2-13: Handles invalid or non-existent command execution with non-zero exit code', async () => {
    const runner = new LocalProcessSandboxRunner();
    const wsId = await runner.createWorkspace(null);

    const res = await runner.executeCommand(wsId, 'non_existent_command_12345_xyz');
    assert.strictEqual(res.reproduced, true);
    assert.notStrictEqual(res.exitCode, 0);

    await runner.destroyWorkspace(wsId);
  });

  it('T2-14: Throws descriptive error when operating on inactive or non-existent workspace ID', async () => {
    const runner = new LocalProcessSandboxRunner();
    await assert.rejects(async () => {
      await runner.readFile('invalid_workspace_id_999', 'test.js');
    }, /inactive/);
  });

  it('T2-15: Safely tolerates redundant destroyWorkspace calls (idempotent cleanup)', async () => {
    const runner = new LocalProcessSandboxRunner();
    const wsId = await runner.createWorkspace(null);

    await runner.destroyWorkspace(wsId);
    // Second call should not throw
    await runner.destroyWorkspace(wsId);
    assert.strictEqual(runner.workspaces.has(wsId), false);
  });
});
