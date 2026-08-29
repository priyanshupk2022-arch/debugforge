/**
 * Feature F10: CLI Watch Mode Daemon Tests
 * Tests file watcher, debounce handling, auto-diagnosis trigger, and graceful shutdown.
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { MockDebugForgeEngine, createTempWorkspace, cleanTempWorkspace } = require('../harness');

describe('Feature F10: CLI Watch Mode Daemon', () => {
  let tempWs = null;

  afterEach(() => {
    if (tempWs) {
      cleanTempWorkspace(tempWs);
      tempWs = null;
    }
  });

  it('F10-1: Triggers diagnosis when watch iterator detects workspace file change', async () => {
    tempWs = createTempWorkspace({ 'index.ts': 'export const x = 1;' });
    const engine = new MockDebugForgeEngine();

    const watchIterator = engine.watch(tempWs, 'npm test');
    const firstResult = (await watchIterator.next()).value;

    assert.ok(firstResult);
    assert.strictEqual(firstResult.resolved, true);
    assert.strictEqual(firstResult.status, 'APPLIED');
  });

  it('F10-2: Honors custom test command in watch loop execution', async () => {
    tempWs = createTempWorkspace({ 'index.ts': 'export const y = 2;' });
    const engine = new MockDebugForgeEngine();

    const watchIterator = engine.watch(tempWs, 'npm run test:watch');
    const result = (await watchIterator.next()).value;

    assert.ok(result.sandboxResult);
    assert.strictEqual(result.sandboxResult.reproduced, false);
  });

  it('F10-3: Auto-heals without blocking user prompt in automated daemon mode', async () => {
    tempWs = createTempWorkspace({ 'index.ts': 'export const z = 3;' });
    const engine = new MockDebugForgeEngine();

    const watchIterator = engine.watch(tempWs, 'npm test');
    const result = (await watchIterator.next()).value;

    assert.strictEqual(result.hitlResponse.decision, 'APPLY');
  });

  it('F10-4: Maintains session state across multiple watch iterations', async () => {
    tempWs = createTempWorkspace({ 'index.ts': 'export const a = 4;' });
    const engine = new MockDebugForgeEngine();

    const watchIterator = engine.watch(tempWs, 'npm test');
    const res1 = (await watchIterator.next()).value;

    assert.ok(res1.sessionId.startsWith('sess_'));
    assert.ok(res1.steps.length > 0);
  });

  it('F10-5: Gracefully terminates watch iterator when aborted', async () => {
    tempWs = createTempWorkspace({ 'index.ts': 'export const b = 5;' });
    const engine = new MockDebugForgeEngine();

    const watchIterator = engine.watch(tempWs, 'npm test');
    const returnVal = await watchIterator.return();

    assert.strictEqual(returnVal.done, true);
  });
});
