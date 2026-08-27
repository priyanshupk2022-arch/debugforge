import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as http from 'http';
import { RedAgentArena } from '../src/redteam/exploit.js';
import { VulnerabilityReport } from '../src/types/index.js';

describe('RedAgentArena (Dynamic Exploit Proof in Daytona Sandbox)', () => {
  it('should prove vulnerability and capture proof signature on vulnerable target', async () => {
    // 1. Mock vulnerable server
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        if (req.url === '/api/report' && body.includes('; cat /etc/passwd')) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon...');
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Bad Request');
        }
      });
    });

    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address() as { port: number };

    const mockVuln: VulnerabilityReport = {
      id: 'test_vuln_1',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      confidence: 'HIGH',
      vulnerableFilePath: 'src/routes/report.ts',
      vulnerableLineNumber: 42,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'exec',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.command',
        sinkSymbol: 'exec',
        taintedParameter: 'command',
        frameworkContext: 'Express.js',
        tracePath: ['line 42'],
      },
      codeSnippet: 'exec(cmd)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/report',
        bodyPayload: { command: '; cat /etc/passwd' },
        expectedProofSignature: 'root:x:0:0',
      },
      goldenValidInputs: [],
      status: 'SUSPECTED',
    };

    const arena = new RedAgentArena({ fallbackPort: address.port, useLocalRunner: true });
    const result = await arena.executeExploitProof(mockVuln);

    assert.equal(result.exploitConfirmed, true);
    assert.match(result.capturedProof, /root:x:0:0/);
    assert.equal(result.statusCode, 200);

    server.close();
  });

  it('should return false if target server blocks or sanitizes the exploit payload', async () => {
    // 1. Mock immune server
    const server = http.createServer((_req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid input characters detected' }));
    });

    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address() as { port: number };

    const mockVuln: VulnerabilityReport = {
      id: 'test_vuln_2',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      confidence: 'HIGH',
      vulnerableFilePath: 'src/routes/report.ts',
      vulnerableLineNumber: 42,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'exec',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.command',
        sinkSymbol: 'exec',
        taintedParameter: 'command',
        frameworkContext: 'Express.js',
        tracePath: ['line 42'],
      },
      codeSnippet: 'exec(cmd)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/report',
        bodyPayload: { command: '; cat /etc/passwd' },
        expectedProofSignature: 'root:x:0:0',
      },
      goldenValidInputs: [],
      status: 'SUSPECTED',
    };

    const arena = new RedAgentArena({ fallbackPort: address.port, useLocalRunner: true });
    const result = await arena.executeExploitProof(mockVuln);

    assert.equal(result.exploitConfirmed, false);
    assert.equal(result.statusCode, 400);

    server.close();
  });
});
