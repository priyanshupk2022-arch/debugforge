import chalk from "chalk";
import { runDiagnoseCommand, DiagnoseCliOptions } from "./diagnose.js";
import { renderHeader } from "../ui/Header.js";

export async function runWatchCommand(options: DiagnoseCliOptions = {}): Promise<void> {
  renderHeader();
  console.log(chalk.bold.cyan("👀 [DebugForge Watch Mode Active]"));
  console.log(chalk.gray(`   Monitoring test runner: ${options.test || "npm test"} on ${options.target || process.cwd()}`));
  console.log(chalk.gray("   Triggering autonomous auto-heal on test failures...\n"));

  await runDiagnoseCommand(undefined, options);
}
