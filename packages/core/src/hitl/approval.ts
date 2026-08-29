import { PatchResult, HITLApproval } from "../types.js";
import crypto from "node:crypto";

export interface PendingApprovalEntry {
  patch: PatchResult;
  patchHash: string;
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

  constructor(secretKey?: string, ttlMs = 600000) {
    const configuredKey = secretKey || process.env.HITL_SECRET_KEY;
    if (!configuredKey) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "[HITL Security Blocker] HITL_SECRET_KEY environment variable is REQUIRED in production. Startup blocked."
        );
      }
      // Non-production fallback with explicit warning
      this.secretKey = "debugforge_dev_only_secret_key";
    } else {
      this.secretKey = configuredKey;
    }
    this.ttlMs = ttlMs;
  }

  computePatchHash(patch: PatchResult): string {
    const rawDiffs = patch.patches.map(p => `${p.filePath}:${p.diffHunk}`).join("\n---\n");
    return crypto.createHash("sha256").update(rawDiffs).digest("hex");
  }

  createApprovalRequest(patch: PatchResult): {
    nonce: string;
    signature: string;
    patchHash: string;
    expiresAt: number;
    patch: PatchResult;
  } {
    const nonce = crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + this.ttlMs;
    const patchHash = this.computePatchHash(patch);

    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(`${nonce}:${patch.id}:${patchHash}:${expiresAt}`)
      .digest("hex");

    this.pendingApprovals.set(nonce, {
      patch,
      patchHash,
      nonce,
      signature,
      createdAt: Date.now(),
      expiresAt,
      used: false,
    });

    return { nonce, signature, patchHash, expiresAt, patch };
  }

  evaluateDecision(
    nonce: string,
    decision: "approved" | "rejected" | "edited",
    options: { feedback?: string; operator?: string; signature?: string; currentPatch?: PatchResult } = {}
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

    // Tamper Detection: If current patch is provided, assert its hash matches the approved hash
    if (options.currentPatch) {
      const currentHash = this.computePatchHash(options.currentPatch);
      if (currentHash !== req.patchHash) {
        throw new Error(
          `[HITL Tamper Detection] Patch content has been modified after approval request creation. Evaluation blocked.`
        );
      }
    }

    // Constant-Time Cryptographic Signature Validation if signature provided
    if (options.signature) {
      const expectedSig = crypto
        .createHmac("sha256", this.secretKey)
        .update(`${nonce}:${req.patch.id}:${req.patchHash}:${req.expiresAt}`)
        .digest("hex");

      const sigBuf = Buffer.from(options.signature, "hex");
      const expBuf = Buffer.from(expectedSig, "hex");

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        throw new Error(`[HITL Signature Mismatch] Provided signature is invalid or tampered.`);
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
