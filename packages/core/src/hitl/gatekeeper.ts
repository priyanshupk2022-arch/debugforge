import * as crypto from 'crypto';
import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';

export interface HITLReviewCard {
  reviewId: string;
  vulnerabilityId: string;
  patchId: string;
  initialCvssScore: number;
  finalCvssScore: number;
  scoreDrop: number;
  cwe: string;
  filePath: string;
  patchDiff: string;
  approvalToken: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export class HITLGatekeeper {
  private secretKey: string;

  constructor(secretKey: string = process.env.HITL_SECRET || 'zeroshield-default-crypto-secret') {
    this.secretKey = secretKey;
  }

  public generateReviewCard(vulnerability: VulnerabilityReport, patch: SecurityPatchNode): HITLReviewCard {
    const token = this.generateToken(patch.id);
    const scoreDrop = parseFloat((vulnerability.cvssBaseScore - patch.resultingCvssScore).toFixed(1));

    return {
      reviewId: `review_${Date.now()}`,
      vulnerabilityId: vulnerability.id,
      patchId: patch.id,
      initialCvssScore: vulnerability.cvssBaseScore,
      finalCvssScore: patch.resultingCvssScore,
      scoreDrop: scoreDrop,
      cwe: vulnerability.cwe,
      filePath: vulnerability.vulnerableFilePath,
      patchDiff: patch.patchDiff,
      approvalToken: token,
      status: 'PENDING_APPROVAL',
    };
  }

  public verifyApproval(patchId: string, token: string): boolean {
    const expectedToken = this.generateToken(patchId);
    const bufA = Buffer.from(token, 'utf8');
    const bufB = Buffer.from(expectedToken, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  private generateToken(patchId: string): string {
    return crypto.createHmac('sha256', this.secretKey).update(patchId).digest('hex');
  }
}
