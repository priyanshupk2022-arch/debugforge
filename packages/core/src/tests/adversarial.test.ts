import { describe, it } from "node:test";
import assert from "node:assert";
import { hitlGatekeeper } from "../hitl/approval.js";
import { ingestError } from "../tools/ingest-error.js";
import { verifyFix } from "../tools/verify-fix.js";

describe("DebugForge Adversarial & Boundary Test Suite", () => {
  it("should reject replayed approval nonces (Anti-Replay Protection)", () => {
    const fakePatch = {
      id: "patch_replay_test",
      errorId: "err_replay_123",
      patches: [],
      summary: "Replay test patch",
      synthesizedAt: Date.now(),
    };

    const req = hitlGatekeeper.createApprovalRequest(fakePatch);
    const decision1 = hitlGatekeeper.evaluateDecision(req.nonce, "approved", { operator: "admin" });
    assert.strictEqual(decision1.status, "approved");

    // Second evaluation with the exact same nonce MUST throw an error
    assert.throws(
      () => hitlGatekeeper.evaluateDecision(req.nonce, "approved"),
      /already been evaluated/
    );
  });

  it("should fail closed when attempting to verify a non-existent or failing command", async () => {
    const res = await verifyFix({
      errorId: "err_fail_closed",
      projectPath: process.cwd(),
      testCommand: "node -e \"process.exit(1)\"",
    });

    assert.strictEqual(res.allPassed, false);
    assert.strictEqual(res.lock1_bugFixed, false);
  });

  it("should safely parse malformed and empty error logs without throwing unhandled exceptions", () => {
    const emptyReport = ingestError("");
    assert.strictEqual(emptyReport.errorType, "UnknownError");
    assert.ok(emptyReport.id.startsWith("err_"));

    const garbageReport = ingestError("@@@#$%^&*() RANDOM MEMORY DUMP \x00\xFF\xFE");
    assert.strictEqual(garbageReport.errorType, "UnknownError");
    assert.strictEqual(garbageReport.category, "logic_flaw");
  });
});
