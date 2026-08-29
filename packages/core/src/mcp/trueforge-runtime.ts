import { TrueForgeMCPServer, trueforgeMCPServer } from "./server.js";
import { runDebugAgent } from "../agent/loop.js";
import { AgentEvent } from "../types.js";

export interface TrueForgeAgentManifest {
  name: string;
  version: string;
  description: string;
  model: {
    provider: string;
    name: string;
    temperature: number;
  };
  tools: Array<{
    type: "mcp";
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  sandbox: {
    provider: "daytona" | "local";
    image: string;
  };
}

export class TrueForgeAgentRuntime {
  private server: TrueForgeMCPServer;
  private activeSessions: Map<string, { id: string; targetPath: string; events: AgentEvent[] }> = new Map();

  constructor(server: TrueForgeMCPServer = trueforgeMCPServer) {
    this.server = server;
  }

  getAgentManifest(): TrueForgeAgentManifest {
    return {
      name: "debugforge",
      version: "1.0.0",
      description: "DebugForge Autonomous AI Debugging Agent Harness on TrueForge & Daytona",
      model: {
        provider: "openai",
        name: process.env.OPENAI_MODEL || "gpt-4o",
        temperature: 0.1,
      },
      tools: this.server.listTools().map(tool => ({
        type: "mcp",
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
      sandbox: {
        provider: "daytona",
        image: "node:22-slim",
      },
    };
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
      throw new Error(`TrueForge session not found: ${sessionId}`);
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

export const trueforgeRuntime = new TrueForgeAgentRuntime();
