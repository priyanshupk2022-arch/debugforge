import chalk from "chalk";
import { AgentEvent } from "@debugforge/core";

export function renderAgentEvent(event: AgentEvent): void {
  switch (event.type) {
    case "thought":
      console.log(chalk.bold.magenta("🧠 [Agent Thought] ") + chalk.white(event.content));
      break;

    case "tool_call":
      console.log(
        chalk.bold.yellow("⚡ [Tool Call] ") +
          chalk.bold.cyan(event.tool) +
          chalk.gray(` (${JSON.stringify(event.args).substring(0, 80)}...)`)
      );
      break;

    case "tool_result":
      console.log(chalk.bold.green("📥 [Tool Output] ") + chalk.gray("Received execution feedback"));
      break;

    case "trace_discovered":
      console.log("");
      console.log(chalk.bold.red("🎯 [Infection Origin Located]"));
      console.log(chalk.red(`   File: ${event.rca.infectionOrigin.file}:${event.rca.infectionOrigin.line}`));
      console.log(chalk.yellow(`   Root Cause: ${event.rca.infectionOrigin.rootExplanation}`));
      console.log(chalk.gray(`   Remediation: ${event.rca.remediationStrategy}`));
      console.log("");
      break;

    case "patch_generated":
      console.log(chalk.bold.blue("🔧 [Patch Synthesized] ") + chalk.white(event.patch.summary));
      break;

    case "verification_complete":
      console.log("");
      console.log(chalk.bold.green("🔒 [Triple-Lock Verification]"));
      console.log(
        chalk.green(`   Lock 1 (Bug Fixed): ${event.verification.lock1_bugFixed ? "PASSED ✅" : "FAILED ❌"}`)
      );
      console.log(
        chalk.green(`   Lock 2 (No Regressions): ${event.verification.lock2_noRegressions ? "PASSED ✅" : "FAILED ❌"}`)
      );
      console.log(
        chalk.green(`   Lock 3 (Stress Verified): ${event.verification.lock3_stressPassed ? "PASSED ✅" : "FAILED ❌"}`)
      );
      console.log(chalk.cyan(`   Duration: ${event.verification.executionTimeMs}ms`));
      console.log("");
      break;

    case "approval_requested":
      console.log(chalk.bold.yellow("✋ [HITL Gate] ") + chalk.white("Awaiting human sign-off nonce: ") + chalk.gray(event.nonce));
      break;

    case "complete":
      console.log("");
      console.log(chalk.bold.green("==============================================================="));
      console.log(chalk.bold.green(event.summary));
      console.log(chalk.bold.green("==============================================================="));
      console.log("");
      break;
  }
}
