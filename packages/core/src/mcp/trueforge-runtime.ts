import { TrueForge } from "@truefoundry/trueforge-sdk";
import { TrueForgeMCPServer, trueforgeMCPServer } from "./server.js";
import { runDebugAgent } from "../agent/loop.js";
import { AgentEvent } from "../types.js";

export interface TrueForgeIntegrationConfig {
  baseUrl?: string;
  apiKey?: string;
  autoConnect?: boolean;
}

export class TrueForgeHarnessBridge {
  private client: TrueForge;
  private mcpServer: TrueForgeMCPServer;
  private activeSessions: Map<string, { id: string; targetPath: string; events: AgentEvent[] }> = new Map();
  public isConnectedToRemoteServer = false;

  constructor(config: TrueForgeIntegrationConfig = {}, mcpServer: TrueForgeMCPServer = trueforgeMCPServer) {
    const baseUrl = config.baseUrl || process.env.TRUEFORGE_BASE_URL || "http://localhost:8080";
    const token = config.apiKey || process.env.TRUEFORGE_API_KEY;

    this.client = new TrueForge({
      baseUrl,
      token,
    });
    this.mcpServer = mcpServer;
  }

  getTrueForgeClient(): TrueForge {
    return this.client;
  }

  getMCPServer(): TrueForgeMCPServer {
    return this.mcpServer;
  }

  async initializeRemoteHarness(): Promise<{ status: "connected" | "offline_local"; registeredTools: string[] }> {
    const tools = this.mcpServer.listTools().map(t => t.name);

    if (process.env.TRUEFORGE_BASE_URL && process.env.TRUEFORGE_API_KEY) {
      try {
        await this.client.server.getCapabilities();
        this.isConnectedToRemoteServer = true;
        return { status: "connected", registeredTools: tools };
      } catch (err) {
        console.warn(`[TrueForge Notice] Remote TrueForge server is unreachable (${(err as Error).message}). Using local harness runtime.`);
      }
    }

    return { status: "offline_local", registeredTools: tools };
  }

  async createSession(targetPath: string): Promise<string> {
    const sessionId = `tf_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.activeSessions.set(sessionId, {
      id: sessionId,
      targetPath,
      events: [],
    });
    return sessionId;
  }

  async *createTurnStream(
    sessionId: string,
    input: { prompt?: string; rawError?: string; testCommand?: string; autoApprove?: boolean }
  ): AsyncGenerator<AgentEvent> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`[TrueForge Session Error] Session not found: ${sessionId}`);
    }

    const generator = runDebugAgent({
      prompt: input.prompt,
      rawError: input.rawError,
      projectPath: session.targetPath,
      testCommand: input.testCommand,
      autoApprove: input.autoApprove ?? false,
    });

    for await (const event of generator) {
      session.events.push(event);
      yield event;
    }
  }
}

export const trueforgeHarness = new TrueForgeHarnessBridge();
