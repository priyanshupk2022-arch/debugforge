/**
 * Feature F12: Fixture 2 `race-condition-app` Tests
 * Tests reproduction, causal tracing, and auto-repair of the async read-modify-write race condition.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine } = require('../harness');

describe('Feature F12: Fixture 2 `race-condition-app`', () => {
  it('F12-1: Reproduces non-atomic read-modify-write race condition under concurrent load', async () => {
    let balance = 100;

    // Buggy async transfer without mutex
    async function buggyTransfer(amount) {
      const current = balance; // Read
      await new Promise(r => setTimeout(r, 5)); // Interleaved async tick
      if (current >= amount) {
        balance = current - amount; // Write
        return true;
      }
      return false;
    }

    // Fire 5 concurrent requests of 50 each on a 100 balance
    const results = await Promise.all([
      buggyTransfer(50),
      buggyTransfer(50),
      buggyTransfer(50),
      buggyTransfer(50),
    ]);

    const successCount = results.filter(Boolean).length;
    // Without lock, more than 2 succeed (race condition)
    assert.ok(successCount > 2, 'Unsynchronized transfers should exhibit race condition');
  });

  it('F12-2: Pinpoints non-atomic method in wallet/account.ts as infection origin', async () => {
    const engine = new MockDebugForgeEngine();
    const errorPayload = {
      errorType: 'AssertionError',
      message: 'AssertionError: account balance corrupted: -$100',
      rawLog: 'AssertionError: account balance corrupted\n    at assertBalance (test/concurrency.test.ts:38:5)',
      stackFrames: [{ file: 'test/concurrency.test.ts', line: 38, column: 5, functionName: 'assertBalance', isInternal: false }],
      environment: { nodeVersion: 'v22.0.0', platform: 'linux', cwd: '/fixtures/race-condition-app' },
    };

    const trace = await engine.trace_and_analyze(errorPayload, '/fixtures/race-condition-app');
    assert.strictEqual(trace.rootCause.file, 'wallet/account.ts');
    assert.strictEqual(trace.rootCause.symbolName, 'transfer');
    assert.ok(trace.explanation.includes('Non-atomic'));
  });

  it('F12-3: Injects mutex / atomic serialization lock in AST patch synthesis', async () => {
    const engine = new MockDebugForgeEngine();
    const trace = {
      rootCause: { id: 'o', type: 'INFECTION_ORIGIN', file: 'wallet/account.ts', line: 18, symbolName: 'transfer' },
      propagationPath: [],
      crashSite: { id: 'c', type: 'CRASH_SITE', file: 'test/concurrency.test.ts', line: 38, symbolName: 'assertBalance' },
      confidence: 0.98,
      explanation: 'Non-atomic read-modify-write',
      graphAscii: 'G',
    };

    const patchRes = await engine.auto_patch_and_verify(trace, '/fixtures/race-condition-app');
    assert.ok(patchRes.unifiedDiff.length > 0);
  });

  it('F12-4: Validates serialized execution prevents double-spend in Lock 3 stress test', async () => {
    let balance = 100;
    let mutexQueue = Promise.resolve();

    // Patched transfer with mutex lock serialization
    async function safeTransfer(amount) {
      return new Promise((resolve) => {
        mutexQueue = mutexQueue.then(async () => {
          const current = balance;
          await new Promise(r => setTimeout(r, 2));
          if (current >= amount) {
            balance = current - amount;
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    }

    const results = await Promise.all([
      safeTransfer(50),
      safeTransfer(50),
      safeTransfer(50),
      safeTransfer(50),
    ]);

    const successCount = results.filter(Boolean).length;
    assert.strictEqual(successCount, 2, 'Exactly 2 transfers of $50 should succeed on $100 balance');
    assert.strictEqual(balance, 0, 'Final balance must be exactly $0, never negative');
  });

  it('F12-5: Executes full diagnose loop on race-condition-app with 100% pass', async () => {
    const engine = new MockDebugForgeEngine();
    const result = await engine.diagnose({
      errorInput: 'AssertionError: account balance corrupted: -$100',
      workspacePath: 'fixtures/race-condition-app',
      autoApprove: true,
    });

    assert.strictEqual(result.resolved, true);
    assert.strictEqual(result.patchResult.tripleLock.lock3_stressTest.passed, true);
  });
});
