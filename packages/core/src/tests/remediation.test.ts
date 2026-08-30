import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import { ingestError } from "../tools/ingest-error.js";
import { traceAndAnalyze } from "../tools/trace-analyze.js";
import { classifyOracleConfidence, generateReproductionCandidate } from "../tools/reproduce-test.js";
import { blastRadiusAnalyzer } from "../tools/blast-radius.js";
import { targetedMutationVerifier } from "../tools/mutation-verifier.js";
import { TaskMemoryStore } from "../memory/task-memory.js";
import { AutonomousSupervisor } from "../supervisor/supervisor.js";
import { benchmarkRunner } from "../bench/bench-runner.js";

test("▶ DebugForge Forensic Gap Remediation & High-Assurance Suite", async (t) => {
  await t.test("REQ-06: Dynamic Causal Provenance on Unseen Arbitrary Stack Traces", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "df-rca-test-"));
    const srcDir = path.join(tmpDir, "src", "analytics");
    fs.mkdirSync(srcDir, { recursive: true });

    const sourceFile = path.join(srcDir, "calculator.js");
    fs.writeFileSync(
      sourceFile,
      `export function calculateMetrics(data) {\n  const rate = data.metrics.conversionRate;\n  return rate * 100;\n}\n`
    );

    const novelErrorLog = `TypeError: Cannot read properties of undefined (reading 'conversionRate')
    at calculateMetrics (${sourceFile.replace(/\\/g, "/")}:2:29)
    at runPipeline (${tmpDir.replace(/\\/g, "/")}/src/pipeline.js:12:5)`;

    const errorReport = ingestError(novelErrorLog);
    assert.strictEqual(errorReport.category, "null_dereference");
    assert.strictEqual(errorReport.errorType, "TypeError");

    const rca = await traceAndAnalyze({
      errorReport,
      projectPath: tmpDir,
    });

    assert.ok(rca.crashSite.file.includes("calculator.js"));
    assert.strictEqual(rca.crashSite.line, 2);
    assert.ok(rca.infectionOrigin.file.includes("pipeline.js"));
    assert.strictEqual(rca.infectionOrigin.line, 12);
    assert.ok(rca.causalChain.length >= 2);
    assert.ok(rca.confidence >= 0.75);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test("REQ-05: Oracle Confidence States (PROVEN, INFERRED, AMBIGUOUS with HITL Escalation)", () => {
    const err = ingestError("TypeError: Cannot read property 'id' of undefined\n    at getUser (src/user.js:5:10)");
    const candidate = generateReproductionCandidate(err, "workspace");

    // Case 1: Deterministic Tag -> PROVEN
    const provenOracle = classifyOracleConfidence(
      candidate,
      { exitCode: 1, stderr: "[BRT_DEFECT_REPRODUCED]: TypeError occurred" },
      { exitCode: 0, stdout: "[BRT_EXECUTION_PASS]" }
    );
    assert.strictEqual(provenOracle.state, "PROVEN");
    assert.strictEqual(provenOracle.requiresHumanEscalation, false);

    // Case 2: Clean execution without explicit tag -> INFERRED
    const inferredOracle = classifyOracleConfidence(
      candidate,
      { exitCode: 1, stderr: "TypeError: Cannot read property 'id' of undefined" },
      { exitCode: 0, stdout: "all tests passed" }
    );
    assert.strictEqual(inferredOracle.state, "INFERRED");
    assert.strictEqual(inferredOracle.requiresHumanEscalation, false);

    // Case 3: Flaky or contradictory test -> AMBIGUOUS (Escalate to HITL)
    const ambiguousOracle = classifyOracleConfidence(
      candidate,
      { exitCode: 1, stderr: "TypeError" },
      { exitCode: 0, stdout: "passed" },
      { isFlaky: true }
    );
    assert.strictEqual(ambiguousOracle.state, "AMBIGUOUS");
    assert.strictEqual(ambiguousOracle.requiresHumanEscalation, true);
    assert.ok(ambiguousOracle.rationale.includes("non-deterministic"));
  });

  await t.test("REQ-09: Dependency-Aware Blast Radius Analysis", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "df-blast-test-"));
    const srcDir = path.join(tmpDir, "src");
    const testDir = path.join(tmpDir, "test");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });

    // Target file with exported function
    fs.writeFileSync(
      path.join(srcDir, "auth.js"),
      `export function verifyToken(token) {\n  return token === "valid";\n}\nexport function refreshToken() {}\n`
    );

    // Caller 1
    fs.writeFileSync(
      path.join(srcDir, "middleware.js"),
      `import { verifyToken } from "./auth.js";\nexport function authMiddleware(req) { return verifyToken(req.token); }\n`
    );

    // Caller 2
    fs.writeFileSync(
      path.join(srcDir, "admin.js"),
      `import { verifyToken } from "./auth.js";\nexport function isAdmin(t) { return verifyToken(t); }\n`
    );

    // Dependent test
    fs.writeFileSync(
      path.join(testDir, "auth.test.js"),
      `import { verifyToken } from "../src/auth.js";\n// test auth\n`
    );

    const blast = blastRadiusAnalyzer.analyzeBlastRadius({
      projectPath: tmpDir,
      targetFile: "src/auth.js",
    });

    assert.strictEqual(blast.targetFile, "src/auth.js");
    assert.ok(blast.exportedSymbols.includes("verifyToken"));
    assert.ok(blast.exportedSymbols.includes("refreshToken"));
    assert.ok(blast.directCallerFiles.some(f => f.includes("middleware.js")));
    assert.ok(blast.directCallerFiles.some(f => f.includes("admin.js")));
    assert.ok(blast.dependentTestFiles.some(f => f.includes("auth.test.js")));
    assert.strictEqual(blast.widenVerificationRequired, true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test("REQ-11: Targeted Local Mutation Verifier (AST Mutant Generation & Kill Rate)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "df-mut-test-"));
    const srcDir = path.join(tmpDir, "src");
    const testDir = path.join(tmpDir, "test");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });

    fs.writeFileSync(
      path.join(srcDir, "math.js"),
      `export function isPositive(n) {\n  return n > 0;\n}\n`
    );

    fs.writeFileSync(
      path.join(testDir, "math.test.js"),
      `import assert from "node:assert";\nimport { isPositive } from "../src/math.js";\nassert.strictEqual(isPositive(5), true);\nassert.strictEqual(isPositive(-3), false);\n`
    );

    const mutResult = await targetedMutationVerifier.verifyCandidateMutations({
      projectPath: tmpDir,
      filePath: "src/math.js",
      startLine: 1,
      endLine: 3,
      testCommand: "node test/math.test.js",
      maxMutants: 2,
    });

    assert.ok(mutResult.totalMutants > 0);
    assert.ok(mutResult.killedMutants > 0);
    assert.strictEqual(mutResult.passed, true);
    assert.ok(mutResult.mutationScore >= 0.5);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test("REQ-02: Autonomous Supervisor Trajectory Governance & Invalidation", () => {
    const memory = new TaskMemoryStore();
    const supervisor = new AutonomousSupervisor(memory, { maxRepeatedFailures: 3 });
    const taskId = "task_governance_test";

    // Simulate 3 repeated failed attempts with same error signature
    memory.recordAttempt(taskId, "Patch attempt 1", "hash_1", "FAIL", "AssertionError: Invariant failed");
    memory.recordAttempt(taskId, "Patch attempt 2", "hash_2", "FAIL", "AssertionError: Invariant failed");
    memory.recordAttempt(taskId, "Patch attempt 3", "hash_3", "FAIL", "AssertionError: Invariant failed");

    const decision = supervisor.evaluateTrajectory(taskId);
    assert.strictEqual(decision.intervened, true);
    assert.strictEqual(decision.anomaly?.type, "REPEATED_FAILURE");
    assert.strictEqual(decision.anomaly?.recommendedAction, "STRATEGY_RESET");

    // Invalidate hypothesis and record rollback
    memory.recordRejectedHypothesis(taskId, "Wrap in sync check", "src/auth.js", "Stagnant failure across 3 attempts");
    memory.recordRollback(taskId);

    const context = memory.buildPromptContextSummary(taskId);
    assert.ok(context.toLowerCase().includes("rejected hypotheses"));
    assert.ok(context.includes("Wrap in sync check"));
  });

  await t.test("REQ-17: DebugForge-Bench Real Isolated Workspace Execution", async () => {
    const report = await benchmarkRunner.runBenchmark();

    assert.strictEqual(report.totalTasks, 5);
    assert.strictEqual(report.passedTasks, 5);
    assert.strictEqual(report.failedTasks, 0);
    assert.strictEqual(report.verifiedResolutionRate, 1.0);
    assert.strictEqual(report.executionMode, "BENCH_LOCAL");

    for (const res of report.taskResults) {
      assert.strictEqual(res.reproductionSucceeded, true);
      assert.strictEqual(res.brtGenerated, true);
      assert.strictEqual(res.brtPrePatchValidated, true);
      assert.strictEqual(res.infectionOriginIdentified, true);
      assert.strictEqual(res.patchSynthesized, true);
      assert.strictEqual(res.patchVerified, true);
      assert.strictEqual(res.status, "PASS");
    }
  });
});
