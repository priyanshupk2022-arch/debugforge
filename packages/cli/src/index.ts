#!/usr/bin/env node
import { Command } from "commander";
import { runDiagnoseCommand } from "./commands/diagnose.js";
import { runWatchCommand } from "./commands/watch.js";
import { runAgentCommand } from "./commands/agent.js";

const program = new Command();

program
  .name("debugforge")
  .description("DebugForge: Autonomous AI Debugging Agent Harness — Reproduce, Diagnose & Auto-Heal in Sandboxes")
  .version("1.0.0");

program
  .command("diagnose [error]")
  .description("Autonomously diagnose and fix runtime errors or failing test suites")
  .option("-t, --target <path>", "Target project directory", process.cwd())
  .option("--test <command>", "Test execution command", "npm test")
  .option("--no-auto-approve", "Require interactive human sign-off")
  .action(async (error, options) => {
    await runDiagnoseCommand(error, options);
  });

program
  .command("watch")
  .description("Continuous background test monitoring and auto-healing harness")
  .option("-t, --target <path>", "Target project directory", process.cwd())
  .option("--test <command>", "Test execution command", "npm test")
  .action(async (options) => {
    await runWatchCommand(options);
  });

program
  .command("agent <prompt>")
  .description("Conversational autonomous debugging agent for complex bugs")
  .option("-t, --target <path>", "Target project directory", process.cwd())
  .option("--test <command>", "Test execution command", "npm test")
  .action(async (prompt, options) => {
    await runAgentCommand(prompt, options);
  });

program.parse(process.argv);
