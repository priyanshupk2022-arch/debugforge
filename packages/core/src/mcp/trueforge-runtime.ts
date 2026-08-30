import { TrueForge } from "@truefoundry/trueforge-sdk";
import { TrueForgeMCPServer, trueforgeMCPServer } from "./server.js";
import { runDebugAgent } from "../agent/loop.js";
import { resolveModelProviderConfig, buildTrueForgeProviderManifest } from "../agent/provider.js";
import { AgentEvent } from "../types.js";

export type TrueForgeExecutionMode = "LIVE_TRUEFORGE_HARNESS" | "LOCAL_DEV_MODE";

export interface TrueForgeHarnessConfig {
  baseUrl?: string;
  apiKey?: string;
  agentName?: string;
  modelName?: string;
  mcpServerUrl?: string;
  mode?: "required" | "optional" | "local";
}

export class TrueForgeHarnessBridge {
  private client: TrueForge | null = null;
  private mcpServer: TrueForgeMCPServer;
  public executionMode: TrueForgeExecutionMode = "LOCAL_DEV_MODE";
  public agentId: string | null = null;
  public registeredMcpName: string | null = null;
  public serverUrl: string | null = null;

  constructor(
    private config: TrueForgeHarnessConfig = {},
    mcpServer: TrueForgeMCPServer = trueforgeMCPServer
  ) {
    this.mcpServer = mcpServer;
    const baseUrl = config.baseUrl || process.env.TRUEFORGE_BASE_URL || (process.env.TRUEFORGE_MODE === "required" ? "http://localhost:8790" : undefined);
    const token = config.apiKey || process.env.TRUEFORGE_API_KEY;

    if (baseUrl) {
      this.serverUrl = baseUrl;
      this.client = new TrueForge({
        baseUrl,
        token,
      });
    }
  }

  getTrueForgeClient(): TrueForge | null {
    return this.client;
  }

  getMCPServer(): TrueForgeMCPServer {
    return this.mcpServer;
  }

  /**
   * Initializes the TrueForge Harness by connecting to the server,
   * registering the model provider, registering DebugForge MCP server,
   * and provisioning the autonomous debugging agent on the TrueForge server.
   */
  async initializeHarness(): Promise<{
    mode: TrueForgeExecutionMode;
    agentId?: string;
    registeredTools: string[];
    capabilities?: unknown;
  }> {
    const tools = this.mcpServer.listTools().map((t) => t.name);
    const modeSetting = this.config.mode || process.env.TRUEFORGE_MODE || "optional";

    if (modeSetting === "required" && !this.client) {
      throw new Error(
        `[TrueForge Harness Blocker] TRUEFORGE_MODE=required but TRUEFORGE_BASE_URL is not configured. Failing closed.`
      );
    }

    if (this.client) {
      try {
        // 1. Verify server capabilities with 2000ms timeout
        const capabilitiesPromise = this.client.server.getCapabilities();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TrueForge health check timed out")), 2000)
        );
        const capabilities = (await Promise.race([capabilitiesPromise, timeoutPromise])) as unknown;

        // 2. Ensure model provider is registered in TrueForge
        const providerConfig = resolveModelProviderConfig({
          model: this.config.modelName,
        });

        if (modeSetting === "required" && !providerConfig.apiKey && !providerConfig.baseUrl) {
          throw new Error(
            `[TrueForge Provider Blocker] TRUEFORGE_MODE=required but no API credentials or baseUrl were provided for ${providerConfig.provider}. Failing closed.`
          );
        }

        if (providerConfig.apiKey || providerConfig.baseUrl) {
          try {
            const providerManifest = buildTrueForgeProviderManifest(providerConfig);
            await this.client.settings.modelProviders.createOrUpdate(providerManifest);
          } catch (err: any) {
            throw new Error(
              `[TrueForge Provider Registration Blocker] Failed to register model provider "${providerConfig.provider}" on TrueForge server: ${err?.message || err}`
            );
          }
        }

        // 3. Register or update DebugForge MCP Server in TrueForge settings
        const mcpServerName = "debugforge";
        const mcpUrl = this.config.mcpServerUrl || process.env.DEBUGFORGE_MCP_URL || "http://localhost:3000/sse";

        await this.client.settings.mcpServers.createOrUpdate({
          manifest: {
            name: mcpServerName,
            type: "remote",
            url: mcpUrl,
            description: "DebugForge Autonomous Debugging MCP Server with 5 diagnostics tools",
          },
        });
        this.registeredMcpName = mcpServerName;

        // 4. Register or locate DebugForge agent on TrueForge server
        const agentName = this.config.agentName || "debugforge-autonomous-agent";

        try {
          const agentRes = await this.client.agents.create({
            name: agentName,
            manifest: {
              model: {
                name: providerConfig.fullModelName,
              },
              instructions:
                "You are DebugForge, an autonomous debugging agent harness. You reproduce failures in Daytona, perform backward causal tracing, synthesize minimal surgical patches, and execute Triple-Lock verification gates.",
              mcpServers: [{ name: mcpServerName }],
            },
          });
          this.agentId = agentRes.data?.id || null;
        } catch (err: any) {
          // If agent already exists, locate existing ID
          if (err?.message?.includes("already taken") || err?.status === 409 || err?.statusCode === 409) {
            const listRes = await this.client.agents.list();
            const existing = listRes.data?.find((a: any) => a.name === agentName);
            if (existing) {
              this.agentId = existing.id;
            }
          } else {
            throw err;
          }
        }

        this.executionMode = "LIVE_TRUEFORGE_HARNESS";
        return {
          mode: "LIVE_TRUEFORGE_HARNESS",
          agentId: this.agentId || agentName,
          registeredTools: tools,
          capabilities,
        };
      } catch (err) {
        if (modeSetting === "required") {
          throw new Error(
            `[TrueForge Harness Blocker] Failed to connect to live TrueForge server at ${this.serverUrl}: ${(err as Error).message}. Halting in required mode.`
          );
        }
        console.warn(
          `[TrueForge Notice] Live TrueForge server unreachable (${(err as Error).message}). Using LOCAL_DEV_MODE (NOT_TRUEFORGE_RUNTIME).`
        );
      }
    }

