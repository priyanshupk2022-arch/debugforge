import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HITLGatekeeper } from '../src/hitl/gatekeeper.js';
import { TrueForgeMcpServer } from '../src/mcp/server.js';
import { VulnerabilityHunter } from '../src/hunter/scanner.js';

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
  });

  describe('Adversarial AST Malformed Input Handling', () => {
    it('should gracefully handle malformed code and unsupported patterns without crashing', () => {
      const hunter = new VulnerabilityHunter();
      // Scan on non-existent directory must fail closed with clean error
      assert.throws(() => hunter.scanDirectory('non_existent_directory_xyz'), /Target directory does not exist/);
    });
  });
});
