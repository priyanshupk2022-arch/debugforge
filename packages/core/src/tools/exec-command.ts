import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ExecOptions {
  command: string;
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function execCommandTool(options: ExecOptions): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execAsync(options.command, {
      cwd: options.cwd || process.cwd(),
      timeout: options.timeoutMs || 30000,
      env: { ...process.env, ...options.env },
    });

    return {
      exitCode: 0,
      stdout: stdout.toString(),
      stderr: stderr.toString(),
    };
  } catch (err: unknown) {
    const error = err as { code?: number; stdout?: string; stderr?: string; message?: string };
    return {
      exitCode: typeof error.code === "number" ? error.code : 1,
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message || "Command failed",
    };
  }
}
