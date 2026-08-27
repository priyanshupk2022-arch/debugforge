import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as http from 'http';
import { ImmunizationVerifier } from '../src/verifier/assert.js';
import { VulnerabilityReport, SecurityPatchNode } from '../src/types/index.js';

describe('ImmunizationVerifier (Triple-Lock Assertion Engine)', () => {
  it('should assert all 3 locks pass on successfully patched application', async () => {
    // Mock immune server
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        if (body.includes('; cat /etc/passwd')) {
          // Lock 1: Exploit payload is blocked
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid input characters' }));
        } else if (body.includes('--summary-only')) {
          // Lock 2: Golden legitimate input passes
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'Report generated successfully' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'OK' }));
        }
      });
    });

    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address() as { port: number };

    const mockVuln: VulnerabilityReport = {
      id: 'vuln_1',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      vulnerableFilePath: 'src/report.ts',
      vulnerableLineNumber: 10,
      sinkIdentifier: 'exec',
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
          expectedResponseSubstring: 'Report generated',
        },
      ],
      status: 'EXPLOIT_CONFIRMED',
    };

    const candidatePatch: SecurityPatchNode = {
      id: 'patch_1',
      parentId: null,
      vulnerabilityId: 'vuln_1',
      timestamp: Date.now(),
      filePath: 'src/report.ts',
      originalCodeSnippet: 'exec(cmd)',
      patchedCodeSnippet: 'execFile(cmd)',
      patchDiff: '+ execFile',
      immunizationResults: {
        exploitBlocked: false,
        goldenInputsPreserved: false,
        unitTestsPassed: false,
        testSuiteExitCode: -1,
      },
      resultingCvssScore: 0.0,
      status: 'CANDIDATE',
    };

    const verifier = new ImmunizationVerifier({ port: address.port, mockTestSuitePass: true });
    const result = await verifier.verifyPatch(mockVuln, candidatePatch);

    assert.equal(result.immunizationResults.exploitBlocked, true);
    assert.equal(result.immunizationResults.goldenInputsPreserved, true);
    assert.equal(result.immunizationResults.unitTestsPassed, true);
    assert.equal(result.status, 'IMMUNIZED');

    server.close();
  });
});
