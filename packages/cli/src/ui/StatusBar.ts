import chalk from "chalk";

export function renderStatusBar(providerLabel = "OpenAI (gpt-4o)", durationMs = 1240): void {
  const line = [
    chalk.bgCyan.black(" DEBUGFORGE "),
    chalk.gray("│"),
    chalk.white("Provider: ") + chalk.cyan(providerLabel),
    chalk.gray("│"),
    chalk.white("Daytona: ") + chalk.green("Isolated Active"),
    chalk.gray("│"),
    chalk.white("TrueForge MCP: ") + chalk.green("5 Tools Online"),
    chalk.gray("│"),
    chalk.white("Latency: ") + chalk.yellow(`${durationMs}ms`),
  ].join(" ");

  console.log(line);
}
