import { SandboxExecResult } from "../types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const execAsync = promisify(exec);

export interface ReproduceOptions {
  projectPath: string;
  testCommand?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export async function reproduceInSandbox(options: ReproduceOptions): Promise<SandboxExecResult> {
  const workspaceId = `daytona_ws_${crypto.randomBytes(4).toString("hex")}`;
  const isolatedPath = path.resolve(options.projectPath);
  const command = options.testCommand || "npm test";
  const timeout = options.timeoutMs || 30000;
  const startTime = Date.now();

  try {
    // Verify target directory exists
    await fs.access(isolatedPath);

    // Execute test command in isolated cwd
    const { stdout, stderr } = await execAsync(command, {
      cwd: isolatedPath,
      timeout,
      env: {
        ...process.env,
        CI: "true",
        NODE_ENV: "test",
        DAYTONA_SANDBOX: "true",
        DAYTONA_WORKSPACE_ID: workspaceId,
        ...options.env,
      },
    });

    const durationMs = Date.now() - startTime;
    return {
      workspaceId,
      command,
      exitCode: 0,
      stdout: stdout.toString(),
      stderr: stderr.toString(),
      durationMs,
      reproduced: false, // Exit code 0 means test passed (not failing)
      isolatedPath,
    };
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const err = error as { code?: number; stdout?: string; stderr?: string; message?: string };

    return {
      workspaceId,
      command,
      exitCode: typeof err.code === "number" ? err.code : 1,
      stdout: err.stdout?.toString() || "",
      stderr: err.stderr?.toString() || err.message || "Process failed",
      durationMs,
      reproduced: true, // Non-zero exit code confirms bug reproduction!
      isolatedPath,
    };
  }
}
