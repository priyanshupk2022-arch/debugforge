import { runDiagnoseCommand, DiagnoseCliOptions } from "./diagnose.js";

export async function runAgentCommand(goalPrompt: string, options: DiagnoseCliOptions = {}): Promise<void> {
  console.log(`\n🎯 [Goal Received]: "${goalPrompt}"`);
  await runDiagnoseCommand(undefined, {
    ...options,
    prompt: goalPrompt,
  });
}
