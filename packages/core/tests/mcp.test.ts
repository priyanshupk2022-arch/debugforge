import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TrueForgeMcpServer } from '../src/mcp/server.js';
import { ZeroShieldSessionStore } from '../src/mcp/session.js';
import { VulnerabilityReport, SecurityPatchNode } from '../src/types/index.js';

describe('ZeroShield TrueForge MCP Server & Session Store', () => {
  describe('ZeroShieldSessionStore (SQLite WAL)', () => {
    it('should create and retrieve a session with WAL mode enabled', () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      const session = store.createSession('test-session-1', '/tmp/repo');

      assert.equal(session.sessionId, 'test-session-1');
      assert.equal(session.targetRepoPath, '/tmp/repo');
      assert.equal(session.discoveredSinks.length, 0);

      const retrieved = store.getSession('test-session-1');
      assert.notEqual(retrieved, null);
      assert.equal(retrieved?.sessionId, 'test-session-1');
    });

    it('should update and persist session state modifications', () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      store.createSession('test-session-2', '/tmp/repo-2');

      const mockVuln: VulnerabilityReport = {
        id: 'vuln_mcp_1',
        category: 'COMMAND_INJECTION',
        cwe: 'CWE-78: OS Command Injection',
        cvssBaseScore: 9.8,
        confidence: 'HIGH',
        vulnerableFilePath: 'src/report.ts',
        vulnerableLineNumber: 10,
        vulnerableColumnNumber: 5,
        sinkIdentifier: 'exec',
        sourceToSinkEvidence: {
          sourceSymbol: 'req.body.command',
          sinkSymbol: 'exec',
          taintedParameter: 'command',
          frameworkContext: 'Express.js',
          tracePath: ['line 10'],
        },
        codeSnippet: 'exec(cmd)',
        exploitPayloadSpec: {
          protocol: 'HTTP_POST',
          endpoint: '/api/report',
          bodyPayload: { command: '; cat /etc/passwd' },
          expectedProofSignature: 'root:x:0:0',
        },
        goldenValidInputs: [],
        status: 'EXPLOIT_CONFIRMED',
      };

      const session = store.getSession('test-session-2')!;
      session.discoveredSinks.push(mockVuln);
      session.hitlStatus = 'APPROVED';
      store.saveSession(session);

      const reloaded = store.getSession('test-session-2');
      assert.equal(reloaded?.discoveredSinks.length, 1);
      assert.equal(reloaded?.discoveredSinks[0].cwe, 'CWE-78: OS Command Injection');
      assert.equal(reloaded?.hitlStatus, 'APPROVED');
    });

    it('should record audit trail entries and store context pointers', () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      store.createSession('test-session-3', '/tmp/repo-3');

      store.recordAuditTrail({
        sessionId: 'test-session-3',
        eventType: 'SAST_SCAN_STARTED',
        actor: 'mcp-test-runner',
        details: { target: '/tmp/repo-3' },
      });

      const auditTrail = store.getAuditTrail('test-session-3');
      // 1 from createSession (SESSION_INITIALIZED) + 1 from explicit recordAuditTrail = 2
      assert.equal(auditTrail.length, 2);
      assert.equal(auditTrail[1].eventType, 'SAST_SCAN_STARTED');
      assert.equal(auditTrail[1].actor, 'mcp-test-runner');

      store.setContextPointer('test-session-3', 'activeReportId', 'vuln_123');
      assert.equal(store.getContextPointer('test-session-3', 'activeReportId'), 'vuln_123');
      assert.equal(store.getContextPointer('test-session-3', 'nonexistent'), null);
    });

    it('should list and delete sessions', () => {
      const store = new ZeroShieldSessionStore({ inMemory: true });
      store.createSession('session-a', '/tmp/a');
      store.createSession('session-b', '/tmp/b');

      const list = store.listSessions();
      assert.equal(list.length, 2);

      const deleted = store.deleteSession('session-a');
      assert.equal(deleted, true);
      assert.equal(store.getSession('session-a'), null);
      assert.equal(store.listSessions().length, 1);
    });
  });

  describe('TrueForgeMcpServer Tool Definitions & Execution', () => {
    it('should expose all 4 TrueForge-compatible MCP tool definitions', () => {
      const server = new TrueForgeMcpServer();
      const tools = server.getToolDefinitions();

      assert.equal(tools.length, 4);
      const names = tools.map(t => t.name);
      assert.equal(names.includes('zeroshield_sast_scan'), true);
      assert.equal(names.includes('zeroshield_daytona_exploit'), true);
      assert.equal(names.includes('zeroshield_avo_patch'), true);
      assert.equal(names.includes('zeroshield_immunize_verify'), true);
    });

    it('should execute zeroshield_sast_scan and update session audit log', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-mcp-test-'));
      const testFile = path.join(tmpDir, 'vuln.ts');
      fs.writeFileSync(
        testFile,
        `import { exec } from 'child_process';\nexport function run(req: any) { exec("cat " + req.body.file); }`
      );

      const store = new ZeroShieldSessionStore({ inMemory: true });
      store.createSession('mcp-scan-session', tmpDir);
      const server = new TrueForgeMcpServer(store, [tmpDir, os.tmpdir()]);

      const result = await server.executeTool('zeroshield_sast_scan', {
        targetDir: tmpDir,
        sessionId: 'mcp-scan-session',
      });

      assert.equal(result.isError, undefined);
      const payload = JSON.parse(result.content[0].text);
      assert.equal(payload.success, true);
      assert.equal(payload.count, 1);
      assert.equal(payload.reports[0].category, 'COMMAND_INJECTION');

      const audit = store.getAuditTrail('mcp-scan-session');
      assert.equal(audit.some(a => a.eventType === 'SAST_SCAN_COMPLETED'), true);

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should execute zeroshield_avo_patch and synthesize AST security fix', async () => {
      const server = new TrueForgeMcpServer();
      const mockVuln: VulnerabilityReport = {
        id: 'vuln_patch_1',
        category: 'COMMAND_INJECTION',
        cwe: 'CWE-78: OS Command Injection',
        cvssBaseScore: 9.8,
        confidence: 'HIGH',
        vulnerableFilePath: 'src/report.ts',
        vulnerableLineNumber: 2,
        vulnerableColumnNumber: 5,
        sinkIdentifier: 'exec',
        sourceToSinkEvidence: {
          sourceSymbol: 'req.body.cmd',
          sinkSymbol: 'exec',
          taintedParameter: 'cmd',
          frameworkContext: 'Express.js',
          tracePath: ['line 2'],
        },
        codeSnippet: 'exec("run.sh " + req.body.cmd)',
        exploitPayloadSpec: { protocol: 'HTTP_POST', endpoint: '/api/report', expectedProofSignature: 'root:x:0:0' },
        goldenValidInputs: [],
        status: 'EXPLOIT_CONFIRMED',
      };

      const sourceCode = `import { exec } from 'child_process';\nexec("run.sh " + req.body.cmd, () => {});`;

      const result = await server.executeTool('zeroshield_avo_patch', {
        vulnerability: mockVuln,
        sourceContent: sourceCode,
      });

      assert.equal(result.isError, undefined);
      const patchNode = JSON.parse(result.content[0].text) as SecurityPatchNode;
      assert.equal(patchNode.status, 'CANDIDATE');
      assert.match(patchNode.patchedCodeSnippet, /execFile/);
      assert.match(patchNode.patchDigest, /^[a-f0-9]{64}$/);
    });

    it('should handle JSON-RPC 2.0 protocol requests (ping, initialize, tools/list, tools/call)', async () => {
      const server = new TrueForgeMcpServer();

      // ping
      const pingRes = await server.handleJsonRpc({ jsonrpc: '2.0', id: 1, method: 'ping' });
      assert.equal((pingRes.result as { status: string }).status, 'pong');

      // initialize
      const initRes = await server.handleJsonRpc({ jsonrpc: '2.0', id: 2, method: 'initialize' });
      assert.equal((initRes.result as { protocolVersion: string }).protocolVersion, '2024-11-05');

      // tools/list
      const listRes = await server.handleJsonRpc({ jsonrpc: '2.0', id: 3, method: 'tools/list' });
      assert.equal((listRes.result as { tools: unknown[] }).tools.length, 4);
    });
  });
});
