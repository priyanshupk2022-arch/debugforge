import chalk from "chalk";
import { PatchResult } from "@debugforge/core";

export function renderDiffView(patchResult: PatchResult): void {
  console.log(chalk.bold.cyan("┌─────────────────────────────────────────────────────────────┐"));
  console.log(chalk.bold.cyan("│                 SURGICAL AST PATCH PREVIEW                  │"));
  console.log(chalk.bold.cyan("└─────────────────────────────────────────────────────────────┘"));

  for (const patch of patchResult.patches) {
    console.log(chalk.bold.underline.white(`\n📄 Target: ${patch.filePath}`));
    console.log(chalk.gray(`   Purpose: ${patch.purpose}\n`));

    const lines = patch.diffHunk.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("+")) {
        console.log(chalk.green(`+ ${line.substring(1)}`));
      } else if (line.startsWith("-")) {
        console.log(chalk.red(`- ${line.substring(1)}`));
      } else if (line.startsWith("@@")) {
        console.log(chalk.cyan(line));
      } else {
        console.log(chalk.gray(`  ${line}`));
      }
    }
  }
  console.log("");
}
