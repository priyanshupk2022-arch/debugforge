import { describe, it } from "node:test";
import assert from "node:assert";
import { hitlGatekeeper } from "../hitl/approval.js";
import { ingestError } from "../tools/ingest-error.js";
import { verifyFix } from "../tools/verify-fix.js";
import { DaytonaSandboxManager } from "../daytona/sandbox.js";

describe("DebugForge Adversarial & Security Boundary Suite", () => {
  it("should reject replayed approval nonces (Anti-Replay Protection)", () => {
    const fakePatch = {
      id: "patch_replay_test",
      errorId: "err_replay_123",
      patches: [{ filePath: "src/a.ts", originalCode: "a", patchedCode: "b", diffHunk: "--- a\n+++ b", purpose: "fix" }],
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

  it("should detect and reject tampered patches during HITL evaluation", () => {
    const originalPatch = {
      id: "patch_tamper_test",
      errorId: "err_tamper_123",
      patches: [{ filePath: "src/a.ts", originalCode: "a", patchedCode: "b", diffHunk: "--- a\n+++ b", purpose: "fix" }],
      summary: "Original safe patch",
      synthesizedAt: Date.now(),
    };

    const req = hitlGatekeeper.createApprovalRequest(originalPatch);

    // Tampered patch with malicious diff
    const tamperedPatch = {
      ...originalPatch,
      patches: [{ filePath: "src/a.ts", originalCode: "a", patchedCode: "MALICIOUS", diffHunk: "--- a\n+++ MALICIOUS", purpose: "exploit" }],
    };

    assert.throws(
      () => hitlGatekeeper.evaluateDecision(req.nonce, "approved", { currentPatch: tamperedPatch }),
      /modified after approval request creation/
    );
  });

  it("should fail closed in DAYTONA_MODE=required when Daytona credentials are missing", async () => {
    const strictManager = new DaytonaSandboxManager({
      mode: "required",
      apiKey: undefined,
      serverUrl: undefined,
    });

    await assert.rejects(
      async () => {
        await strictManager.createWorkspace(process.cwd());
      },
      /Local execution is strictly forbidden in required mode/
    );
  });

  it("should fail closed when attempting to verify a failing command in Triple-Lock", async () => {
    const res = await verifyFix({
      errorId: "err_fail_closed",
      projectPath: process.cwd(),
      testCommand: "node -e \"process.exit(1)\"",
    });

    assert.strictEqual(res.allPassed, false);
    assert.strictEqual(res.lock1_bugFixed, false);
  });

  it("should safely parse malformed, empty, and binary error logs without throwing", () => {
    const emptyReport = ingestError("");
    assert.strictEqual(emptyReport.errorType, "UnknownError");
    assert.ok(emptyReport.id.startsWith("err_"));

    const garbageReport = ingestError("@@@#$%^&*() RANDOM MEMORY DUMP \x00\xFF\xFE");
    assert.strictEqual(garbageReport.errorType, "UnknownError");
    assert.strictEqual(garbageReport.category, "logic_flaw");
  });
});
