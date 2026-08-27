import * as crypto from 'crypto';
import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';

export interface HITLReviewCard {
  reviewId: string;
  vulnerabilityId: string;
  patchId: string;
  patchDigest: string;
  initialCvssScore: number;
  finalCvssScore: number;
  scoreDrop: number;
  cwe: string;
  filePath: string;
  patchDiff: string;
  approvalToken: string;
  expiresAt: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

export class HITLGatekeeper {
  private secretKey: string;
  private approvalRegistry: Map<string, { used: boolean; expiresAt: number; patchDigest: string }> = new Map();

  constructor(secretKey?: string) {
    const configuredKey = secretKey !== undefined ? secretKey : process.env.HITL_SECRET;
    if (!configuredKey || configuredKey.trim().length < 16) {
      throw new Error(
        'CRITICAL HITL SECURITY FAILURE: HITL_SECRET environment variable is missing or shorter than 16 characters. Production gates fail closed.'
      );
    }
    this.secretKey = configuredKey;
  }

  public generateReviewCard(vulnerability: VulnerabilityReport, patch: SecurityPatchNode, ttlMs = 3600000): HITLReviewCard {
    const expiresAt = Date.now() + ttlMs;
    const token = this.generateToken(patch.id, patch.patchDigest, expiresAt);
    const scoreDrop = parseFloat((vulnerability.cvssBaseScore - patch.resultingCvssScore).toFixed(1));

    this.approvalRegistry.set(token, {
      used: false,
      expiresAt,
      patchDigest: patch.patchDigest,
    });

    return {
      reviewId: `review_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      vulnerabilityId: vulnerability.id,
      patchId: patch.id,
      patchDigest: patch.patchDigest,
      initialCvssScore: vulnerability.cvssBaseScore,
      finalCvssScore: patch.resultingCvssScore,
      scoreDrop: scoreDrop,
      cwe: vulnerability.cwe,
      filePath: vulnerability.vulnerableFilePath,
      patchDiff: patch.patchDiff,
      approvalToken: token,
      expiresAt,
      status: 'PENDING_APPROVAL',
    };
  }

  public verifyApproval(patchId: string, patchDigest: string, token: string, expiresAt: number): boolean {
    // 1. Check expiration
    if (Date.now() > expiresAt) {
      return false;
    }

    // 2. Check Replay Attack Prevention
    const record = this.approvalRegistry.get(token);
    if (!record || record.used || record.patchDigest !== patchDigest) {
      return false;
    }

    // 3. Cryptographic Timing-Safe Constant Time Verification
    const expectedToken = this.generateToken(patchId, patchDigest, expiresAt);
    const bufA = Buffer.from(token, 'utf8');
    const bufB = Buffer.from(expectedToken, 'utf8');
    if (bufA.length !== bufB.length) return false;

    const isValid = crypto.timingSafeEqual(bufA, bufB);
    if (isValid) {
      // Mark token as used to prevent replaying
      record.used = true;
    }

    return isValid;
  }

  private generateToken(patchId: string, patchDigest: string, expiresAt: number): string {
    const payload = `${patchId}:${patchDigest}:${expiresAt}`;
    return crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
  }
}
