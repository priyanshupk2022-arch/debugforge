import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ASTPatchSynthesizer } from '../src/patcher/ast-transformer.js';
import { DiffGenerator } from '../src/patcher/diff-generator.js';
import { CausalTraceGraph } from '../src/types/index.js';

describe('ASTPatchSynthesizer & DiffGenerator', () => {
  let tempWs: string;

  test('generates unified diff correctly', () => {
    const original = 'const a = 1;\nconst b = 2;\n';
    const patched = 'const a = 1;\nconst b = 3;\n';
    const diff = DiffGenerator.generateUnifiedDiff('src/test.ts', original, patched);

    assert.ok(diff.includes('--- a/src/test.ts'));
    assert.ok(diff.includes('+++ b/src/test.ts'));
    assert.ok(diff.includes('-const b = 2;'));
    assert.ok(diff.includes('+const b = 3;'));
  });

  test('synthesizes null propagation repair for database timeout', async () => {
    tempWs = path.join(os.tmpdir(), `df_patch_null_${Date.now()}`);
    fs.mkdirSync(path.join(tempWs, 'src'), { recursive: true });

    const originalDb = `export async function getPoolConnection() {
  if (poolTimeout) {
    return null;
  }
  return pool.connect();
}`;
    fs.writeFileSync(path.join(tempWs, 'src', 'db.ts'), originalDb);

    const synthesizer = new ASTPatchSynthesizer(tempWs);
    const mockTrace: CausalTraceGraph = {
      rootCause: {
        id: 'node_root',
        type: 'INFECTION_ORIGIN',
        file: 'src/db.ts',
        line: 3,
        symbolName: 'getPoolConnection',
        expression: 'return null;',
        description: 'Database connection pool timeout silently returns null',
      },
      propagationPath: [],
      crashSite: {
        id: 'node_crash',
        type: 'CRASH_SITE',
        file: 'src/billing.ts',
        line: 10,
        symbolName: 'charge',
        expression: 'conn.query()',
        description: 'Null dereference crash',
      },
      edges: [],
      confidence: 0.98,
      explanation: 'Null propagation repair required',
      graphAscii: '',
    };

    const patches = await synthesizer.synthesizePatch({
      workspacePath: tempWs,
      causalTrace: mockTrace,
    });

    assert.equal(patches.length, 1);
    assert.ok(patches[0].patchedContent.includes('connect') || patches[0].patchedContent.includes('query'));
    assert.ok(patches[0].diff.includes('+'));

    fs.rmSync(tempWs, { recursive: true, force: true });
  });

  test('synthesizes mutex concurrency repair for race condition', async () => {
    tempWs = path.join(os.tmpdir(), `df_patch_race_${Date.now()}`);
    fs.mkdirSync(path.join(tempWs, 'src'), { recursive: true });

    const originalAccount = `export class AccountService {
  async transfer(fromId: string, toId: string, amount: number) {
    const fromBal = await getBalance(fromId);
    await setBalance(fromId, fromBal - amount);
  }
}`;
    fs.writeFileSync(path.join(tempWs, 'src', 'account.ts'), originalAccount);

    const synthesizer = new ASTPatchSynthesizer(tempWs);
    const mockTrace: CausalTraceGraph = {
      rootCause: {
        id: 'node_race',
        type: 'INFECTION_ORIGIN',
        file: 'src/account.ts',
        line: 2,
        symbolName: 'transfer',
        expression: 'async transfer(...)',
        description: 'Concurrent async read-modify-write race condition',
      },
      propagationPath: [],
      crashSite: {
        id: 'node_crash',
        type: 'CRASH_SITE',
        file: 'src/account.ts',
        line: 4,
        symbolName: 'transfer',
        expression: 'setBalance',
        description: 'Balance discrepancy under concurrency',
      },
      edges: [],
      confidence: 0.95,
      explanation: 'Race condition requires mutex synchronization',
      graphAscii: '',
    };

    const patches = await synthesizer.synthesizePatch({
      workspacePath: tempWs,
      causalTrace: mockTrace,
    });

    assert.equal(patches.length, 1);
    assert.ok(patches[0].patchedContent.includes('AsyncMutex'));
    assert.ok(patches[0].patchedContent.includes('runExclusive'));

    fs.rmSync(tempWs, { recursive: true, force: true });
  });
});
