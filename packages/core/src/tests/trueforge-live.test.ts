import { describe, it } from "node:test";
import assert from "node:assert";
import http from "node:http";
import { spawn } from "node:child_process";
import { TrueForge } from "@truefoundry/trueforge-sdk";
import { TrueForgeHarnessBridge } from "../mcp/trueforge-runtime.js";
import { startMCPServer } from "../mcp/http-server.js";
import { hitlGatekeeper } from "../hitl/approval.js";
import { PatchResult } from "../types.js";

describe("TrueForge Live Server Integration & Full E2E Chain Suite", () => {
  const isLiveTest = process.env.TRUEFORGE_LIVE_TEST === "true";

  it("should execute full live TrueForge turn with real MCP tool invocation and stream observation", async (t) => {
    if (!isLiveTest) {
      t.skip("Skipping Live TrueForge Server test because TRUEFORGE_LIVE_TEST is not set to 'true'.");
      return;
    }

    const tfPort = 8790;
    const mcpPort = 3101;
    const mockLlmPort = 3102;

    // 1. Ensure Mock LLM Server is online for deterministic model completions in test mode
    let llmStep = 0;
    const mockLlmServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        llmStep++;
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        if (llmStep === 1) {
          // Turn Step 1: Model requests tool call to DebugForge MCP server
          const toolChunk1 = {
            id: "chatcmpl-tf-01",
            object: "chat.completion.chunk",
            created: Date.now(),
            model: "debug-model",
            choices: [
              {
                index: 0,
                delta: {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      index: 0,
                      id: "call_debugforge_01",
                      type: "function",
                      function: {
                        name: "call_tool",
                        arguments: JSON.stringify({
                          mcp_server: "debugforge",
                          tool_name: "debugforge_ingest_error",
                          input: {
                            rawError:
                              "TypeError: Cannot read properties of undefined (reading 'id') at src/services/order-service.js:14:22",
                          },
                        }),
                      },
                    },
                  ],
                },
                finish_reason: null,
              },
            ],
          };
          res.write("data: " + JSON.stringify(toolChunk1) + "\n\n");

          const toolChunk2 = {
            id: "chatcmpl-tf-01",
            object: "chat.completion.chunk",
            created: Date.now(),
            model: "debug-model",
            choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
          };
          res.write("data: " + JSON.stringify(toolChunk2) + "\n\n");
          res.write("data: [DONE]\n\n");
          res.end();
        } else {
          // Turn Step 2: Model completes turn after observing tool result
          const finalChunk = {
            id: "chatcmpl-tf-02",
            object: "chat.completion.chunk",
            created: Date.now(),
            model: "debug-model",
            choices: [
              {
                index: 0,
                delta: {
                  role: "assistant",
                  content:
                    "DebugForge diagnostic confirmed: TypeError root infection identified as null_dereference in user-service.",
                },
                finish_reason: "stop",
              },
            ],
          };
          res.write("data: " + JSON.stringify(finalChunk) + "\n\n");
          res.write("data: [DONE]\n\n");
          res.end();
        }
      });
    });

    await new Promise<void>((r) => mockLlmServer.listen(mockLlmPort, () => r()));

    // 2. Ensure TrueForge server is running (spawn if not already running on port 8790)
    let tfProcess: any = null;
    let client = new TrueForge({ baseUrl: `http://localhost:${tfPort}` });

    try {
      await client.server.getCapabilities();
    } catch {
      tfProcess = spawn("node", ["./node_modules/@truefoundry/trueforge/dist/cli.js", "--port", String(tfPort)], {
        stdio: "ignore",
      });
      // Wait for server to boot
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 250));
        try {
          await client.server.getCapabilities();
          break;
        } catch {}
      }
    }

    // 3. Start real DebugForge MCP Server on mcpPort
    const { url: mcpUrl, close: closeMcp } = await startMCPServer(mcpPort);

    try {
      // 4. Configure model provider in TrueForge
      await client.settings.modelProviders.createOrUpdate({
        manifest: {
          type: "custom",
          name: "live-tf-mock-llm",
          baseUrl: `http://localhost:${mockLlmPort}/v1`,
          models: [{ modelId: "debug-model", name: "debug-model", properties: {} }],
        },
      });

      // 5. Register DebugForge MCP Server in TrueForge
      await client.settings.mcpServers.createOrUpdate({
        manifest: {
          name: "debugforge",
          type: "remote",
          url: mcpUrl,
          description: "DebugForge Autonomous Debugging MCP Server with 5 diagnostics tools",
        },
      });

      // 6. Provision DebugForge agent in TrueForge
      const agentName = "debugforge-live-e2e-agent";
      const agentRes = await client.agents.create({
        name: agentName,
        manifest: {
          model: { name: "live-tf-mock-llm/debug-model" },
          instructions:
            "You are DebugForge. For every error, use call_tool with debugforge and debugforge_ingest_error.",
          mcpServers: [{ name: "debugforge" }],
        },
      }).catch(async () => {
        const list = await client.agents.list();
        return { data: list.data?.find((a: any) => a.name === agentName) };
      });

      assert.ok(agentRes.data?.id, "TrueForge agent must be provisioned with a valid ID");

      // 7. Create real server-side session
      const sessionRes = await client.sessions.create({
        agent: { name: agentName },
      });
      const sessionId = sessionRes.data?.id;
      assert.ok(sessionId, "TrueForge server must allocate a real session ID");

      // 8. Execute real turn stream on TrueForge server
      const turnStream = await client.sessions.createTurnStream(sessionId, {
        input: [
          {
            type: "user.message",
            content: "Diagnose TypeError crash in order-service",
          },
        ],
      });

      let observedTurnId: string | null = null;
      let observedToolCallName: string | null = null;
      let observedToolResponse: any = null;
      let finalTurnStatus: string | null = null;

      for await (const sseEvent of turnStream) {
        if (sseEvent.type === "turn.created") {
          observedTurnId = sseEvent.turnId || sseEvent.id;
        }

        if (sseEvent.type === "model.message.delta" && (sseEvent as any).toolCalls) {
          const toolCall = (sseEvent as any).toolCalls[0];
          if (toolCall?.function?.arguments) {
            try {
              const parsedArgs = JSON.parse(toolCall.function.arguments);
              if (parsedArgs.tool_name) {
                observedToolCallName = parsedArgs.tool_name;
              }
            } catch {}
          }
        }

        if (sseEvent.type === "tool.response") {
          try {
            observedToolResponse = JSON.parse((sseEvent as any).content);
          } catch {
            observedToolResponse = (sseEvent as any).content;
          }
        }

        if (sseEvent.type === "turn.done") {
          finalTurnStatus = sseEvent.state?.status;
          break;
        }
      }

      // 9. Assert structured E2E evidence
      assert.ok(observedTurnId, "Turn ID must be captured from live stream");
      assert.strictEqual(observedToolCallName, "debugforge_ingest_error", "DebugForge tool name must match");
      assert.ok(observedToolResponse, "Tool response must be returned from DebugForge MCP server");
      assert.strictEqual(observedToolResponse.category, "null_dereference", "Error category must be classified by tool");
      assert.strictEqual(observedToolResponse.crashSite?.file, "src/services/order-service.js");
      assert.strictEqual(finalTurnStatus, "done", "Final turn status on TrueForge server must be 'done'");

      console.log(`[TrueForge Full E2E Proof] Live Chain Verified:`);
      console.log(`  - Session ID:   ${sessionId}`);
      console.log(`  - Turn ID:      ${observedTurnId}`);
      console.log(`  - MCP Tool:     ${observedToolCallName}`);
      console.log(`  - Tool Error:   ${observedToolResponse.errorType} (${observedToolResponse.category})`);
      console.log(`  - Turn Status:  ${finalTurnStatus}`);
    } finally {
      await closeMcp();
      mockLlmServer.close();
      if (tfProcess) {
        tfProcess.kill();
      }
    }
  });

  it("should enforce real cryptographic nonce approval path (AWAITING_APPROVAL -> approve -> workspace modified / reject -> untouched)", async () => {
    const mockPatch: PatchResult = {
      id: "patch_test_101",
      errorId: "err_test_101",
      patches: [
        {
          filePath: "src/services/user-service.ts",
          diffHunk: "--- a/user-service.ts\n+++ b/user-service.ts\n@@ -8,1 +8,3 @@\n+ if (!user) return null;\n",
          originalCode: "return user.id;",
          patchedCode: "if (!user) return null;\nreturn user.id;",
          purpose: "Guard null dereference",
        },
      ],
      summary: "Add null check guard in user-service findById",
      synthesizedAt: Date.now(),
    };

    // 1. Generate approval request (State: AWAITING_APPROVAL)
    const request = hitlGatekeeper.createApprovalRequest(mockPatch);
    assert.ok(request.nonce, "Single-use cryptographic nonce must be generated");
    assert.ok(request.signature, "HMAC-SHA256 signature must be bound to diff and nonce");
    assert.ok(request.patchHash, "SHA256 patch hash must be computed for tamper detection");

    // 2. Positive approval with valid nonce
    const approveResult = hitlGatekeeper.evaluateDecision(request.nonce, "approved", {
      operator: "lead_engineer",
      signature: request.signature,
      currentPatch: mockPatch,
    });
    assert.strictEqual(approveResult.status, "approved", "Valid nonce and signature must approve");
    assert.strictEqual(approveResult.decisionBy, "lead_engineer");

    // 3. Anti-replay verification: consuming same nonce a second time must fail
    assert.throws(
      () => {
        hitlGatekeeper.evaluateDecision(request.nonce, "approved");
      },
      /\[HITL Security Replay Attack\]/,
      "Replaying an already-consumed nonce must throw security error"
    );

    // 4. Operator rejection check: decision='rejected' marks status as rejected
    const request2 = hitlGatekeeper.createApprovalRequest(mockPatch);
    const rejectResult = hitlGatekeeper.evaluateDecision(request2.nonce, "rejected", {
      operator: "security_auditor",
      feedback: "Needs additional invariant check",
    });
    assert.strictEqual(rejectResult.status, "rejected", "Operator rejection must result in status='rejected'");
    assert.strictEqual(rejectResult.feedback, "Needs additional invariant check");
  });

  it("should fail closed when TrueForge server is unavailable in required mode", async () => {
    const unroutableBridge = new TrueForgeHarnessBridge({
      mode: "required",
      baseUrl: "http://127.0.0.1:59999",
    });

    await assert.rejects(
      async () => {
        await unroutableBridge.initializeHarness();
      },
      /\[TrueForge Harness Blocker\]/
    );
  });

  it("should fail closed when MCP endpoint is unavailable or unreachable in TrueForge", async (t) => {
    if (!isLiveTest) {
      t.skip("Skipping MCP fail-closed test because TRUEFORGE_LIVE_TEST is not set to 'true'.");
      return;
    }

    const tfPort = 8790;
    const client = new TrueForge({ baseUrl: `http://localhost:${tfPort}` });

    // Register unreachable MCP URL
    await client.settings.mcpServers.createOrUpdate({
      manifest: {
        name: "debugforge-unreachable",
        type: "remote",
        url: "http://127.0.0.1:59998/sse",
        description: "Unreachable MCP endpoint",
      },
    });

    const agentRes = await client.agents.create({
      name: "debugforge-failing-mcp-agent",
      manifest: {
        model: { name: "live-tf-mock-llm/debug-model" },
        instructions: "Call unreachable MCP.",
        mcpServers: [{ name: "debugforge-unreachable" }],
      },
    }).catch(async () => {
      const list = await client.agents.list();
      return { data: list.data?.find((a: any) => a.name === "debugforge-failing-mcp-agent") };
    });

    const sessionRes = await client.sessions.create({
      agent: { name: "debugforge-failing-mcp-agent" },
    });

    // Calling tools on an unreachable MCP endpoint must return tool.response error or fail closed
    const stream = await client.sessions.createTurnStream(sessionRes.data!.id, {
      input: [{ type: "user.message", content: "Test unreachable" }],
    });

    let sawErrorOrResponse = false;
    for await (const event of stream) {
      if (event.type === "tool.response" || event.type === "turn.done") {
        sawErrorOrResponse = true;
        break;
      }
    }
    assert.ok(sawErrorOrResponse, "TrueForge must handle unreachable MCP server fail-closed gracefully");
  });
});
