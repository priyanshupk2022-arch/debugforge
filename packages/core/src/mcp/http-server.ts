import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { ingestError } from "../tools/ingest-error.js";
import { reproduceInSandbox } from "../tools/reproduce.js";
import { traceAndAnalyze } from "../tools/trace-analyze.js";
import { autoPatch } from "../tools/auto-patch.js";
import { verifyFix } from "../tools/verify-fix.js";
import { trueforgeMCPServer } from "./server.js";

export function createDebugForgeMcpServer(): McpServer {
  const server = new McpServer({
    name: "debugforge",
    version: "1.0.0",
  });

  // 1. debugforge_ingest_error
  server.tool(
    "debugforge_ingest_error",
    {
      rawError: z.string().describe("Raw error stack trace, test runner failure log, or console output"),
    },
    async ({ rawError }) => {
      const result = ingestError(rawError);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 2. debugforge_reproduce_in_sandbox
  server.tool(
    "debugforge_reproduce_in_sandbox",
    {
      projectPath: z.string().describe("Absolute or relative path to project root"),
      testCommand: z.string().optional().describe("Reproduction test command, e.g., npm test"),
      timeoutMs: z.number().optional().describe("Execution timeout in milliseconds"),
    },
    async ({ projectPath, testCommand, timeoutMs }) => {
      const result = await reproduceInSandbox({ projectPath, testCommand, timeoutMs });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 3. debugforge_trace_and_analyze
  server.tool(
    "debugforge_trace_and_analyze",
    {
      errorReport: z.any().optional().describe("Error report from ingest step"),
      errorId: z.string().optional().describe("Unique error identifier from ingest step"),
      crashSite: z.object({
        file: z.string(),
        line: z.number(),
        column: z.number().optional(),
        symptomExplanation: z.string(),
      }).optional(),
      projectPath: z.string().describe("Target workspace root"),
    },
    async ({ errorReport, errorId, crashSite, projectPath }) => {
      const report = errorReport || {
        id: errorId || "err_mcp",
        errorType: "RuntimeError",
        errorMessage: crashSite?.symptomExplanation || "Runtime crash",
        crashSite: crashSite || { file: "src/index.js", line: 1 },
        stackFrames: [],
        category: "logic_flaw",
        rawLog: crashSite?.symptomExplanation || "",
        timestamp: Date.now(),
      };
      const result = await traceAndAnalyze({ errorReport: report, projectPath });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 4. debugforge_auto_patch
  server.tool(
    "debugforge_auto_patch",
    {
      rca: z.any().describe("Root cause analysis object returned from trace_and_analyze"),
      projectPath: z.string().describe("Target workspace path"),
      applyImmediately: z.boolean().optional().describe("Whether to write patch to disk immediately"),
    },
    async ({ rca, projectPath, applyImmediately }) => {
      const result = await autoPatch({ rca, projectPath, applyImmediately });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // 5. debugforge_verify_fix
  server.tool(
    "debugforge_verify_fix",
    {
      projectPath: z.string().describe("Target workspace path"),
      errorId: z.string().describe("Error identifier to verify"),
      testCommand: z.string().optional().describe("Verification test command"),
      stressCommand: z.string().optional().describe("Stress test command"),
    },
    async ({ projectPath, errorId, testCommand, stressCommand }) => {
      const result = await verifyFix({ projectPath, errorId, testCommand, stressCommand });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  return server;
}

export function startMCPServer(port = Number(process.env.DEBUGFORGE_MCP_PORT) || 3000): Promise<{
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}> {
  const mcpApp = createDebugForgeMcpServer();
  const transports = new Map<string, SSEServerTransport>();

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", name: "debugforge-mcp-server", tools: 5 }));
      return;
    }

    if (url.pathname === "/tools") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(trueforgeMCPServer.listTools(), null, 2));
      return;
    }

    if (url.pathname === "/sse" || url.pathname === "/mcp/sse" || url.pathname === "/mcp") {
      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;
      transports.set(sessionId, transport);

      transport.onclose = () => {
        transports.delete(sessionId);
      };

      await mcpApp.connect(transport);
      return;
    }

    if (url.pathname === "/messages" && req.method === "POST") {
      const sessionId = url.searchParams.get("sessionId");
      const transport = sessionId ? transports.get(sessionId) : Array.from(transports.values())[0];

      if (!transport) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }

      await transport.handlePostMessage(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found", routes: ["/health", "/tools", "/sse", "/messages"] }));
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      const actualUrl = `http://localhost:${port}/sse`;
      console.log(`[DebugForge MCP] Real MCP HTTP/SSE Server listening on http://localhost:${port} (SSE endpoint: ${actualUrl})`);
      resolve({
        server,
        url: actualUrl,
        close: () =>
          new Promise<void>((r) => {
            server.close(() => r());
          }),
      });
    });
  });
}

// Auto-run when executed directly via CLI
if (process.argv[1]?.includes("http-server")) {
  startMCPServer();
}
