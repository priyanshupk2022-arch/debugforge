import { describe, it } from "node:test";
import assert from "node:assert";
import { TrueForge } from "@truefoundry/trueforge-sdk";
import { TrueForgeHarnessBridge, trueforgeHarness } from "../mcp/trueforge-runtime.js";

describe("TrueForge Official SDK Integration Test", () => {
  it("should successfully instantiate the official @truefoundry/trueforge-sdk client", () => {
    const client = new TrueForge({
      baseUrl: "http://localhost:8080",
      token: "tf_test_key_123",
    });

    assert.ok(client);
    assert.strictEqual(typeof client.sessions, "object");
    assert.strictEqual(typeof client.mcpServers, "object");
    assert.strictEqual(typeof client.agents, "object");
    assert.strictEqual(typeof client.models, "object");
  });

  it("should register all 5 DebugForge MCP tools on the TrueForge harness bridge", async () => {
    const bridge = new TrueForgeHarnessBridge();
    const initResult = await bridge.initializeRemoteHarness();

    assert.ok(initResult.registeredTools.includes("debugforge_ingest_error"));
    assert.ok(initResult.registeredTools.includes("debugforge_reproduce_in_sandbox"));
    assert.ok(initResult.registeredTools.includes("debugforge_trace_and_analyze"));
    assert.ok(initResult.registeredTools.includes("debugforge_auto_patch"));
    assert.ok(initResult.registeredTools.includes("debugforge_verify_fix"));
    assert.strictEqual(initResult.registeredTools.length, 5);
  });

  it("should create TrueForge sessions and stream turn events", async () => {
    const sessionId = await trueforgeHarness.createSession(process.cwd());
    assert.ok(sessionId.startsWith("tf_sess_"));

    const turnStream = trueforgeHarness.createTurnStream(sessionId, {
      prompt: "Diagnostic test",
      rawError: "TypeError: Cannot read properties of undefined (reading 'test')",
      autoApprove: true,
    });

    const events = [];
    for await (const event of turnStream) {
      events.push(event);
      if (events.length >= 2) break; // Sample turn stream
    }

    assert.ok(events.length >= 2);
    assert.strictEqual(events[0].type, "thought");
  });
});
