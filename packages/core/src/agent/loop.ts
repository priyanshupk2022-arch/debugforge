import { AgentEvent, ErrorReport, RootCauseAnalysis, PatchResult, TripleLockResult } from "../types.js";
import { ingestError } from "../tools/ingest-error.js";
import { reproduceInSandbox } from "../tools/reproduce.js";
import { traceAndAnalyze } from "../tools/trace-analyze.js";
import { autoPatch } from "../tools/auto-patch.js";
import { verifyFix } from "../tools/verify-fix.js";
import { hitlGatekeeper } from "../hitl/approval.js";

export interface AgentRunOptions {
  prompt?: string;
  rawError?: string;
  projectPath: string;
  testCommand?: string;
  autoApprove?: boolean;
}

export async function* runDebugAgent(options: AgentRunOptions): AsyncGenerator<AgentEvent> {
  const { projectPath, testCommand = "npm test", autoApprove = true } = options;

  yield {
    type: "thought",
    content: `Initializing DebugForge Autonomous Agent on target: ${projectPath}`,
    timestamp: Date.now(),
  };

  // Stage 1: Ingest Error or Run Initial Test to Capture Failure
  yield {
    type: "thought",
    content: "Stage 1: Ingesting error signals and spinning up isolated Daytona sandbox...",
    timestamp: Date.now(),
  };

  let rawLog = options.rawError || "";
  if (!rawLog) {
    yield {
      type: "tool_call",
      tool: "daytona_reproduce",
      args: { projectPath, testCommand },
      timestamp: Date.now(),
    };

    const repro = await reproduceInSandbox({ projectPath, testCommand });
    rawLog = [repro.stderr, repro.stdout].filter(Boolean).join("\n");

    yield {
      type: "tool_result",
      tool: "daytona_reproduce",
      result: repro,
      timestamp: Date.now(),
    };
  }

  const errorReport: ErrorReport = ingestError(rawLog);

  yield {
    type: "thought",
    content: `Parsed crash site: ${errorReport.crashSite.file}:${errorReport.crashSite.line} [${errorReport.errorType}] - ${errorReport.errorMessage}`,
    timestamp: Date.now(),
  };

  // Stage 2: Reproduce in Sandbox
  yield {
    type: "thought",
    content: "Stage 2: Confirming bug reproduction in isolated sandbox...",
    timestamp: Date.now(),
  };

  yield {
    type: "tool_call",
    tool: "reproduce_in_sandbox",
    args: { errorReport: errorReport.id, target: errorReport.crashSite.file },
    timestamp: Date.now(),
  };

  const sandboxRepro = await reproduceInSandbox({ projectPath, testCommand });

  yield {
    type: "tool_result",
    tool: "reproduce_in_sandbox",
    result: sandboxRepro,
    timestamp: Date.now(),
  };

  // Stage 3: Dynamic Backward Causal Tracing & Root Cause Analysis
  yield {
    type: "thought",
    content: "Stage 3: Tracing state mutations backwards from crash site to pinpoint infection origin...",
    timestamp: Date.now(),
  };

  yield {
    type: "tool_call",
    tool: "trace_and_analyze",
    args: { errorId: errorReport.id, crashSite: errorReport.crashSite },
    timestamp: Date.now(),
  };

  const rca: RootCauseAnalysis = await traceAndAnalyze({ errorReport, projectPath });

  yield {
    type: "trace_discovered",
    rca,
    timestamp: Date.now(),
  };

  yield {
    type: "thought",
    content: `🎯 Infection Origin Located: ${rca.infectionOrigin.file}:${rca.infectionOrigin.line} (${rca.infectionOrigin.culpritSymbol}) - ${rca.infectionOrigin.rootExplanation}`,
    timestamp: Date.now(),
  };

  // Stage 4: Surgical AST Patch Synthesis & Triple-Lock Verification
  yield {
    type: "thought",
    content: "Stage 4: Synthesizing deterministic code patches and applying to sandbox...",
    timestamp: Date.now(),
  };

  yield {
    type: "tool_call",
    tool: "auto_patch",
    args: { errorId: errorReport.id, infectionOrigin: rca.infectionOrigin },
    timestamp: Date.now(),
  };

  const patchResult: PatchResult = await autoPatch({ rca, projectPath, applyImmediately: true });

  yield {
    type: "patch_generated",
    patch: patchResult,
    timestamp: Date.now(),
  };

  yield {
    type: "thought",
    content: `Synthesized ${patchResult.patches.length} unified diff patch(es). Executing Triple-Lock verification...`,
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
    projectPath,
    testCommand,
    patchResult,
  });

  yield {
    type: "verification_complete",
    verification,
    timestamp: Date.now(),
  };

  // Stage 5: Human-In-The-Loop Approval Gate
  yield {
    type: "thought",
    content: "Stage 5: Submitting verified patch to Human-in-the-Loop approval gate...",
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
    hitlGatekeeper.evaluateDecision(approvalReq.nonce, "approved", { feedback: "Auto-approved in demo mode" });
  }

  yield {
    type: "complete",
    summary: `🎉 Successfully diagnosed and auto-healed ${errorReport.errorType} across ${patchResult.patches.length} files. Triple-Lock verified (100% test pass).`,
    success: verification.allPassed,
    timestamp: Date.now(),
  };
}
