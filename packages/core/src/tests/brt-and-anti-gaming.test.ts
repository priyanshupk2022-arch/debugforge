import { describe, it } from "node:test";
import assert from "node:assert";
import * as path from "path";
import {
  generateReproductionCandidate,
  validateBRTPrePatch,
  validateBRTPostPatch,
} from "../tools/reproduce-test.js";
import {
  captureWorkspaceIntegritySnapshot,
  verifyWorkspaceIntegrity,
  scanForGamingAntiPatterns,
} from "../security/anti-gaming.js";
import { ingestError } from "../tools/ingest-error.js";

describe("DebugForge Bug Reproduction Test (BRT) & Anti-Gaming Sentinel Suite", () => {
  it("should synthesize a deterministic BRT candidate from a null dereference error", () => {
    const rawError = `TypeError: Cannot read properties of undefined (reading 'email')
    at Object.processOrder (src/services/order-service.js:14:22)
    at handleRequest (src/server.js:45:10)`;

    const ingestion = ingestError(rawError);
    const brt = generateReproductionCandidate(ingestion, "/mock/project");

    assert.ok(brt.id.startsWith("brt_"));
    assert.strictEqual(brt.spec.targetErrorType, "null_dereference");
    assert.strictEqual(brt.spec.crashFile, "src/services/order-service.js");
    assert.ok(brt.testScriptCode.includes("[BRT_DEFECT_REPRODUCED]"));
    assert.ok(brt.testScriptCode.includes("TypeError"));
    assert.strictEqual(brt.isMinimized, true);
  });

  it("should synthesize a deterministic concurrency BRT candidate for race conditions", () => {
    const rawError = `Error: Race condition detected in state transaction: account balance corrupted
    at transferFunds (src/account.js:32:15)`;

    const ingestion = ingestError(rawError);
    const brt = generateReproductionCandidate(ingestion, "/mock/project");

    assert.strictEqual(brt.spec.targetErrorType, "race_condition");
    assert.ok(brt.testScriptCode.includes("Promise.all"));
    assert.ok(brt.testScriptCode.includes("[BRT_DEFECT_REPRODUCED]"));
  });

  it("should validate that pre-patch BRT passes only if defect is accurately reproduced", () => {
    const mockCandidate = {
      id: "brt_1",
      spec: {
        targetErrorType: "null_dereference",
        targetErrorMessage: "Cannot read properties of undefined",
        crashFile: "src/index.js",
        invariants: [],
        expectedPostFixBehavior: "",
      },
      testScriptCode: "",
      relativeFilePath: "test.js",
      isMinimized: true,
      generatedAt: "",
    };

    // Case 1: Defect reproduced successfully (Exit code 1 + signature)
    const validExecution = {
      exitCode: 1,
      stdout: "",
      stderr: "[BRT_DEFECT_REPRODUCED]: TypeError: Cannot read properties of undefined",
      durationMs: 120,
    };
    const report1 = validateBRTPrePatch(mockCandidate, validExecution);
    assert.strictEqual(report1.isValid, true);
    assert.strictEqual(report1.matchedSignature, true);

    // Case 2: Process did not crash (Exit code 0 -> FAIL PRE-PATCH GATE)
    const prematurePass = {
      exitCode: 0,
      stdout: "Everything OK",
      stderr: "",
      durationMs: 90,
    };
    const report2 = validateBRTPrePatch(mockCandidate, prematurePass);
    assert.strictEqual(report2.isValid, false);
    assert.ok(report2.failureReason?.includes("NOT reproduced"));

    // Case 3: Process failed with an unrelated error (Signature mismatch)
    const unrelatedFailure = {
      exitCode: 127,
      stdout: "",
      stderr: "sh: command not found: unknown_bin",
      durationMs: 50,
    };
    const report3 = validateBRTPrePatch(mockCandidate, unrelatedFailure);
    assert.strictEqual(report3.isValid, false);
    assert.ok(report3.failureReason?.includes("did not match expected defect signature"));
  });

  it("should validate post-patch BRT passes cleanly on exit code 0", () => {
    const mockCandidate = {
      id: "brt_1",
      spec: {
        targetErrorType: "null_dereference",
        targetErrorMessage: "Cannot read properties of undefined",
        crashFile: "src/index.js",
        invariants: [],
        expectedPostFixBehavior: "",
      },
      testScriptCode: "",
      relativeFilePath: "test.js",
      isMinimized: true,
      generatedAt: "",
    };

    const postPatchPass = {
      exitCode: 0,
      stdout: "[BRT_EXECUTION_PASS]: Bug was not reproduced or fix verified",
      stderr: "",
      durationMs: 80,
    };
    const reportPass = validateBRTPostPatch(mockCandidate, postPatchPass);
    assert.strictEqual(reportPass.isValid, true);
    assert.strictEqual(reportPass.stage, "post-patch");

    const postPatchStillFailing = {
      exitCode: 1,
      stdout: "",
      stderr: "[BRT_DEFECT_REPRODUCED]: TypeError",
      durationMs: 100,
    };
    const reportFail = validateBRTPostPatch(mockCandidate, postPatchStillFailing);
    assert.strictEqual(reportFail.isValid, false);
    assert.ok(reportFail.failureReason?.includes("is still failing"));
  });

  it("should detect anti-gaming cheating patterns in patch diffs", () => {
    // 1. Exception swallowing
    const diffWithSwallowing = `
+ try {
+   doUnsafeOperation();
+ } catch (err) {
+   // ignore
+ }
`;
    const patterns1 = scanForGamingAntiPatterns(diffWithSwallowing);
    assert.ok(patterns1.some((p) => p.includes("Exception Masking")));

    // 2. Test skipping
    const diffWithTestSkip = `
- it("should process order", async () => {
+ it.skip("should process order", async () => {
`;
    const patterns2 = scanForGamingAntiPatterns(diffWithTestSkip);
    assert.ok(patterns2.some((p) => p.includes("Test Neutralization")));

    // 3. Commenting assertions
    const diffWithCommentedAssert = `
- assert.strictEqual(result.status, "ok");
+ // assert.strictEqual(result.status, "ok");
`;
    const patterns3 = scanForGamingAntiPatterns(diffWithCommentedAssert);
    assert.ok(patterns3.some((p) => p.includes("Assertion Weakening")));

    // 4. Hardcoded cheat branch
    const diffWithCheatBranch = `
+ if (input === "special_test_fixture_case") return "expected_test_val";
`;
    const patterns4 = scanForGamingAntiPatterns(diffWithCheatBranch);
    assert.ok(patterns4.some((p) => p.includes("Hardcoded Test Oracle Cheat")));
  });

  it("should capture and verify workspace integrity snapshots against unauthorized mutations", () => {
    const fixtureDir = path.resolve(process.cwd(), "fixtures/null-propagation-api");
    const snapshot = captureWorkspaceIntegritySnapshot(fixtureDir, ["*.js", "*.json"]);

    assert.ok(snapshot.files.size > 0);

    // Audit with no changes -> passes
    const auditClean = verifyWorkspaceIntegrity(fixtureDir, snapshot);
    assert.strictEqual(auditClean.passed, true);
    assert.strictEqual(auditClean.violations.length, 0);

    // Audit with simulated unwhitelisted tamper
    const tamperedSnapshot = {
      timestamp: snapshot.timestamp,
      workspacePath: snapshot.workspacePath,
      files: new Map(snapshot.files),
    };
    // Inject a modified hash for a protected file
    const firstKey = Array.from(tamperedSnapshot.files.keys())[0];
    tamperedSnapshot.files.set(firstKey, "0000000000000000000000000000000000000000000000000000000000000000");

    const auditTampered = verifyWorkspaceIntegrity(fixtureDir, tamperedSnapshot);
    assert.strictEqual(auditTampered.passed, false);
    assert.ok(auditTampered.violations.some((v) => v.includes("modified without authorization")));
  });
});
