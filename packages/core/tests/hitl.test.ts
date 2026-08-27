import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HITLGatekeeper } from '../src/hitl/gatekeeper.js';
import { VulnerabilityReport, SecurityPatchNode } from '../src/types/index.js';

describe('HITLGatekeeper (Cryptographic Human-in-the-Loop Gate)', () => {
  it('should generate HMAC-signed review card and verify human approval token', () => {
    const gatekeeper = new HITLGatekeeper('test-secret-key-123');

    const mockVuln: VulnerabilityReport = {
      id: 'v1',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      vulnerableFilePath: 'src/report.ts',
      vulnerableLineNumber: 10,
      sinkIdentifier: 'exec',
      codeSnippet: 'exec(cmd)',
      exploitPayloadSpec: { protocol: 'HTTP_POST', endpoint: '/api/report', expectedProofSignature: 'root:x:0:0' },
      goldenValidInputs: [],
      status: 'EXPLOIT_CONFIRMED',
    };

    const mockPatch: SecurityPatchNode = {
      id: 'p1',
      parentId: null,
      vulnerabilityId: 'v1',
      timestamp: Date.now(),
      filePath: 'src/report.ts',
      originalCodeSnippet: 'exec(cmd)',
      patchedCodeSnippet: 'execFile(cmd)',
      patchDiff: '+ execFile(cmd)',
      immunizationResults: { exploitBlocked: true, goldenInputsPreserved: true, unitTestsPassed: true, testSuiteExitCode: 0 },
      resultingCvssScore: 0.0,
      status: 'IMMUNIZED',
    };

    const reviewCard = gatekeeper.generateReviewCard(mockVuln, mockPatch);

    assert.equal(reviewCard.initialCvssScore, 9.8);
    assert.equal(reviewCard.finalCvssScore, 0.0);
    assert.equal(reviewCard.scoreDrop, 9.8);
    assert.match(reviewCard.approvalToken, /^[a-f0-9]{64}$/);

    // Valid approval verification
    const isValid = gatekeeper.verifyApproval(reviewCard.patchId, reviewCard.approvalToken);
    assert.equal(isValid, true);

    // Tampered token rejection
    const isInvalid = gatekeeper.verifyApproval(reviewCard.patchId, 'forged-tampered-token');
    assert.equal(isInvalid, false);
  });
});
