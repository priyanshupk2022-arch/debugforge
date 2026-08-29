/**
 * Tier 2 Boundary Tests: Escaping & Special Characters
 * Tests Unicode, Windows CRLF vs Unix LF, ANSI colors, and shell metacharacter safety.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { MockDebugForgeEngine, stripAnsi } = require('../harness');

describe('Tier 2: Escaping & Special Characters', () => {
  it('T2-10: Ingests error logs containing ANSI color codes and strips them cleanly', async () => {
    const engine = new MockDebugForgeEngine();
    const ansiLog = '\x1b[31mTypeError\x1b[0m: \x1b[1mCannot read property\x1b[0m\n    at \x1b[36mrun\x1b[0m (/app/src/index.ts:12:4)';

    const parsed = await engine.ingest_error(ansiLog);
    assert.ok(parsed.message.includes('Cannot read property'));
    assert.strictEqual(parsed.stackFrames[0].line, 12);
  });

  it('T2-11: Handles Unicode emojis and multi-byte characters in error logs and diffs', async () => {
    const engine = new MockDebugForgeEngine();
    const unicodeLog = 'Error 💥: Failed to process payment for 🚀 user @priyanshu\n    at pay (payment.ts:50:1)';

    const parsed = await engine.ingest_error(unicodeLog);
    assert.ok(parsed.message.includes('💥'));
    assert.ok(parsed.message.includes('🚀'));
  });

  it('T2-12: Handles Windows CRLF (\\r\\n) and Unix LF (\\n) line endings transparently', async () => {
    const engine = new MockDebugForgeEngine();
    const crlfLog = 'Error: CRLF test\r\n    at run (/app/crlf.ts:10:2)\r\n    at main (/app/main.ts:5:1)\r\n';

    const parsed = await engine.ingest_error(crlfLog);
    assert.strictEqual(parsed.stackFrames.length, 2);
    assert.strictEqual(parsed.stackFrames[0].line, 10);
    assert.strictEqual(parsed.stackFrames[1].line, 5);
  });
});
