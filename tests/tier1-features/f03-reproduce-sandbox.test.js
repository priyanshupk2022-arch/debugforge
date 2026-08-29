/**
 * Feature F3: MCP Tool `reproduce_in_sandbox` Tests
 * Tests workspace isolation, exit code capture, failure log matching, and deterministic reproduction.
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, createTempWorkspace, cleanTempWorkspace, validateSandboxResult } = require('../harness');

describe('Feature F3: MCP Tool `reproduce_in_sandbox`', () => {
  let tempWs = null;

  afterEach(() => {
    if (tempWs) {
      cleanTempWorkspace(tempWs);
      tempWs = null;
    }
  });

  it('F3-1: Spins up isolated workspace and executes failing reproduction command', async () => {
    tempWs = createTempWorkspace({
      'test.js': 'process.exit(1);',
    });

    const engine = new MockDebugForgeEngine();
    const result = await engine.reproduce_in_sandbox(tempWs, 'node test.js');
    validateSandboxResult(result);

    assert.strictEqual(result.exitCode, 1);
    assert.strictEqual(result.reproduced, true);
    assert.strictEqual(result.sandboxType, 'local');
    assert.ok(result.durationMs >= 0);
  });

  it('F3-2: Captures non-zero exit codes and stderr output without leaking to host', async () => {
    tempWs = createTempWorkspace({
      'test.js': 'console.error("FATAL_REPRODUCTION_ERROR_SIGNATURE"); process.exit(42);',
    });

    const engine = new MockDebugForgeEngine();
    const result = await engine.reproduce_in_sandbox(tempWs, 'node test.js');

    assert.strictEqual(result.exitCode, 42);
    assert.strictEqual(result.reproduced, true);
    assert.ok(result.stderr.includes('FATAL_REPRODUCTION_ERROR_SIGNATURE'), 'Stderr must contain error signature');
  });

  it('F3-3: Marks reproduction as false when command succeeds with exit code 0', async () => {
    tempWs = createTempWorkspace({
      'test.js': 'console.log("ALL TESTS PASS"); process.exit(0);',
    });

    const engine = new MockDebugForgeEngine();
    const result = await engine.reproduce_in_sandbox(tempWs, 'node test.js');

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.reproduced, false);
    assert.ok(result.stdout.includes('ALL TESTS PASS'));
  });

  it('F3-4: Enforces execution timeout on hanging or deadlocked child processes', async () => {
    tempWs = createTempWorkspace({
      'hang.js': 'setInterval(() => {}, 1000);',
    });

    const engine = new MockDebugForgeEngine({ timeout: 500 });
    const result = await engine.reproduce_in_sandbox(tempWs, 'node hang.js');

    assert.strictEqual(result.reproduced, true);
    assert.ok(result.exitCode !== 0);
  });

  it('F3-5: Emits unique sandbox ID and ISO timestamp for session traceability', async () => {
    tempWs = createTempWorkspace({ 'app.js': 'process.exit(1);' });
    const engine = new MockDebugForgeEngine();
    const result1 = await engine.reproduce_in_sandbox(tempWs, 'node app.js');
    const result2 = await engine.reproduce_in_sandbox(tempWs, 'node app.js');

    assert.notStrictEqual(result1.sandboxId, result2.sandboxId, 'Each sandbox run must have unique sandbox ID');
    assert.ok(!isNaN(Date.parse(result1.timestamp)), 'Must have valid timestamp');
  });
});
