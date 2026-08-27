"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HITLGatekeeper = void 0;
const crypto = __importStar(require("crypto"));
class HITLGatekeeper {
    secretKey;
    constructor(secretKey = process.env.HITL_SECRET || 'zeroshield-default-crypto-secret') {
        this.secretKey = secretKey;
    }
    generateReviewCard(vulnerability, patch) {
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
    verifyApproval(patchId, token) {
        const expectedToken = this.generateToken(patchId);
        const bufA = Buffer.from(token, 'utf8');
        const bufB = Buffer.from(expectedToken, 'utf8');
        if (bufA.length !== bufB.length)
            return false;
        return crypto.timingSafeEqual(bufA, bufB);
    }
    generateToken(patchId) {
        return crypto.createHmac('sha256', this.secretKey).update(patchId).digest('hex');
    }
}
exports.HITLGatekeeper = HITLGatekeeper;
