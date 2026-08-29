import { describe, it } from "node:test";
import assert from "node:assert";
import { ingestError } from "../tools/ingest-error.js";
import { trueforgeMCPServer } from "../mcp/server.js";
import { hitlGatekeeper } from "../hitl/approval.js";
import { routeModel } from "../agent/router.js";

describe("DebugForge Core Engine Suite", () => {
  it("should correctly ingest and classify null dereference errors", () => {
    const sampleLog = `TypeError: Cannot read properties of undefined (reading 'id')
    at orderService.processOrder (/app/src/services/order-service.ts:32:20)
    at /app/src/index.ts:15:10`;

    const report = ingestError(sampleLog);
    assert.strictEqual(report.errorType, "TypeError");
    assert.strictEqual(report.category, "null_dereference");
    assert.strictEqual(report.crashSite.line, 32);
    assert.ok(report.crashSite.file.includes("order-service.ts"));
  });

  it("should register TrueForge MCP tools", () => {
    const tools = trueforgeMCPServer.listTools();
    assert.ok(tools.length >= 5);
    const names = tools.map((t: { name: string }) => t.name);
    assert.ok(names.includes("debugforge_ingest_error"));
    assert.ok(names.includes("debugforge_reproduce_in_sandbox"));
    assert.ok(names.includes("debugforge_trace_and_analyze"));
    assert.ok(names.includes("debugforge_auto_patch"));
    assert.ok(names.includes("debugforge_verify_fix"));
  });

  it("should generate and evaluate HITL approval requests", () => {
    const fakePatch = {
      id: "patch_test_123",
      errorId: "err_test_456",
      patches: [],
      summary: "Test patch",
      synthesizedAt: Date.now(),
    };

    const req = hitlGatekeeper.createApprovalRequest(fakePatch);
    assert.ok(req.nonce.length > 0);

    const decision = hitlGatekeeper.evaluateDecision(req.nonce, "approved", { feedback: "Good fix" });
    assert.strictEqual(decision.status, "approved");
    assert.strictEqual(decision.patchId, "patch_test_123");
  });

  it("should route models correctly based on task complexity", () => {
    const rcaConfig = routeModel("rca");
    assert.strictEqual(rcaConfig.modelName, "gpt-4o");

    const triageConfig = routeModel("triage");
    assert.strictEqual(triageConfig.modelName, "o3-mini");
  });
});
