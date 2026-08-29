import chalk from "chalk";
import { RootCauseAnalysis, CausalStep } from "@debugforge/core";

export function renderTraceView(rca: RootCauseAnalysis): void {
  console.log(chalk.bold.yellow("┌─────────────────────────────────────────────────────────────┐"));
  console.log(chalk.bold.yellow("│            DYNAMIC BACKWARD CAUSAL TRACE GRAPH              │"));
  console.log(chalk.bold.yellow("└─────────────────────────────────────────────────────────────┘"));

  rca.causalChain.forEach((step: CausalStep, idx: number) => {
    const isLast = idx === rca.causalChain.length - 1;
    const prefix = isLast ? "└──" : "├──";
    const marker = step.isInfectionOrigin
      ? chalk.bold.red("[💥 INFECTION ORIGIN]")
      : step.isCrashSite
      ? chalk.bold.yellow("[🚨 CRASH SITE]")
      : chalk.cyan(`[Step ${step.step}]`);

    console.log(` ${prefix} ${marker} ${chalk.bold.white(step.location)}`);
    console.log(`     ${chalk.gray(step.description)}`);
    if (step.stateMutation) {
      console.log(`     ${chalk.magenta("State: " + step.stateMutation)}`);
    }
  });
  console.log("");
}
