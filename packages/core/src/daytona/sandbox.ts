import { SandboxExecResult } from "../types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";

const execAsync = promisify(exec);

export type DaytonaMode = "required" | "optional" | "local";

export interface DaytonaConfig {
  apiKey?: string;
  serverUrl?: string;
  target?: string;
  defaultTimeoutMs?: number;
  mode?: DaytonaMode;
}

export class DaytonaSandboxManager {
  private config: DaytonaConfig;
  private activeWorkspaces: Map<
    string,
    { targetPath: string; isRealDaytona: boolean; createdAt: number; rawSandbox?: unknown }
  > = new Map();

  constructor(config: DaytonaConfig = {}) {
    const rawMode = (config.mode || process.env.DAYTONA_MODE || (process.env.NODE_ENV === "production" ? "required" : "optional")) as DaytonaMode;
    this.config = {
      apiKey: config.apiKey || process.env.DAYTONA_API_KEY,
      serverUrl: config.serverUrl || process.env.DAYTONA_SERVER_URL,
      target: config.target || process.env.DAYTONA_TARGET || "us",
      defaultTimeoutMs: config.defaultTimeoutMs || 30000,
      mode: rawMode,
    };
  }

  get mode(): DaytonaMode {
    return this.config.mode || "optional";
  }

  get isLiveConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.serverUrl);
  }

  async createWorkspace(targetDir: string, image = "node:22-slim"): Promise<{ workspaceId: string; mode: "REAL_DAYTONA" | "LOCAL_DETERMINISTIC_ADAPTER" }> {
    const workspaceId = `daytona_ws_${crypto.randomBytes(6).toString("hex")}`;
    const resolvedPath = path.resolve(targetDir);

    if (this.mode === "local") {
      this.activeWorkspaces.set(workspaceId, {
        targetPath: resolvedPath,
        isRealDaytona: false,
        createdAt: Date.now(),
      });
      return { workspaceId, mode: "LOCAL_DETERMINISTIC_ADAPTER" };
    }

    if (this.isLiveConfigured) {
      try {
        const { Daytona } = await import("@daytona/sdk");
        const daytona = new Daytona({
          apiKey: this.config.apiKey,
          serverUrl: this.config.serverUrl,
          target: this.config.target,
        });

        const sandbox = await daytona.create({
          image,
        });

        this.activeWorkspaces.set(workspaceId, {
          targetPath: resolvedPath,
          isRealDaytona: true,
          createdAt: Date.now(),
          rawSandbox: sandbox,
        });

        return { workspaceId, mode: "REAL_DAYTONA" };
      } catch (err) {
        if (this.mode === "required") {
          throw new Error(
            `[Daytona Isolation Blocker] Real Daytona sandbox is REQUIRED but failed to initialize: ${(err as Error).message}. Local execution is strictly forbidden in required mode.`
          );
        }
        console.warn(`[Daytona Warning] Live Daytona failed (${(err as Error).message}). Using explicit LOCAL_DETERMINISTIC_ADAPTER.`);
      }
    } else if (this.mode === "required") {
      throw new Error(
        `[Daytona Isolation Blocker] DAYTONA_MODE=required but DAYTONA_API_KEY / DAYTONA_SERVER_URL are not configured. Local execution is strictly forbidden in required mode.`
      );
    }

    // Optional mode fallback
    this.activeWorkspaces.set(workspaceId, {
      targetPath: resolvedPath,
      isRealDaytona: false,
      createdAt: Date.now(),
    });

    return { workspaceId, mode: "LOCAL_DETERMINISTIC_ADAPTER" };
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

    if (ws?.isRealDaytona && ws.rawSandbox) {
      try {
        const sandbox = ws.rawSandbox as {
          process: { executeCommand: (cmd: string) => Promise<{ exitCode?: number; result?: string; stdout?: string; stderr?: string }> };
        };
        const response = await sandbox.process.executeCommand(command);
        const durationMs = Date.now() - startTime;
        const exitCode = typeof response.exitCode === "number" ? response.exitCode : 0;
        const stdout = response.result || response.stdout || "";
        const stderr = response.stderr || (exitCode !== 0 ? stdout : "");

        return {
          workspaceId,
          command,
          exitCode,
          stdout,
          stderr,
          durationMs,
          reproduced: exitCode !== 0,
          isolatedPath: `daytona://remote-sandbox/${workspaceId}`,
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
          isolatedPath: `daytona://remote-sandbox/${workspaceId}`,
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
          DEBUGFORGE_SANDBOX_MODE: "LOCAL_DETERMINISTIC_ADAPTER",
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
    if (ws?.isRealDaytona && ws.rawSandbox) {
      try {
        const sandbox = ws.rawSandbox as { delete: () => Promise<void> };
        await sandbox.delete();
      } catch (err) {
        console.warn(`[Daytona Teardown] Error deleting remote sandbox ${workspaceId}: ${(err as Error).message}`);
      }
    }
    this.activeWorkspaces.delete(workspaceId);
  }
}

export const daytonaSandbox = new DaytonaSandboxManager();
