import {
  AgentEvent,
  AgentOptions,
  ErrorReport,
  RootCauseAnalysis,
  PatchResult,
  TripleLockResult,
} from "../types.js";
import { ingestError } from "../tools/ingest-error.js";
import { reproduceInSandbox } from "../tools/reproduce.js";
import { traceAndAnalyze } from "../tools/trace-analyze.js";
import { autoPatch, applyPatch } from "../tools/auto-patch.js";
import { verifyFix } from "../tools/verify-fix.js";
import { hitlGatekeeper } from "../hitl/approval.js";
import { resolveModelProviderConfig, formatProviderLabel } from "./provider.js";
import { taskMemory } from "../memory/task-memory.js";
import { autonomousSupervisor } from "../supervisor/supervisor.js";
import { blastRadiusAnalyzer } from "../tools/blast-radius.js";
import path from "node:path";
import crypto from "node:crypto";

export async function* runDebugAgent(options: AgentOptions): AsyncGenerator<AgentEvent> {
  const {
    rawError,
    projectPath = process.cwd(),
    testCommand = "npm test",
    autoApprove = false,
    maxAttempts = 3,
  } = options;

  const resolvedTarget = path.resolve(projectPath);
  const taskId = `task_${crypto.randomBytes(4).toString("hex")}`;
  taskMemory.getOrCreateTask(taskId);

  const providerConfig = resolveModelProviderConfig();
  const providerLabel = formatProviderLabel(providerConfig);

  // Event 1: Start ReAct loop
  yield {
    type: "thought",
    content: `[MODEL ACTION] Initializing DebugForge Autonomous Agent on target: ${path.basename(resolvedTarget)} using ${providerLabel}`,
    timestamp: Date.now(),
  };

  // Stage 1: Ingestion & Sandbox Reproduction
  yield {
    type: "thought",
    content: "[SANDBOX] Stage 1: Ingesting error signals and provisioning isolated execution workspace...",
    timestamp: Date.now(),
  };

  const initialExec = await reproduceInSandbox({
    projectPath: resolvedTarget,
    testCommand,
  });

  yield {
    type: "tool_call",
    tool: "daytona_reproduce",
    args: { projectPath: resolvedTarget, testCommand },
    timestamp: Date.now(),
  };

  yield {
    type: "tool_result",
    tool: "daytona_reproduce",
    result: initialExec,
    timestamp: Date.now(),
  };

  const combinedError = rawError || initialExec.stderr || initialExec.stdout;
  const errorReport: ErrorReport = ingestError(combinedError);
  taskMemory.addVerifiedFact(taskId, `Crash site: ${errorReport.crashSite.file}:${errorReport.crashSite.line} [${errorReport.errorType}]`);

  yield {
    type: "thought",
    content: `[OBSERVATION] Detected crash site: ${errorReport.crashSite.file}:${errorReport.crashSite.line} [${errorReport.errorType}] - ${errorReport.errorMessage}`,
    timestamp: Date.now(),
  };

  // Fail-Closed Check: If there was no crash and no error, stop
  if (!initialExec.reproduced && !rawError) {
    yield {
      type: "complete",
      summary: "No reproducible crash or error detected in sandbox. Halting to prevent unnecessary mutations.",
      success: true,
      timestamp: Date.now(),
    };
    return;
  }

  // Trajectory Multi-Attempt Loop with Supervisor Governance
  let verifiedPatchResult: PatchResult | null = null;
  let verifiedLockResult: TripleLockResult | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    yield {
      type: "thought",
      content: `[TRAJECTORY] Attempt #${attempt}/${maxAttempts}: Synthesizing diagnostic hypothesis and patch candidate...`,
      timestamp: Date.now(),
    };

    // Stage 2: Dynamic Backward Causal RCA
    yield {
      type: "tool_call",
      tool: "trace_and_analyze",
      args: { errorId: errorReport.id, crashSite: errorReport.crashSite },
      timestamp: Date.now(),
    };

    const rca: RootCauseAnalysis = await traceAndAnalyze({
      errorReport,
      projectPath: resolvedTarget,
    });

    yield {
      type: "tool_result",
      tool: "trace_and_analyze",
      result: rca,
      timestamp: Date.now(),
    };

    yield {
      type: "trace_discovered",
      rca,
      timestamp: Date.now(),
    };

    yield {
      type: "thought",
      content: `[RCA] 🎯 Infection Origin Isolated: ${rca.infectionOrigin.file}:${rca.infectionOrigin.line} (${rca.infectionOrigin.culpritSymbol}) [Oracle: ${rca.oracleState || "INFERRED"}]`,
      timestamp: Date.now(),
    };

    // Stage 3: Surgical Patch Synthesis & Blast Radius Analysis
    yield {
      type: "tool_call",
      tool: "auto_patch",
      args: { errorId: errorReport.id, infectionOrigin: rca.infectionOrigin },
      timestamp: Date.now(),
    };

    const patchResult: PatchResult = await autoPatch({
      rca,
      projectPath: resolvedTarget,
      applyImmediately: true,
    });

    // Compute Blast Radius
    if (patchResult.patches.length > 0) {
      patchResult.blastRadius = blastRadiusAnalyzer.analyzeBlastRadius({
        projectPath: resolvedTarget,
        targetFile: patchResult.patches[0].filePath,
      });
    }

    yield {
      type: "tool_result",
      tool: "auto_patch",
      result: patchResult,
      timestamp: Date.now(),
    };

    yield {
      type: "patch_generated",
      patch: patchResult,
      timestamp: Date.now(),
    };

    // Stage 4: Independent Triple-Lock Verification
    yield {
      type: "tool_call",
      tool: "verify_fix",
      args: { patchId: patchResult.id, testCommand },
      timestamp: Date.now(),
    };

    const verification: TripleLockResult = await verifyFix({
      errorId: errorReport.id,
      projectPath: resolvedTarget,
      testCommand,
      patchResult,
      runMutationCheck: true,
    });

    yield {
      type: "tool_result",
      tool: "verify_fix",
      result: verification,
      timestamp: Date.now(),
    };

    yield {
      type: "verification_complete",
      verification,
      timestamp: Date.now(),
    };

    const patchHash = crypto
      .createHash("sha256")
      .update(patchResult.patches.map((p) => p.diffHunk).join(""))
      .digest("hex");

    taskMemory.recordAttempt(
      taskId,
      patchResult.summary,
      patchHash,
      verification.allPassed ? "PASS" : "FAIL",
      verification.diagnostics
    );

    if (verification.allPassed) {
      verifiedPatchResult = patchResult;
      verifiedLockResult = verification;
      break;
    }

    // Trajectory Anomaly & Supervisor Evaluation
    const supervisorDecision = autonomousSupervisor.evaluateTrajectory(taskId);
    if (supervisorDecision.intervened && supervisorDecision.anomaly) {
      yield {
        type: "supervisor_intervention",
        anomaly: supervisorDecision.anomaly,
        directive: supervisorDecision.directive || "Trajectory reset ordered by supervisor.",
        timestamp: Date.now(),
      };

      taskMemory.recordRejectedHypothesis(
        taskId,
        rca.infectionOrigin.rootExplanation,
        rca.infectionOrigin.file,
        supervisorDecision.anomaly.details
      );
      taskMemory.recordRollback(taskId);
    }
  }

  // Fail-Closed Check: If Triple-Lock failed across all attempts, abort workflow
  if (!verifiedLockResult || !verifiedLockResult.allPassed || !verifiedPatchResult) {
    yield {
      type: "complete",
      summary: `❌ Verification Gate Failed: Fix did not pass all Triple-Lock checks across attempts. Halting without merging.`,
      success: false,
      timestamp: Date.now(),
    };
    return;
  }

  // Stage 5: Cryptographic HITL Gatekeeper
  yield {
    type: "thought",
    content: "[APPROVAL] Stage 5: Staging verified patch at Human-in-the-Loop approval checkpoint...",
    timestamp: Date.now(),
  };

  const approvalReq = hitlGatekeeper.createApprovalRequest(verifiedPatchResult);

  yield {
    type: "approval_requested",
    patch: verifiedPatchResult,
    nonce: approvalReq.nonce,
    timestamp: Date.now(),
  };

  if (autoApprove) {
    hitlGatekeeper.evaluateDecision(approvalReq.nonce, "approved", {
      feedback: "Auto-approved in demo/eval mode",
      operator: "demo_runner",
      currentPatch: verifiedPatchResult,
    });
  }

  yield {
    type: "complete",
    summary: `🎉 Successfully diagnosed and auto-healed ${errorReport.errorType} across ${verifiedPatchResult.patches.length} files. Triple-Lock verified (100% test pass).`,
    success: verifiedLockResult.allPassed,
    timestamp: Date.now(),
  };
}
