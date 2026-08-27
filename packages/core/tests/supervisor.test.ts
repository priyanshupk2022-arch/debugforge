import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SecuritySupervisor } from '../src/supervisor/detector.js';
import { SecurityPatchNode } from '../src/types/index.js';

describe('SecuritySupervisor (Out-of-Band Stagnation & Deadlock Detector)', () => {
  it('should detect cyclic syntax deadlocks when patch diffs oscillate', () => {
    const patches: SecurityPatchNode[] = [
      {
        id: 'p1',
        parentId: null,
        vulnerabilityId: 'v1',
        timestamp: 1000,
        filePath: 'app.ts',
        originalCodeSnippet: 'exec(cmd)',
        patchedCodeSnippet: 'exec(cmd.trim())',
        patchDiff: '+ exec(cmd.trim())',
        patchDigest: 'digest1',
        immunizationResults: { exploitBlocked: false, goldenInputsPreserved: false, unitTestsPassed: false, testSuiteExitCode: 1, testSuiteOutput: 'err', durationMs: 50 },
        resultingCvssScore: 9.8,
        status: 'DEAD_END',
      },
      {
        id: 'p2',
        parentId: 'p1',
        vulnerabilityId: 'v1',
        timestamp: 2000,
        filePath: 'app.ts',
        originalCodeSnippet: 'exec(cmd)',
        patchedCodeSnippet: 'exec(cmd.trim() )',
        patchDiff: '+ exec(cmd.trim() )',
        patchDigest: 'digest2',
        immunizationResults: { exploitBlocked: false, goldenInputsPreserved: false, unitTestsPassed: false, testSuiteExitCode: 1, testSuiteOutput: 'err', durationMs: 50 },
        resultingCvssScore: 9.8,
        status: 'DEAD_END',
      },
    ];

    const supervisor = new SecuritySupervisor();
    const alert = supervisor.checkTrajectory(patches);

    assert.notEqual(alert, null);
    assert.equal(alert?.type, 'CYCLIC_SYNTAX_LOOP');
    assert.match(alert?.recommendedPivot || '', /execFile/);
  });

  it('should return null when patches are genuinely exploring diverse strategies', () => {
    const patches: SecurityPatchNode[] = [
      {
        id: 'p1',
        parentId: null,
        vulnerabilityId: 'v1',
        timestamp: 1000,
        filePath: 'app.ts',
        originalCodeSnippet: 'exec(cmd)',
        patchedCodeSnippet: 'exec(cmd.trim())',
        patchDiff: '+ exec(cmd.trim())',
        patchDigest: 'digest1',
        immunizationResults: { exploitBlocked: false, goldenInputsPreserved: false, unitTestsPassed: false, testSuiteExitCode: 1, testSuiteOutput: 'err', durationMs: 50 },
        resultingCvssScore: 9.8,
        status: 'DEAD_END',
      },
      {
        id: 'p2',
        parentId: 'p1',
        vulnerabilityId: 'v1',
        timestamp: 2000,
        filePath: 'app.ts',
        originalCodeSnippet: 'exec(cmd)',
        patchedCodeSnippet: 'execFile("app", [parsed])',
        patchDiff: '+ execFile("app", [parsed])',
        patchDigest: 'digest2',
        immunizationResults: { exploitBlocked: false, goldenInputsPreserved: false, unitTestsPassed: false, testSuiteExitCode: 1, testSuiteOutput: 'err', durationMs: 50 },
        resultingCvssScore: 9.8,
        status: 'DEAD_END',
      },
    ];

    const supervisor = new SecuritySupervisor();
    const alert = supervisor.checkTrajectory(patches);

    assert.equal(alert, null);
  });
});
