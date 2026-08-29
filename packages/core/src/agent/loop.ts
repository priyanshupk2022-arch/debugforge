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
import { autoPatch } from "../tools/auto-patch.js";
import { verifyFix } from "../tools/verify-fix.js";
import { hitlGatekeeper } from "../hitl/approval.js";
import path from "node:path";

export async function* runDebugAgent(options: AgentOptions): AsyncGenerator<AgentEvent> {
  const {
    rawError,
    projectPath = process.cwd(),
    testCommand = "npm test",
    autoApprove = false,
  } = options;

  const resolvedTarget = path.resolve(projectPath);
  const configuredModel = process.env.OPENAI_MODEL || "gpt-4o";

  // Event 1: Start ReAct loop
  yield {
    type: "thought",
    content: `[MODEL ACTION] Initializing DebugForge Autonomous Agent on target: ${path.basename(resolvedTarget)} using model: ${configuredModel}`,
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

  // Stage 2: Dynamic Backward Causal RCA
  yield {
    type: "thought",
    content: "[RCA] Stage 2: Tracing dynamic state mutations backwards to isolate Infection Origin from Crash Site...",
    timestamp: Date.now(),
  };

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
    content: `[RCA] 🎯 Infection Origin Isolated: ${rca.infectionOrigin.file}:${rca.infectionOrigin.line} (${rca.infectionOrigin.culpritSymbol}) - ${rca.infectionOrigin.rootExplanation}`,
    timestamp: Date.now(),
  };

  // Stage 3: Surgical Patch Synthesis
  yield {
    type: "thought",
    content: "[PATCH] Stage 3: Synthesizing minimal surgical AST diffs targeting root cause...",
    timestamp: Date.now(),
  };

  yield {
    type: "tool_call",
    tool: "auto_patch",
    args: { errorId: errorReport.id, infectionOrigin: rca.infectionOrigin },
    timestamp: Date.now(),
  };

  const patchResult: PatchResult = await autoPatch({
    rca,
    projectPath: resolvedTarget,
  });

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
    type: "thought",
    content: `[VERIFY] Stage 4: Executing independent Triple-Lock verification gates across sandbox...`,
    timestamp: Date.now(),
  };

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

  // Fail-Closed Check: If Triple-Lock failed, abort workflow
  if (!verification.allPassed) {
    yield {
      type: "complete",
      summary: `❌ Verification Gate Failed: Fix did not pass all Triple-Lock checks. Halting without merging.`,
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

  const approvalReq = hitlGatekeeper.createApprovalRequest(patchResult);

  yield {
    type: "approval_requested",
    patch: patchResult,
    nonce: approvalReq.nonce,
    timestamp: Date.now(),
  };

  if (autoApprove) {
    hitlGatekeeper.evaluateDecision(approvalReq.nonce, "approved", {
      feedback: "Auto-approved in demo/eval mode",
      operator: "demo_runner",
      currentPatch: patchResult,
    });
  }

  yield {
    type: "complete",
    summary: `🎉 Successfully diagnosed and auto-healed ${errorReport.errorType} across ${patchResult.patches.length} files. Triple-Lock verified (100% test pass).`,
    success: verification.allPassed,
    timestamp: Date.now(),
  };
}
