import chalk from "chalk";

export function renderHeader(): void {
  console.log("");
  console.log(chalk.bold.cyan("  ╔═════════════════════════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("  ║") + chalk.bold.white("   🔥 DebugForge v1.0.0 — Autonomous AI Debugging Agent Harness   ") + chalk.bold.cyan("║"));
  console.log(chalk.bold.cyan("  ║") + chalk.gray("   Powered by TrueForge • Daytona Sandboxes • Qodo Code Review   ") + chalk.bold.cyan("║"));
  console.log(chalk.bold.cyan("  ╚═════════════════════════════════════════════════════════════════╝"));
  console.log("");
}
