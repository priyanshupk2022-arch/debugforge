import { ingestError } from "../tools/ingest-error.js";
import { reproduceInSandbox } from "../tools/reproduce.js";
import { traceAndAnalyze } from "../tools/trace-analyze.js";
import { autoPatch } from "../tools/auto-patch.js";
import { verifyFix } from "../tools/verify-fix.js";

export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: any) => Promise<unknown> | unknown;
}

export class TrueForgeMCPServer {
  private tools: Map<string, MCPToolDefinition> = new Map();

  constructor() {
    this.registerBuiltinTools();
  }

  private registerBuiltinTools(): void {
    this.registerTool({
      name: "debugforge_ingest_error",
      description: "Parses raw stack traces and test logs into structured error diagnostic models.",
      parameters: {
        type: "object",
        properties: {
          rawLog: { type: "string", description: "The raw error log or stack trace" },
        },
        required: ["rawLog"],
      },
      handler: (args: { rawLog: string }) => ingestError(args.rawLog),
    });

    this.registerTool({
      name: "debugforge_reproduce_in_sandbox",
      description: "Executes test command in isolated Daytona sandbox to confirm failure reproduction.",
      parameters: {
        type: "object",
        properties: {
          projectPath: { type: "string", description: "Path to project root" },
          testCommand: { type: "string", description: "Command to execute (e.g. npm test)" },
        },
        required: ["projectPath"],
      },
      handler: (args: { projectPath: string; testCommand?: string }) => reproduceInSandbox(args),
    });

    this.registerTool({
      name: "debugforge_trace_and_analyze",
      description: "Traces dynamic execution backwards from crash site to locate the true infection origin.",
      parameters: {
        type: "object",
        properties: {
          errorReport: { type: "object", description: "Parsed error report" },
          projectPath: { type: "string", description: "Path to project root" },
        },
        required: ["errorReport", "projectPath"],
      },
      handler: (args: { errorReport: any; projectPath: string }) => traceAndAnalyze(args),
    });

    this.registerTool({
      name: "debugforge_auto_patch",
      description: "Synthesizes deterministic surgical unified diff patches to remediate infection origins.",
      parameters: {
        type: "object",
        properties: {
          rca: { type: "object", description: "Root cause analysis object" },
          projectPath: { type: "string", description: "Target directory" },
        },
        required: ["rca", "projectPath"],
      },
      handler: (args: { rca: any; projectPath: string }) => autoPatch(args),
    });

    this.registerTool({
      name: "debugforge_verify_fix",
      description: "Asserts Triple-Lock verification: bug fixed, zero regressions, stress test passed.",
      parameters: {
        type: "object",
        properties: {
          errorId: { type: "string", description: "Target error ID" },
          projectPath: { type: "string", description: "Project directory" },
          testCommand: { type: "string", description: "Test command to evaluate" },
        },
        required: ["errorId", "projectPath"],
      },
      handler: (args: { errorId: string; projectPath: string; testCommand?: string }) => verifyFix(args),
    });
  }

  registerTool(tool: MCPToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): MCPToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): MCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async callTool(name: string, args: any): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`MCP tool not found: ${name}`);
    }
    return await tool.handler(args);
  }
}

export const trueforgeMCPServer = new TrueForgeMCPServer();
