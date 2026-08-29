import { PatchResult, HITLApproval } from "../types.js";
import crypto from "node:crypto";

export class HITLGatekeeper {
  private pendingApprovals: Map<string, { patch: PatchResult; nonce: string; createdAt: number }> = new Map();

  createApprovalRequest(patch: PatchResult): { nonce: string; patch: PatchResult } {
    const nonce = crypto.randomBytes(16).toString("hex");
    this.pendingApprovals.set(nonce, {
      patch,
      nonce,
      createdAt: Date.now(),
    });
    return { nonce, patch };
  }

  evaluateDecision(nonce: string, decision: "approved" | "rejected" | "edited", feedback?: string): HITLApproval {
    const req = this.pendingApprovals.get(nonce);
    if (!req) {
      throw new Error(`Invalid or expired HITL approval nonce: ${nonce}`);
    }

    this.pendingApprovals.delete(nonce);

    return {
      patchId: req.patch.id,
      status: decision,
      decisionBy: "human_operator",
      feedback,
      timestamp: Date.now(),
    };
  }
}

export const hitlGatekeeper = new HITLGatekeeper();
