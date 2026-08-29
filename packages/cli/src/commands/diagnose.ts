import { runDebugAgent, RootCauseAnalysis, PatchResult } from "@debugforge/core";
import { renderHeader } from "../ui/Header.js";
import { renderAgentEvent } from "../ui/StreamView.js";
import { renderDiffView } from "../ui/DiffView.js";
import { renderTraceView } from "../ui/TraceView.js";
import { renderStatusBar } from "../ui/StatusBar.js";

export interface DiagnoseCliOptions {
  target?: string;
  test?: string;
  autoApprove?: boolean;
}

export async function runDiagnoseCommand(errorText?: string, options: DiagnoseCliOptions = {}): Promise<void> {
  renderHeader();

  const targetPath = options.target || process.cwd();
  const testCommand = options.test || "npm test";
  const startTime = Date.now();

  let capturedRca: RootCauseAnalysis | null = null;
  let capturedPatch: PatchResult | null = null;

  for await (const event of runDebugAgent({
    rawError: errorText,
    projectPath: targetPath,
    testCommand,
    autoApprove: options.autoApprove !== false,
  })) {
    renderAgentEvent(event);

    if (event.type === "trace_discovered") {
      capturedRca = event.rca;
    } else if (event.type === "patch_generated") {
      capturedPatch = event.patch;
    }
  }

  if (capturedRca) {
    renderTraceView(capturedRca);
  }

  if (capturedPatch) {
    renderDiffView(capturedPatch);
  }

  const durationMs = Date.now() - startTime;
  renderStatusBar("gpt-4o", durationMs);
}
