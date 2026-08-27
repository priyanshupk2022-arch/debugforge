import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import * as fs from 'fs';
import { ImmunizationVerifier } from '../src/verifier/assert.js';
import { BlueAgentImmunizer } from '../src/blueteam/patcher.js';
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

describe('ImmunizationVerifier (Triple-Lock Assertion Engine in Sandbox)', () => {
  it('should apply patch in sandbox, restart target, assert exploit blocked, golden inputs pass, and unit tests pass', async () => {
    const fixtureDir = getFixturePaymentAppDir();
    const vulnFilePath = path.join(fixtureDir, 'src/routes/report.ts');

    const mockVuln: VulnerabilityReport = {
      id: 'vuln_ci_1',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      confidence: 'HIGH',
      vulnerableFilePath: vulnFilePath,
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
        bodyPayload: { command: '; cat /etc/passwd' },
        expectedProofSignature: 'root:x:0:0',
      },
      goldenValidInputs: [
        {
          description: 'Valid summary report request',
          protocol: 'HTTP_POST',
          endpoint: '/api/report',
          bodyPayload: { command: '--summary-only' },
          expectedStatusCode: 200,
          expectedResponseSubstring: 'Report generated successfully',
        },
      ],
      status: 'EXPLOIT_CONFIRMED',
    };

    const originalSource = `import { exec } from 'child_process';
import type { Request, Response } from 'express';

export function handlePaymentReport(req: Request, res: Response): void {
  const commandInput = req.body?.command || '';

  // Unsafe Command Injection Sink (CWE-78)
  exec('echo Generating report for: ' + commandInput, (error, stdout) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ status: 'Report generated successfully', output: stdout.trim() });
  });
}
`;

    const immunizer = new BlueAgentImmunizer();
    const candidatePatch = immunizer.synthesizePatch(mockVuln, originalSource);

    const verifier = new ImmunizationVerifier({ port: 3995, useLocalRunner: true });
    const result = await verifier.verifyPatch(mockVuln, candidatePatch);

    assert.equal(result.immunizationResults.exploitBlocked, true);
    assert.equal(result.immunizationResults.goldenInputsPreserved, true);
    assert.equal(result.immunizationResults.unitTestsPassed, true);
    assert.equal(result.status, 'IMMUNIZED');
    assert.equal(result.resultingCvssScore, 0.0);
  });
});
