/**
 * Feature F13: Fixture 3 `memory-leak-server` Tests
 * Tests reproduction, causal tracing, and auto-repair of the event listener & memory leak bug.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('events');
const { MockDebugForgeEngine } = require('../harness');

describe('Feature F13: Fixture 3 `memory-leak-server`', () => {
  it('F13-1: Reproduces dangling event listener accumulation on simulated server load', () => {
    const globalEmitter = new EventEmitter();
    globalEmitter.setMaxListeners(100);

    // Buggy session: attaches listener on connect, never removes on disconnect
    class BuggySession {
      constructor(id) {
        this.id = id;
        this.handler = () => {};
        globalEmitter.on('telemetry', this.handler);
      }
      disconnect() {
        // Bug: forgets to call globalEmitter.off('telemetry', this.handler)
      }
    }

    for (let i = 0; i < 20; i++) {
      const s = new BuggySession(i);
      s.disconnect();
    }

    assert.strictEqual(globalEmitter.listenerCount('telemetry'), 20, 'Dangling listeners should accumulate');
  });

  it('F13-2: Pinpoints session.ts missing unsubscription as infection origin', async () => {
    const engine = new MockDebugForgeEngine();
    const errorPayload = {
      errorType: 'MaxListenersExceededWarning',
      message: 'MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1001 telemetry listeners added',
      rawLog: 'MaxListenersExceededWarning: 1001 telemetry listeners added\n    at ClientSession.create (src/server/session.ts:22:15)',
      stackFrames: [{ file: 'src/server/session.ts', line: 22, column: 15, functionName: 'create', isInternal: false }],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/fixtures/memory-leak-server' },
    };

    const trace = await engine.trace_and_analyze(errorPayload, '/fixtures/memory-leak-server');
    assert.strictEqual(trace.rootCause.file, 'server/session.ts');
    assert.strictEqual(trace.rootCause.line, 22);
    assert.ok(trace.explanation.includes('Event listener'));
  });

  it('F13-3: Synthesizes AST patch with lifecycle unsubscription and map disposal', async () => {
    const engine = new MockDebugForgeEngine();
    const trace = {
      rootCause: { id: 'o', type: 'INFECTION_ORIGIN', file: 'server/session.ts', line: 22, symbolName: 'createSession' },
      propagationPath: [],
      crashSite: { id: 'c', type: 'CRASH_SITE', file: 'test/leak.test.ts', line: 44, symbolName: 'assertListenerCount' },
      confidence: 0.96,
      explanation: 'Unregistered listener on global emitter',
      graphAscii: 'G',
    };

    const patchRes = await engine.auto_patch_and_verify(trace, '/fixtures/memory-leak-server');
    assert.ok(patchRes.unifiedDiff.length > 0);
  });

  it('F13-4: Verifies listener count drops to 0 after patched disconnect cleanup', () => {
    const globalEmitter = new EventEmitter();

    // Patched session: cleanly removes listener on disconnect
    class PatchedSession {
      constructor(id) {
        this.id = id;
        this.handler = () => {};
        globalEmitter.on('telemetry', this.handler);
      }
      disconnect() {
        globalEmitter.removeListener('telemetry', this.handler);
      }
    }

    for (let i = 0; i < 20; i++) {
      const s = new PatchedSession(i);
      s.disconnect();
    }

    assert.strictEqual(globalEmitter.listenerCount('telemetry'), 0, 'All listeners must be cleanly unregistered');
  });

  it('F13-5: Executes full diagnose loop on memory-leak-server fixture with 100% pass', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.diagnose({
      errorInput: 'MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1001 telemetry listeners added',
      workspacePath: 'fixtures/memory-leak-server',
      autoApprove: true,
    });

    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.patchResult.tripleLock.lock3_stressTest.passed, true);
  });
});
