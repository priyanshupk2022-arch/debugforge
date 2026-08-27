import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import {
  ZeroShieldSessionStore,
  TrueForgeMcpServer,
  VulnerabilityReport,
  SecurityPatchNode,
} from '../src/index.js';

describe('ZeroShield TrueForge MCP Server & Session Store', () => {
  let tmpDir: string;
  let dbPath: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-mcp-test-'));
    dbPath = path.join(tmpDir, 'test_sessions.db');
  });

  after(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('ZeroShieldSessionStore (SQLite WAL)', () => {
    it('should create and retrieve a session with WAL mode enabled', () => {
      const store = new ZeroShieldSessionStore({ dbPath });
      const sessionId = 'session_test_001';
      const targetRepo = '/repos/vulnerable-app';

      const created = store.createSession(sessionId, targetRepo, {
        maxIterations: 5,
        sandboxPort: 9000,
      });

      assert.equal(created.sessionId, sessionId);
      assert.equal(created.targetRepoPath, targetRepo);
      assert.equal(created.maxIterations, 5);
      assert.equal(created.sandboxPort, 9000);
      assert.equal(created.hitlStatus, 'PENDING');

      const fetched = store.getSession(sessionId);
      assert.ok(fetched);
      assert.equal(fetched?.sessionId, sessionId);
      assert.equal(fetched?.targetRepoPath, targetRepo);

      // Verify audit trail logged session initialization
      const audits = store.getAuditTrail(sessionId);
      assert.ok(audits.length >= 1);
      assert.equal(audits[0].eventType, 'SESSION_INITIALIZED');

      store.close();
    });

    it('should update and persist session state modifications', () => {
      const store = new ZeroShieldSessionStore({ dbPath });
      const sessionId = 'session_test_001';

      const session = store.getSession(sessionId);
      assert.ok(session);

      session.hitlStatus = 'APPROVED';
      session.hitlApprovalToken = 'token_abc123';
      session.generatedPullRequestUrl = 'https://github.com/org/repo/pull/42';
      session.currentPatchIteration = 2;

      store.saveSession(session);

      const updated = store.getSession(sessionId);
      assert.equal(updated?.hitlStatus, 'APPROVED');
      assert.equal(updated?.hitlApprovalToken, 'token_abc123');
      assert.equal(updated?.generatedPullRequestUrl, 'https://github.com/org/repo/pull/42');
      assert.equal(updated?.currentPatchIteration, 2);

      store.close();
    });

    it('should record audit trail entries and store context pointers', () => {
      const store = new ZeroShieldSessionStore({ dbPath });
      const sessionId = 'session_test_001';

      store.recordAuditTrail({
        sessionId,
        eventType: 'AST_PATCH_APPLIED',
        actor: 'BlueAgentImmunizer',
        details: { patchId: 'patch_123', cwe: 'CWE-78' },
      });

      const audits = store.getAuditTrail(sessionId);
      const patchAudit = audits.find(a => a.eventType === 'AST_PATCH_APPLIED');
      assert.ok(patchAudit);
      assert.equal(patchAudit?.actor, 'BlueAgentImmunizer');
      assert.equal(patchAudit?.details.cwe, 'CWE-78');

      // Context pointers
      store.setContextPointer(sessionId, 'last_checkpoint', { step: 'HITL_GATE', status: 'WAITING' });
      store.setContextPointer(sessionId, 'active_cve', 'CVE-2026-9999');

      const checkpoint = store.getContextPointer<{ step: string; status: string }>(sessionId, 'last_checkpoint');
      assert.equal(checkpoint?.step, 'HITL_GATE');

      const allPointers = store.getAllContextPointers(sessionId);
      assert.equal(allPointers.active_cve, 'CVE-2026-9999');

      store.close();
    });

    it('should list and delete sessions', () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      store.createSession('s1', '/repo1');
      store.createSession('s2', '/repo2');

      const list = store.listSessions();
      assert.equal(list.length, 2);

      const deleted = store.deleteSession('s1');
      assert.equal(deleted, true);
      assert.equal(store.getSession('s1'), null);
      assert.equal(store.listSessions().length, 1);

      store.close();
    });
  });

  describe('TrueForgeMcpServer Tool Definitions & Execution', () => {
    it('should expose all 4 TrueForge-compatible MCP tool definitions', () => {
      const server = new TrueForgeMcpServer();
      const tools = server.getToolDefinitions();

      assert.equal(tools.length, 4);
      const toolNames = tools.map(t => t.name);
      assert.ok(toolNames.includes('zeroshield_sast_scan'));
      assert.ok(toolNames.includes('zeroshield_daytona_exploit'));
      assert.ok(toolNames.includes('zeroshield_avo_patch'));
      assert.ok(toolNames.includes('zeroshield_immunize_verify'));

      for (const tool of tools) {
        assert.ok(tool.description.length > 0);
        assert.equal(tool.inputSchema.type, 'object');
        assert.ok(tool.inputSchema.properties);
      }
    });

    it('should execute zeroshield_sast_scan and update session audit log', async () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      const sessionId = 'sast_session_1';
      store.createSession(sessionId, tmpDir);

      // Create a vulnerable test file in tmpDir
      const vulnFile = path.join(tmpDir, 'vuln_exec.ts');
      fs.writeFileSync(
        vulnFile,
        `import { exec } from 'child_process';
         export function runUserCmd(cmd: string) {
           exec("echo " + cmd, (err, stdout) => console.log(stdout));
         }`
      );

      const server = new TrueForgeMcpServer(store);
      const result = await server.executeTool('zeroshield_sast_scan', {
        targetDir: tmpDir,
        sessionId,
      });

      assert.equal(result.isError, undefined);
      assert.ok(result.content[0].text);
      const parsed = JSON.parse(result.content[0].text);
      assert.equal(parsed.success, true);
      assert.ok(parsed.count >= 1);
      assert.equal(parsed.reports[0].category, 'COMMAND_INJECTION');

      // Verify session updated with discovered sinks
      const session = store.getSession(sessionId);
      assert.equal(session?.discoveredSinks.length, parsed.count);

      const audits = store.getAuditTrail(sessionId);
      const scanAudit = audits.find(a => a.eventType === 'SAST_SCAN_COMPLETED');
      assert.ok(scanAudit);
    });

    it('should execute zeroshield_avo_patch and synthesize AST security fix', async () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      const sessionId = 'patch_session_1';
      store.createSession(sessionId, tmpDir);

      const server = new TrueForgeMcpServer(store);
      const mockReport: VulnerabilityReport = {
        id: 'vuln_ci_001',
        category: 'COMMAND_INJECTION',
        cwe: 'CWE-78: OS Command Injection',
        cvssBaseScore: 9.8,
        vulnerableFilePath: 'src/routes/report.ts',
        vulnerableLineNumber: 15,
        sinkIdentifier: 'exec',
        codeSnippet: 'exec("generate_report.sh " + cmd, (err, stdout) => { res.send(stdout); });',
        exploitPayloadSpec: {
          protocol: 'HTTP_POST',
          endpoint: '/api/report',
          bodyPayload: { command: '; cat /etc/passwd' },
          expectedProofSignature: 'root:x:0:0:',
        },
        goldenValidInputs: [],
        status: 'EXPLOIT_CONFIRMED',
      };

      const sourceCode = `
        import { exec } from 'child_process';
        app.post('/api/report', (req, res) => {
          const cmd = req.body.command;
          exec("generate_report.sh " + cmd, (err, stdout) => {
            res.send(stdout);
          });
        });
      `;

      const result = await server.executeTool('zeroshield_avo_patch', {
        vulnerability: mockReport,
        sourceContent: sourceCode,
        sessionId,
      });

      assert.equal(result.isError, undefined);
      const patchNode: SecurityPatchNode = JSON.parse(result.content[0].text);
      assert.ok(patchNode.id.startsWith('patch_'));
      assert.equal(patchNode.vulnerabilityId, mockReport.id);
      assert.match(patchNode.patchedCodeSnippet, /execFile/);
      assert.ok(patchNode.patchDiff.length > 0);

      // Verify audit trail
      const audits = store.getAuditTrail(sessionId);
      const patchAudit = audits.find(a => a.eventType === 'PATCH_SYNTHESIZED');
      assert.ok(patchAudit);
    });

    it('should execute zeroshield_immunize_verify and evaluate 3-lock gating', async () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      const sessionId = 'verify_session_1';
      store.createSession(sessionId, tmpDir);

      const server = new TrueForgeMcpServer(store);

      // Start a mock immunized server returning 400 on malicious input
      const testPort = 19876;
      const testServer = http.createServer((req, res) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
          if (body.includes('cat /etc/passwd')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid command input' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success' }));
          }
        });
      });

      await new Promise<void>(resolve => testServer.listen(testPort, '127.0.0.1', () => resolve()));

      const mockReport: VulnerabilityReport = {
        id: 'vuln_verify_001',
        category: 'COMMAND_INJECTION',
        cwe: 'CWE-78',
        cvssBaseScore: 9.8,
        vulnerableFilePath: 'src/routes/report.ts',
        vulnerableLineNumber: 15,
        sinkIdentifier: 'exec',
        codeSnippet: '',
        exploitPayloadSpec: {
          protocol: 'HTTP_POST',
          endpoint: '/api/report',
          bodyPayload: { command: '; cat /etc/passwd' },
          expectedProofSignature: 'root:x:0:0:',
        },
        goldenValidInputs: [
          {
            description: 'Valid command execution',
            protocol: 'HTTP_POST',
            endpoint: '/api/report',
            bodyPayload: { command: 'daily_summary' },
            expectedStatusCode: 200,
            expectedResponseSubstring: 'success',
          },
        ],
        status: 'EXPLOIT_CONFIRMED',
      };

      const candidatePatch: SecurityPatchNode = {
        id: 'candidate_patch_001',
        parentId: null,
        vulnerabilityId: mockReport.id,
        timestamp: Date.now(),
        filePath: mockReport.vulnerableFilePath,
        originalCodeSnippet: '',
        patchedCodeSnippet: '',
        patchDiff: 'diff content',
        resultingCvssScore: 9.8,
        status: 'CANDIDATE',
        immunizationResults: {
          exploitBlocked: false,
          goldenInputsPreserved: false,
          unitTestsPassed: false,
          testSuiteExitCode: 1,
        },
      };

      const result = await server.executeTool('zeroshield_immunize_verify', {
        vulnerability: mockReport,
        candidatePatch,
        port: testPort,
        mockTestSuitePass: true,
        sessionId,
      });

      testServer.close();

      assert.equal(result.isError, undefined);
      const verifiedPatch: SecurityPatchNode = JSON.parse(result.content[0].text);
      assert.equal(verifiedPatch.status, 'IMMUNIZED');
      assert.equal(verifiedPatch.resultingCvssScore, 0.0);
      assert.equal(verifiedPatch.immunizationResults.exploitBlocked, true);
      assert.equal(verifiedPatch.immunizationResults.goldenInputsPreserved, true);
      assert.equal(verifiedPatch.immunizationResults.unitTestsPassed, true);
    });

    it('should execute zeroshield_daytona_exploit against target arena', async () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      const sessionId = 'exploit_session_1';
      store.createSession(sessionId, tmpDir);

      const server = new TrueForgeMcpServer(store);

      // Start a mock vulnerable HTTP server
      const testPort = 19877;
      const testServer = http.createServer((req, res) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
          // Vulnerable response leaking password file signature
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin');
        });
      });

      await new Promise<void>(resolve => testServer.listen(testPort, '127.0.0.1', () => resolve()));

      const mockReport: VulnerabilityReport = {
        id: 'vuln_exploit_001',
        category: 'COMMAND_INJECTION',
        cwe: 'CWE-78',
        cvssBaseScore: 9.8,
        vulnerableFilePath: 'src/routes/report.ts',
        vulnerableLineNumber: 15,
        sinkIdentifier: 'exec',
        codeSnippet: '',
        exploitPayloadSpec: {
          protocol: 'HTTP_POST',
          endpoint: '/api/report',
          bodyPayload: { command: '; cat /etc/passwd' },
          expectedProofSignature: 'root:x:0:0:',
        },
        goldenValidInputs: [],
        status: 'SUSPECTED',
      };

      const result = await server.executeTool('zeroshield_daytona_exploit', {
        vulnerability: mockReport,
        port: testPort,
        useLocalRunner: true,
        sessionId,
      });

      testServer.close();

      assert.equal(result.isError, undefined);
      const exploitResult = JSON.parse(result.content[0].text);
      assert.equal(exploitResult.exploitConfirmed, true);
      assert.equal(exploitResult.statusCode, 200);
      assert.match(exploitResult.capturedProof, /root:x:0:0:/);

      // Verify audit trail logged exploit confirmation
      const audits = store.getAuditTrail(sessionId);
      const exploitAudit = audits.find(a => a.eventType === 'EXPLOIT_PROOF_EXECUTED');
      assert.ok(exploitAudit);
    });

    it('should handle JSON-RPC 2.0 protocol requests (ping, initialize, tools/list, tools/call)', async () => {
      const server = new TrueForgeMcpServer();

      // Ping
      const pingResp = await server.handleJsonRpc({ jsonrpc: '2.0', id: 1, method: 'ping' });
      assert.equal(pingResp.jsonrpc, '2.0');
      assert.equal(pingResp.id, 1);
      assert.equal((pingResp.result as { status: string }).status, 'pong');

      // Initialize
      const initResp = await server.handleJsonRpc({ jsonrpc: '2.0', id: 2, method: 'initialize' });
      assert.equal(initResp.id, 2);
      assert.equal((initResp.result as { serverInfo: { name: string } }).serverInfo.name, 'zeroshield-trueforge-mcp');

      // Tools list
      const listResp = await server.handleJsonRpc({ jsonrpc: '2.0', id: 3, method: 'tools/list' });
      assert.equal(listResp.id, 3);
      assert.equal((listResp.result as { tools: unknown[] }).tools.length, 4);

      // Tools call
      const callResp = await server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'zeroshield_sast_scan',
          arguments: { targetDir: tmpDir },
        },
      });
      assert.equal(callResp.id, 4);
      assert.ok(callResp.result);

      // Invalid method error
      const unknownMethodResp = await server.handleJsonRpc({ jsonrpc: '2.0', id: 5, method: 'non_existent' });
      assert.equal(unknownMethodResp.error?.code, -32601);

      // Invalid protocol version error
      // @ts-expect-error test invalid protocol
      const invalidProtoResp = await server.handleJsonRpc({ jsonrpc: '1.0', id: 6, method: 'ping' });
      assert.equal(invalidProtoResp.error?.code, -32600);
    });
  });
});
