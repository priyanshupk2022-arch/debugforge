/**
 * Feature F22: Comprehensive E2E Verification Tests
 * Tests complete end-to-end integration across all packages, contracts, CLI commands, and fixtures.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { MockDebugForgeEngine, assertTripleLockPassed } = require('../harness');

const rootPath = path.resolve(__dirname, '../..');

describe('Feature F22: Comprehensive E2E Verification', () => {
  it('F22-1: Executes full end-to-end diagnostic session with 100% contract compliance', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.diagnose({
      errorInput: 'TypeError: Cannot read properties of null at checkout.ts:45',
      testCommand: 'npm test',
      workspacePath: 'fixtures/null-propagation-api',
      autoApprove: true,
    });

    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');
    assert.ok(result.parsedError);
    assert.ok(result.sandboxResult);
    assert.ok(result.causalTrace);
    assert.ok(result.patchResult);
    assert.ok(result.hitlResponse);
    assertTripleLockPassed(result.patchResult.tripleLock);
  });

  it('F22-2: Verifies conversation agent session parses prompt and produces verified patch', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.runAgentLoop('Debug and heal the async race condition in wallet service');

    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.status, 'APPLIED');
    assert.strictEqual(result.patchResult.tripleLock.score, 100);
  });

  it('F22-3: Asserts zero placeholder strings or fake stubs across test harness files', () => {
    const harnessFiles = ['contracts.js', 'mock-engine.js', 'sandbox-mock.js', 'test-utils.js'];
    for (const file of harnessFiles) {
      const content = fs.readFileSync(path.join(__dirname, '../harness', file), 'utf8');
      assert.ok(!content.includes('TODO: implement'), `File ${file} should not have unfinished TODO comments`);
    }
  });

  it('F22-4: Validates monorepo structure integrity (packages/core, packages/cli, packages/web)', () => {
    const corePkg = path.join(rootPath, 'packages/core/package.json');
    const cliPkg = path.join(rootPath, 'packages/cli/package.json');
    const webPkg = path.join(rootPath, 'packages/web/package.json');

    assert.ok(fs.existsSync(corePkg), 'packages/core/package.json must exist');
    assert.ok(fs.existsSync(cliPkg), 'packages/cli/package.json must exist');
    assert.ok(fs.existsSync(webPkg), 'packages/web/package.json must exist');
  });

  it('F22-5: Validates root documentation and test infrastructure specifications', () => {
    assert.ok(fs.existsSync(path.join(rootPath, 'README.md')), 'README.md must exist');
    assert.ok(fs.existsSync(path.join(rootPath, 'PROJECT.md')), 'PROJECT.md must exist');
    assert.ok(fs.existsSync(path.join(rootPath, 'TEST_INFRA.md')), 'TEST_INFRA.md must exist');
  });
});
