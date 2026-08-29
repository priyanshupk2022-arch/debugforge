import { SandboxExecResult } from "../types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";

const execAsync = promisify(exec);

export interface DaytonaConfig {
  apiKey?: string;
  serverUrl?: string;
  target?: string;
  defaultTimeoutMs?: number;
}

export class DaytonaSandboxManager {
  private config: DaytonaConfig;
  private activeWorkspaces: Map<
    string,
    { targetPath: string; isRealDaytona: boolean; createdAt: number; rawWorkspace?: unknown }
  > = new Map();

  constructor(config: DaytonaConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.DAYTONA_API_KEY,
      serverUrl: config.serverUrl || process.env.DAYTONA_SERVER_URL,
      target: config.target || process.env.DAYTONA_TARGET || "us",
      defaultTimeoutMs: config.defaultTimeoutMs || 30000,
    };
  }

  get isLiveConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.serverUrl);
  }

  async createWorkspace(targetDir: string, image = "node:22-slim"): Promise<{ workspaceId: string; mode: string }> {
    const workspaceId = `daytona_ws_${crypto.randomBytes(6).toString("hex")}`;
    const resolvedPath = path.resolve(targetDir);

    if (this.isLiveConfigured) {
      try {
        // Dynamic import of official @daytona/sdk
        const { Daytona } = await import("@daytona/sdk");
        const daytona = new Daytona({
          apiKey: this.config.apiKey,
          serverUrl: this.config.serverUrl,
          target: this.config.target,
        });

        const workspace = await daytona.create({
          image,
          language: "typescript",
        });

        this.activeWorkspaces.set(workspaceId, {
          targetPath: resolvedPath,
          isRealDaytona: true,
          createdAt: Date.now(),
          rawWorkspace: workspace,
        });

        return { workspaceId, mode: "daytona-cloud-isolated" };
      } catch (err) {
        console.warn(`[Daytona Cloud Warning] Failed to connect to Daytona cloud: ${(err as Error).message}. Falling back to deterministic local adapter.`);
      }
    }

    // Deterministic local sandbox adapter with process boundary
    this.activeWorkspaces.set(workspaceId, {
      targetPath: resolvedPath,
      isRealDaytona: false,
      createdAt: Date.now(),
    });

    return { workspaceId, mode: "local-deterministic-adapter" };
  }

  async executeInWorkspace(
    workspaceId: string,
    command: string,
    options: { timeoutMs?: number; env?: Record<string, string> } = {}
  ): Promise<SandboxExecResult> {
    const ws = this.activeWorkspaces.get(workspaceId);
    const targetDir = ws ? ws.targetPath : process.cwd();
    const timeout = options.timeoutMs || this.config.defaultTimeoutMs || 30000;
    const startTime = Date.now();

    if (ws?.isRealDaytona && ws.rawWorkspace) {
      try {
        const workspace = ws.rawWorkspace as { process: { exec: (cmd: string) => Promise<{ exitCode: number; result: string }> } };
        const response = await workspace.process.exec(command);
        const durationMs = Date.now() - startTime;

        return {
          workspaceId,
          command,
          exitCode: response.exitCode,
          stdout: response.result,
          stderr: response.exitCode !== 0 ? response.result : "",
          durationMs,
          reproduced: response.exitCode !== 0,
          isolatedPath: `daytona://remote-workspace/${workspaceId}`,
        };
      } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        return {
          workspaceId,
          command,
          exitCode: 1,
          stdout: "",
          stderr: (err as Error).message,
          durationMs,
          reproduced: true,
          isolatedPath: `daytona://remote-workspace/${workspaceId}`,
        };
      }
    }

    // Local deterministic sandbox runner
    try {
      await fs.access(targetDir);

      const { stdout, stderr } = await execAsync(command, {
        cwd: targetDir,
        timeout,
        env: {
          ...process.env,
          CI: "true",
          NODE_ENV: "test",
          DEBUGFORGE_SANDBOX: "true",
          DEBUGFORGE_WORKSPACE_ID: workspaceId,
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
        reproduced: false,
        isolatedPath: targetDir,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const error = err as { code?: number; stdout?: string; stderr?: string; message?: string };
      return {
        workspaceId,
        command,
        exitCode: typeof error.code === "number" ? error.code : 1,
        stdout: error.stdout?.toString() || "",
        stderr: error.stderr?.toString() || error.message || "Sandbox execution failed",
        durationMs,
        reproduced: true,
        isolatedPath: targetDir,
      };
    }
  }

  async destroyWorkspace(workspaceId: string): Promise<void> {
    const ws = this.activeWorkspaces.get(workspaceId);
    if (ws?.isRealDaytona && ws.rawWorkspace) {
      try {
        const workspace = ws.rawWorkspace as { remove: () => Promise<void> };
        await workspace.remove();
      } catch (err) {
        console.warn(`[Daytona Teardown] Error destroying remote workspace ${workspaceId}: ${(err as Error).message}`);
      }
    }
    this.activeWorkspaces.delete(workspaceId);
  }
}

export const daytonaSandbox = new DaytonaSandboxManager();
