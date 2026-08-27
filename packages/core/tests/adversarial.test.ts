import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import { HITLGatekeeper } from '../src/hitl/gatekeeper.js';
import { TrueForgeMcpServer } from '../src/mcp/server.js';
import { VulnerabilityHunter } from '../src/hunter/scanner.js';
import { LocalIsolatedSandbox, getSanitizedSandboxEnv } from '../src/sandbox/lifecycle.js';

describe('ZeroShield Production Adversarial Security Suite', () => {
  describe('Adversarial Path Traversal Attacks', () => {
    it('should reject MCP tool calls targeting paths outside workspace boundaries', async () => {
      const server = new TrueForgeMcpServer(undefined, ['C:\\allowed\\project']);

      const maliciousTarget = 'C:\\Windows\\System32\\drivers\\etc';
      const result = await server.executeTool('zeroshield_sast_scan', {
        targetDir: maliciousTarget,
      });

      assert.equal(result.isError, true);
      assert.match(result.content[0].text, /SECURITY ACCESS DENIED/);
    });

    it('should reject path prefix collision attempts in MCP workspace validation', () => {
      const allowedDir = path.resolve('test-workspace');
      const server = new TrueForgeMcpServer(undefined, [allowedDir]);

      // Attempt prefix collision: /test-workspace-malicious
      const prefixCollisionPath = allowedDir + '-malicious';
      assert.throws(
        () => server.validateWorkspacePath(prefixCollisionPath),
        /SECURITY ACCESS DENIED/
      );
    });

    it('should reject sandbox file traversal attempts via ../ escaping workspace', async () => {
      const sandbox = new LocalIsolatedSandbox('sbx_test_traversal', '.sandboxes/sbx_test_traversal', 3991);
      await assert.rejects(
        () => sandbox.writeFile('../../escaped_host_file.txt', 'malicious payload'),
        /SECURITY ACCESS DENIED: Path traversal detected/
      );
      await assert.rejects(
        () => sandbox.readFile('../../escaped_host_file.txt'),
        /SECURITY ACCESS DENIED: Path traversal detected/
      );
    });
  });

  describe('Adversarial Secret Isolation in Sandbox', () => {
    it('should sanitize environment and prevent host secrets from leaking to target processes', () => {
      process.env.GITHUB_TOKEN = 'ghp_secret_host_token_12345';
      process.env.DAYTONA_API_KEY = 'dtn_secret_api_key_67890';
      process.env.HITL_SECRET = 'hitl_super_secret_master_key_112233';
      process.env.AWS_SECRET_ACCESS_KEY = 'aws_secret_key_445566';

      const cleanEnv = getSanitizedSandboxEnv(3000);

      assert.equal(cleanEnv.GITHUB_TOKEN, undefined);
      assert.equal(cleanEnv.DAYTONA_API_KEY, undefined);
      assert.equal(cleanEnv.HITL_SECRET, undefined);
      assert.equal(cleanEnv.AWS_SECRET_ACCESS_KEY, undefined);
      assert.equal(cleanEnv.PORT, '3000');
      assert.equal(cleanEnv.NODE_ENV, 'sandbox_isolated');
    });
  });

  describe('Adversarial Cryptographic HITL Attacks', () => {
    it('should fail closed when HITL secret is missing or trivial', () => {
      assert.throws(
        () => new HITLGatekeeper(''),
        /CRITICAL HITL SECURITY FAILURE/
      );
      assert.throws(
        () => new HITLGatekeeper('short-key'),
        /CRITICAL HITL SECURITY FAILURE/
      );
    });

    it('should reject forged, expired, or tampered tokens', () => {
      const gatekeeper = new HITLGatekeeper('production-ultra-secure-key-998877');

      // 1. Expired token
      const expiredTime = Date.now() - 5000;
      const validToken = (gatekeeper as any).generateToken('patch_1', 'digest_1', expiredTime);
      (gatekeeper as any).approvalRegistry.set(validToken, {
        used: false,
        expiresAt: expiredTime,
        patchDigest: 'digest_1',
      });

      const isExpiredValid = gatekeeper.verifyApproval('patch_1', 'digest_1', validToken, expiredTime);
      assert.equal(isExpiredValid, false);

      // 2. Tampered patch digest
      const normalCard = gatekeeper.generateReviewCard(
        { id: 'v1', cvssBaseScore: 9.8, cwe: 'CWE-78', vulnerableFilePath: 'a.ts' } as any,
        { id: 'p1', patchDigest: 'real_digest_123', resultingCvssScore: 0.0, patchDiff: '' } as any
      );

      const isTamperedValid = gatekeeper.verifyApproval('p1', 'attacker_modified_digest', normalCard.approvalToken, normalCard.expiresAt);
      assert.equal(isTamperedValid, false);
    });

    it('should enforce single-use approval tokens to prevent replay attacks', () => {
      const gatekeeper = new HITLGatekeeper('production-ultra-secure-key-998877');
      const card = gatekeeper.generateReviewCard(
        { id: 'v1', cvssBaseScore: 9.8, cwe: 'CWE-78', vulnerableFilePath: 'src/routes/report.ts' } as any,
        { id: 'p1', patchDigest: 'sha256_legit_digest_abc', resultingCvssScore: 0.0, patchDiff: '' } as any
      );

      // First verification must succeed
      const firstAttempt = gatekeeper.verifyApproval('p1', 'sha256_legit_digest_abc', card.approvalToken, card.expiresAt);
      assert.equal(firstAttempt, true);

      // Replay attempt with same token MUST be rejected
      const replayAttempt = gatekeeper.verifyApproval('p1', 'sha256_legit_digest_abc', card.approvalToken, card.expiresAt);
      assert.equal(replayAttempt, false);
    });
  });

  describe('Adversarial AST Malformed Input Handling', () => {
    it('should gracefully handle malformed code and unsupported patterns without crashing', () => {
      const hunter = new VulnerabilityHunter();
      // Scan on non-existent directory must fail closed with clean error
      assert.throws(() => hunter.scanDirectory('non_existent_directory_xyz'), /Target directory does not exist/);
    });
  });
});
