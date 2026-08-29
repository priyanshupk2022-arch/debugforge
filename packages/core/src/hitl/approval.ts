import { PatchResult, HITLApproval } from "../types.js";
import crypto from "node:crypto";

export interface PendingApprovalEntry {
  patch: PatchResult;
  nonce: string;
  signature: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export class HITLGatekeeper {
  private secretKey: string;
  private ttlMs: number;
  private pendingApprovals: Map<string, PendingApprovalEntry> = new Map();
  private auditLog: HITLApproval[] = [];

  constructor(secretKey = process.env.HITL_SECRET_KEY || "debugforge_secure_hitl_key_2026", ttlMs = 600000) {
    this.secretKey = secretKey;
    this.ttlMs = ttlMs; // 10 minutes default
  }

  createApprovalRequest(patch: PatchResult): { nonce: string; signature: string; expiresAt: number; patch: PatchResult } {
    const nonce = crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + this.ttlMs;

    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(`${nonce}:${patch.id}:${expiresAt}`)
      .digest("hex");

    this.pendingApprovals.set(nonce, {
      patch,
      nonce,
      signature,
      createdAt: Date.now(),
      expiresAt,
      used: false,
    });

    return { nonce, signature, expiresAt, patch };
  }

  evaluateDecision(
    nonce: string,
    decision: "approved" | "rejected" | "edited",
    options: { feedback?: string; operator?: string; signature?: string } = {}
  ): HITLApproval {
    const req = this.pendingApprovals.get(nonce);

    if (!req) {
      throw new Error(`[HITL Security Error] Invalid or unknown approval nonce: ${nonce}`);
    }

    if (req.used) {
      throw new Error(`[HITL Security Replay Attack] Nonce ${nonce} has already been evaluated.`);
    }

    if (Date.now() > req.expiresAt) {
      this.pendingApprovals.delete(nonce);
      throw new Error(`[HITL Security Timeout] Approval request for nonce ${nonce} has expired.`);
    }

    // Optional cryptographic signature check if signature is provided
    if (options.signature) {
      const expectedSig = crypto
        .createHmac("sha256", this.secretKey)
        .update(`${nonce}:${req.patch.id}:${req.expiresAt}`)
        .digest("hex");

      if (options.signature !== expectedSig) {
        throw new Error(`[HITL Signature Mismatch] Provided signature is invalid.`);
      }
    }

    req.used = true;

    const approvalResult: HITLApproval = {
      patchId: req.patch.id,
      status: decision,
      decisionBy: options.operator || "human_operator",
      feedback: options.feedback,
      timestamp: Date.now(),
    };

    this.auditLog.push(approvalResult);
    return approvalResult;
  }

  getAuditLog(): HITLApproval[] {
    return [...this.auditLog];
  }
}

export const hitlGatekeeper = new HITLGatekeeper();
