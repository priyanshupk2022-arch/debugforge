import { SandboxExecResult } from "../types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import crypto from "node:crypto";

const execAsync = promisify(exec);

export class DaytonaSandboxManager {
  private activeWorkspaces: Map<string, { targetPath: string; createdAt: number }> = new Map();

  async createWorkspace(targetDir: string): Promise<string> {
    const workspaceId = `daytona_ws_${crypto.randomBytes(4).toString("hex")}`;
    const resolvedPath = path.resolve(targetDir);
    this.activeWorkspaces.set(workspaceId, {
      targetPath: resolvedPath,
      createdAt: Date.now(),
    });
    return workspaceId;
  }

  async executeInWorkspace(workspaceId: string, command: string): Promise<SandboxExecResult> {
    const ws = this.activeWorkspaces.get(workspaceId);
    const targetDir = ws ? ws.targetPath : process.cwd();
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: targetDir,
        env: {
          ...process.env,
          DAYTONA_SANDBOX: "true",
          DAYTONA_WORKSPACE_ID: workspaceId,
          NODE_ENV: "test",
        },
      });

      return {
        workspaceId,
        command,
        exitCode: 0,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        durationMs: Date.now() - startTime,
        reproduced: false,
        isolatedPath: targetDir,
      };
    } catch (err: unknown) {
      const error = err as { code?: number; stdout?: string; stderr?: string; message?: string };
      return {
        workspaceId,
        command,
        exitCode: typeof error.code === "number" ? error.code : 1,
        stdout: error.stdout?.toString() || "",
        stderr: error.stderr?.toString() || error.message || "Failed",
        durationMs: Date.now() - startTime,
        reproduced: true,
        isolatedPath: targetDir,
      };
    }
  }

  async destroyWorkspace(workspaceId: string): Promise<void> {
    this.activeWorkspaces.delete(workspaceId);
  }
}

export const daytonaSandbox = new DaytonaSandboxManager();
