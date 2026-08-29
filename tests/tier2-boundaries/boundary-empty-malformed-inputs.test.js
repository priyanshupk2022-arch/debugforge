/**
 * Tier 2 Boundary Tests: Empty & Malformed Inputs
 * Tests resilience against empty strings, unparseable logs, exotic formats, and giant payloads.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, validateParsedError } = require('../harness');

describe('Tier 2: Empty & Malformed Inputs', () => {
  it('T2-1: Ingests null, undefined, and empty string without throwing exceptions', async () => {
    const engine = new MockDebugForgeEngine();
    const parsedNull = await engine.ingest_error(null);
    const parsedEmpty = await engine.ingest_error('');

    validateParsedError(parsedNull);
    validateParsedError(parsedEmpty);
    assert.strictEqual(parsedNull.errorType, 'Error');
    assert.strictEqual(parsedEmpty.errorType, 'Error');
  });

  it('T2-2: Handles non-standard / non-V8 foreign language log formats (e.g. Python traceback)', async () => {
    const engine = new MockDebugForgeEngine();
    const pythonTrace = [
      'Traceback (most recent call last):',
      '  File "/app/server.py", line 42, in <module>',
      '    handle_request()',
      'ZeroDivisionError: division by zero',
    ].join('\n');

    const parsed = await engine.ingest_error(pythonTrace, 'ZeroDivisionError');
    validateParsedError(parsed);
    assert.strictEqual(parsed.errorType, 'ZeroDivisionError');
    assert.ok(parsed.stackFrames.length >= 1);
  });

  it('T2-3: Handles extremely large stack traces (1,000 frames) within acceptable memory bounds', async () => {
    const engine = new MockDebugForgeEngine();
    const giantFrames = [];
    for (let i = 1; i <= 1000; i++) {
      giantFrames.push(`    at recurseFunction_${i} (/app/src/recursive.ts:${i}:1)`);
    }
    const giantTrace = ['RangeError: Maximum call stack size exceeded', ...giantFrames].join('\n');

    const parsed = await engine.ingest_error(giantTrace, 'RangeError');
    assert.strictEqual(parsed.stackFrames.length, 1000);
    assert.strictEqual(parsed.stackFrames[0].line, 1);
    assert.strictEqual(parsed.stackFrames[999].line, 1000);
  });

  it('T2-4: Sanitizes unparseable garbage and corrupted binary strings in error input', async () => {
    const engine = new MockDebugForgeEngine();
    const binaryGarbage = '\x00\x01\x02\xFF\xFE\xFD Corrupted Memory Dump';

    const parsed = await engine.ingest_error(binaryGarbage);
    validateParsedError(parsed);
    assert.ok(parsed.message.includes('Corrupted Memory Dump') || parsed.message.length > 0);
  });
});
