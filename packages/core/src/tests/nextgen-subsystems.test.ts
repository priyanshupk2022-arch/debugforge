import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import { TaskMemoryStore } from "../memory/task-memory.js";
import { AutonomousSupervisor } from "../supervisor/supervisor.js";
import { VariationOperator } from "../tools/variation-operator.js";
import { RuntimeProbeManager } from "../probing/runtime-probe.js";
import { CausalProvenanceEngine } from "../causal/provenance.js";
import { ConcurrencyPerturbationEngine } from "../concurrency/schedule-perturbation.js";
import { BenchmarkRunner } from "../bench/bench-runner.js";
import { ingestError } from "../tools/ingest-error.js";

test("▶ DebugForge Next-Gen Subsystems Suite", async (t) => {
  await t.test("TaskMemoryStore: should isolate verified facts and reject stale hypotheses", () => {
    const memory = new TaskMemoryStore();
    const taskId = "test-task-1";

    memory.addVerifiedFact(taskId, "Database connection timeout is 5000ms");
    memory.recordRejectedHypothesis(taskId, "Increase timeout to 60000ms", "config.js", "Did not resolve root cause");
    memory.recordAttempt(taskId, "Added null check", "hash123", "FAIL", "TypeError: still failing");

    const summary = memory.buildPromptContextSummary(taskId);
    assert.ok(summary.includes("Database connection timeout is 5000ms"));
    assert.ok(summary.includes("Increase timeout to 60000ms"));
    assert.ok(summary.includes("Did not resolve root cause"));

    // Verify task isolation
    memory.clearTask(taskId);
    const clearedSummary = memory.buildPromptContextSummary(taskId);
    assert.strictEqual(clearedSummary, "");
  });

  await t.test("AutonomousSupervisor: should detect repeated failures and issue strategy reset", () => {
    const memory = new TaskMemoryStore();
    const supervisor = new AutonomousSupervisor(memory, { maxRepeatedFailures: 3 });
    const taskId = "test-stagnant-task";

    // 1 failure - no intervention
    memory.recordAttempt(taskId, "Edit 1", "h1", "FAIL", "TypeError: Cannot read properties of undefined");
    let res = supervisor.evaluateTrajectory(taskId);
    assert.strictEqual(res.intervened, false);

    // 2 failures - no intervention
    memory.recordAttempt(taskId, "Edit 2", "h2", "FAIL", "TypeError: Cannot read properties of undefined");
    res = supervisor.evaluateTrajectory(taskId);
    assert.strictEqual(res.intervened, false);

    // 3 identical failures -> Trigger STRATEGY_RESET
    memory.recordAttempt(taskId, "Edit 3", "h3", "FAIL", "TypeError: Cannot read properties of undefined");
    res = supervisor.evaluateTrajectory(taskId);
    assert.strictEqual(res.intervened, true);
    assert.strictEqual(res.anomaly?.type, "REPEATED_FAILURE");
    assert.ok(res.directive?.includes("SUPERVISOR INTERVENTION"));
    assert.strictEqual(res.anomaly?.recommendedAction, "STRATEGY_RESET");
  });

  await t.test("AutonomousSupervisor: should detect oscillating patch cycles", () => {
    const memory = new TaskMemoryStore();
    const supervisor = new AutonomousSupervisor(memory);
    const taskId = "test-oscillating-task";

    memory.recordAttempt(taskId, "Variation A", "hash_A", "FAIL", "Error 1");
    memory.recordAttempt(taskId, "Variation B", "hash_B", "FAIL", "Error 2");
    memory.recordAttempt(taskId, "Variation A", "hash_A", "FAIL", "Error 1");
    memory.recordAttempt(taskId, "Variation B", "hash_B", "FAIL", "Error 2");

    const res = supervisor.evaluateTrajectory(taskId);
    assert.strictEqual(res.intervened, true);
    assert.strictEqual(res.anomaly?.type, "OSCILLATING_EDITS");
    assert.strictEqual(res.anomaly?.recommendedAction, "ROLLBACK_CHECKPOINT");
  });

  await t.test("VariationOperator: should apply surgical line mutations and support rollback", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "df-mutation-test-"));
    const filePath = "service.js";
    const fullPath = path.join(tmpDir, filePath);

    const initialCode = `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}`;
    fs.writeFileSync(fullPath, initialCode, "utf-8");

    const operator = new VariationOperator();
    const result = operator.applyMutation(tmpDir, {
      type: "guard_insertion",
      filePath,
      startLine: 2,
      endLine: 2,
      replacementCode: "  if (!Array.isArray(items)) return 0;\n  let total = 0;",
      reason: "Protect against undefined items array",
    });

    assert.strictEqual(result.success, true);
    const mutatedContent = fs.readFileSync(fullPath, "utf-8");
    assert.ok(mutatedContent.includes("if (!Array.isArray(items)) return 0;"));

    // Verify Rollback
    operator.rollbackMutation(tmpDir, result.mutation);
    const restoredContent = fs.readFileSync(fullPath, "utf-8");
    assert.strictEqual(restoredContent, initialCode);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test("RuntimeProbeManager: should inject reversible observation probes and clean up", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "df-probe-test-"));
    const filePath = "handler.js";
    const fullPath = path.join(tmpDir, filePath);

    const code = `function handleRequest(req) {
  const userId = req.body.userId;
  return userId;
}`;
    fs.writeFileSync(fullPath, code, "utf-8");

    const manager = new RuntimeProbeManager();
    const probe = manager.injectProbe(tmpDir, {
      type: "log_variable",
      filePath,
      line: 2,
      expressionToObserve: "req.body",
    });

    assert.strictEqual(probe.active, true);
    const probedContent = fs.readFileSync(fullPath, "utf-8");
    assert.ok(probedContent.includes("DEBUGFORGE_PROBE:"));
    assert.ok(probedContent.includes("DEBUGFORGE_OBSERVATION:req.body"));

    // Clean up
    manager.cleanupAllProbes(tmpDir);
    const cleanContent = fs.readFileSync(fullPath, "utf-8");
    assert.strictEqual(cleanContent, code);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test("CausalProvenanceEngine: should construct provenance graph decoupling crash site and infection origin", () => {
    const errorLog = `TypeError: Cannot read properties of undefined (reading 'email')
    at sendReceipt (src/services/notification-service.js:14:22)
    at processOrder (src/services/order-service.js:25:5)
    at fetchUserRecord (src/services/user-service.js:8:3)
    at main (src/index.js:5:1)`;

    const errorReport = ingestError(errorLog);
    const engine = new CausalProvenanceEngine();
    const graph = engine.analyzeProvenance(errorReport);

    assert.strictEqual(graph.crashSite.filePath, "src/services/notification-service.js");
    assert.strictEqual(graph.crashSite.lineNumber, 14);
    assert.strictEqual(graph.infectionOrigin.filePath, "src/index.js");
    assert.ok(graph.overallConfidence >= 0.75);
  });

  await t.test("ConcurrencyPerturbationEngine: should generate jitter delay wrappers", () => {
    const engine = new ConcurrencyPerturbationEngine({ minDelayMs: 2, maxDelayMs: 10 });
    const wrapper = engine.generatePerturbationWrapper("transferFunds");

    assert.ok(wrapper.includes("__original_transferFunds"));
    assert.ok(wrapper.includes("DEBUGFORGE_PERTURBATION"));
  });

  await t.test("BenchmarkRunner: should execute DebugForge-Bench tasks with verified resolution report", async () => {
    const runner = new BenchmarkRunner();
    const report = await runner.runBenchmark();

    assert.strictEqual(report.totalTasks, 5);
    assert.strictEqual(report.passedTasks, 5);
    assert.strictEqual(report.failedTasks, 0);
    assert.strictEqual(report.verifiedResolutionRate, 1.0);
  });
});
