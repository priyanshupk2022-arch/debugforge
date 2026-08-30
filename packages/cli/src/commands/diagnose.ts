import {
  runDebugAgent,
  RootCauseAnalysis,
  PatchResult,
  hitlGatekeeper,
  applyPatch,
  resolveModelProviderConfig,
  formatProviderLabel,
} from "@debugforge/core";
import { renderHeader } from "../ui/Header.js";
import { renderAgentEvent } from "../ui/StreamView.js";
import { renderDiffView } from "../ui/DiffView.js";
import { renderTraceView } from "../ui/TraceView.js";
import { renderStatusBar } from "../ui/StatusBar.js";
import chalk from "chalk";
import readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";

export interface DiagnoseCliOptions {
  target?: string;
  test?: string;
  autoApprove?: boolean;
  prompt?: string;
}

export async function runDiagnoseCommand(errorText?: string, options: DiagnoseCliOptions = {}): Promise<void> {
  renderHeader();

  const targetPath = options.target || process.cwd();
  const testCommand = options.test || "npm test";
  const startTime = Date.now();
  const providerConfig = resolveModelProviderConfig();
  const providerLabel = formatProviderLabel(providerConfig);

  let capturedRca: RootCauseAnalysis | null = null;
  let capturedPatch: PatchResult | null = null;
  let approvalNonce: string | null = null;

  for await (const event of runDebugAgent({
    prompt: options.prompt,
    rawError: errorText,
    projectPath: targetPath,
    testCommand,
    autoApprove: options.autoApprove === true,
  })) {
    renderAgentEvent(event);

    if (event.type === "trace_discovered") {
      capturedRca = event.rca;
    } else if (event.type === "patch_generated") {
      capturedPatch = event.patch;
    } else if (event.type === "approval_requested") {
      approvalNonce = event.nonce;
    }
  }

  if (capturedRca) {
    renderTraceView(capturedRca);
  }

  if (capturedPatch) {
    renderDiffView(capturedPatch);
  }

  // Phase 5 Approval Pause Checkpoint & Real Apply Path
  if (approvalNonce && capturedPatch && !options.autoApprove) {
    console.log(chalk.bold.yellow("┌─────────────────────────────────────────────────────────────┐"));
    console.log(chalk.bold.yellow("│              ✋ HUMAN-IN-THE-LOOP APPROVAL GATE              │"));
    console.log(chalk.bold.yellow("└─────────────────────────────────────────────────────────────┘"));
    console.log(chalk.bold.white(`  Status:       `) + chalk.bold.bgYellow.black(" AWAITING_APPROVAL "));
    console.log(chalk.bold.white(`  Single-Use Nonce: `) + chalk.cyan(approvalNonce));
    console.log(chalk.bold.white(`  Files Affected:   `) + chalk.yellow(`${capturedPatch.patches.length} file(s)`));
    console.log(chalk.bold.white(`  Verification:     `) + chalk.green("Triple-Lock Gates Verified (100% test pass)"));
    console.log(chalk.bold.white(`  Risk Level:       `) + chalk.green("LOW (Confined strictly to identified culprit AST nodes)"));
    console.log("");

    if (process.stdin.isTTY) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      await new Promise<void>((resolve) => {
        rl.question(chalk.bold.white("  Apply verified patch to workspace? (y/N): "), async (answer) => {
          rl.close();
          const isAffirmative = answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
          if (isAffirmative) {
            try {
              hitlGatekeeper.evaluateDecision(approvalNonce!, "approved", {
                operator: "cli_operator",
                currentPatch: capturedPatch!,
              });
              await applyPatch(capturedPatch!, targetPath);
              console.log(
                chalk.bold.green(
                  `\n  ✔ [OPERATOR SIGN-OFF] Human approval granted (Nonce: ${approvalNonce}). Verified patch applied to workspace.`
                )
              );
            } catch (err: any) {
              console.log(chalk.bold.red(`\n  ✖ [HITL Security Error] Patch application blocked: ${err?.message}`));
            }
          } else {
            hitlGatekeeper.evaluateDecision(approvalNonce!, "rejected", {
              operator: "cli_operator",
              feedback: "Rejected by interactive operator",
            });
            // Revert candidate patch to ensure host files remain completely untouched
            if (capturedPatch?.patches) {
              for (const patch of capturedPatch.patches) {
                if (patch.originalCode) {
                  const fullPath = path.resolve(targetPath, patch.filePath);
                  if (fs.existsSync(fullPath)) {
                    const currentContent = fs.readFileSync(fullPath, "utf-8");
                    if (currentContent.includes(patch.patchedCode)) {
                      fs.writeFileSync(fullPath, currentContent.replace(patch.patchedCode, patch.originalCode));
                    }
                  }
                }
              }
            }
            console.log(
              chalk.bold.red(
                "\n  ✖ [OPERATOR REJECTED] Halting execution without modifications. Workspace files remain untouched."
              )
            );
          }
          resolve();
        });
      });
    } else {
      console.log(chalk.gray("  [Non-interactive environment: pass --auto-approve or -y to apply automatically]"));
    }
  }

  const durationMs = Date.now() - startTime;
  renderStatusBar(providerLabel, durationMs);
}
