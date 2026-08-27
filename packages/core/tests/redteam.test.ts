import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import * as fs from 'fs';
import { RedAgentArena } from '../src/redteam/exploit.js';
import { VulnerabilityReport } from '../src/types/index.js';

function getFixturePaymentAppDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'fixtures/vulnerable-payment-app'),
    path.resolve(process.cwd(), '../../fixtures/vulnerable-payment-app'),
    path.resolve(process.cwd(), '../fixtures/vulnerable-payment-app'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Could not find fixtures/vulnerable-payment-app directory. cwd: ${process.cwd()}`);
}

describe('RedAgentArena (Dynamic Exploit Proof in Sandbox)', () => {
  it('should prove vulnerability and capture proof signature on vulnerable target inside sandbox', async () => {
    const fixtureDir = getFixturePaymentAppDir();
    const mockVuln: VulnerabilityReport = {
      id: 'test_vuln_1',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      confidence: 'HIGH',
      vulnerableFilePath: path.join(fixtureDir, 'src/routes/report.ts'),
      vulnerableLineNumber: 8,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'exec',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.command',
        sinkSymbol: 'exec',
        taintedParameter: 'command',
        frameworkContext: 'Express.js',
        tracePath: ['line 8'],
      },
      codeSnippet: 'exec(cmd)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/report',
        bodyPayload: { command: 'proof_of_exploit_token_0x99' },
        expectedProofSignature: 'Generating report for: proof_of_exploit_token_0x99',
      },
      goldenValidInputs: [],
      status: 'SUSPECTED',
    };

    const arena = new RedAgentArena({ useLocalRunner: true });
    const result = await arena.executeExploitProof(mockVuln, 3991);

    assert.equal(result.exploitConfirmed, true);
    assert.match(result.capturedProof, /Generating report for: proof_of_exploit_token_0x99/);
    assert.equal(result.statusCode, 200);
    assert.notEqual(result.daytonaSandboxId, '');
  });

  it('should return false if target server blocks or sanitizes the exploit payload inside sandbox', async () => {
    const fixtureDir = getFixturePaymentAppDir();
    const mockVuln: VulnerabilityReport = {
      id: 'test_vuln_2',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      confidence: 'HIGH',
      vulnerableFilePath: path.join(fixtureDir, 'src/routes/report.ts'),
      vulnerableLineNumber: 8,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'exec',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.command',
        sinkSymbol: 'exec',
        taintedParameter: 'command',
        frameworkContext: 'Express.js',
        tracePath: ['line 8'],
      },
      codeSnippet: 'exec(cmd)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/report',
        bodyPayload: { command: 'non-existent' },
        expectedProofSignature: 'EXPECTED_IMPOSSIBLE_SIGNATURE_XYZ',
      },
      goldenValidInputs: [],
      status: 'SUSPECTED',
    };

    const arena = new RedAgentArena({ useLocalRunner: true });
    const result = await arena.executeExploitProof(mockVuln, 3992);

    assert.equal(result.exploitConfirmed, false);
  });
});
