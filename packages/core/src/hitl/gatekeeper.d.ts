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
export declare class HITLGatekeeper {
    private secretKey;
    constructor(secretKey?: string);
    generateReviewCard(vulnerability: VulnerabilityReport, patch: SecurityPatchNode): HITLReviewCard;
    verifyApproval(patchId: string, token: string): boolean;
    private generateToken;
}