    this.executionMode = "LOCAL_DEV_MODE";
    return {
      mode: "LOCAL_DEV_MODE",
      registeredTools: tools,
    };
  }

  /**
   * Creates a session on the real TrueForge server via client.sessions.create.
   */
  async createSession(targetPath: string): Promise<string> {
    if (this.executionMode === "LIVE_TRUEFORGE_HARNESS" && this.client) {
      const agentName = this.config.agentName || "debugforge-autonomous-agent";
      const session = await this.client.sessions.create({
        agent: {
          name: agentName,
        },
      });
      return session.data.id;
    }

    // Explicit local dev mode session
    return `local_dev_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Executes a turn stream through the real TrueForge server (or explicit local dev mode).
   */
  async *createTurnStream(
    sessionId: string,
    input: {
      prompt?: string;
      rawError?: string;
      testCommand?: string;
      autoApprove?: boolean;
      projectPath?: string;
    }
  ): AsyncGenerator<AgentEvent> {
    if (this.executionMode === "LIVE_TRUEFORGE_HARNESS" && this.client) {
      const userPrompt =
        input.prompt ||
        `Debug and resolve runtime error in target project ${input.projectPath || process.cwd()}.\nError: ${input.rawError || "Inspect and reproduce test failures."}`;

      const sseStream = await this.client.sessions.createTurnStream(sessionId, {
        input: [
          {
            type: "user.message",
            content: userPrompt,
          },
        ],
      });

      for await (const serverEvent of sseStream) {
        yield {
          type: "thought",
          content: `[TRUEFORGE SERVER] Received event: ${JSON.stringify(serverEvent)}`,
          timestamp: Date.now(),
        };
      }
      return;
    }

    // Explicitly labeled local dev reasoning engine
    console.log(
      `[LOCAL_DEV_MODE: NOT_TRUEFORGE_RUNTIME] Running local fallback reasoning engine for target ${input.projectPath}`
    );
    const generator = runDebugAgent({
      prompt: input.prompt,
      rawError: input.rawError,
      projectPath: input.projectPath || process.cwd(),
      testCommand: input.testCommand,
      autoApprove: input.autoApprove ?? false,
    });

    for await (const event of generator) {
      yield event;
    }
  }
}

export const trueforgeHarness = new TrueForgeHarnessBridge();
