import { describe, it } from "node:test";
import assert from "node:assert";
import { TrueForge } from "@truefoundry/trueforge-sdk";
import { TrueForgeHarnessBridge } from "../mcp/trueforge-runtime.js";

describe("TrueForge Official SDK Architecture & Contract Test", () => {
  it("should verify official @truefoundry/trueforge-sdk API structure and client resources", () => {
    const client = new TrueForge({
      baseUrl: "http://localhost:8080",
      token: "tf_test_token_xyz",
    });

    assert.ok(client);
    assert.strictEqual(typeof client.agents.create, "function");
    assert.strictEqual(typeof client.agents.list, "function");
    assert.strictEqual(typeof client.settings.mcpServers.createOrUpdate, "function");
    assert.strictEqual(typeof client.sessions.create, "function");
    assert.strictEqual(typeof client.sessions.createTurnStream, "function");
    assert.strictEqual(typeof client.server.getCapabilities, "function");
  });

  it("should fail closed when TRUEFORGE_MODE=required and TrueForge server is unconfigured", async () => {
    const bridge = new TrueForgeHarnessBridge({
      mode: "required",
      baseUrl: undefined,
    });

    await assert.rejects(
      async () => {
        await bridge.initializeHarness();
      },
      (err: Error) => {
        assert.ok(err.message.includes("[TrueForge Harness Blocker]"));
        return true;
      }
    );
  });

  it("should explicitly label LOCAL_DEV_MODE when running offline without live server", async () => {
    const bridge = new TrueForgeHarnessBridge({
      mode: "local",
    });

    const init = await bridge.initializeHarness();
    assert.strictEqual(init.mode, "LOCAL_DEV_MODE");
    assert.strictEqual(bridge.executionMode, "LOCAL_DEV_MODE");

    const sessionId = await bridge.createSession(process.cwd());
    assert.ok(sessionId.startsWith("local_dev_sess_"));
  });

  it("should register all 5 standard DebugForge MCP tools", async () => {
    const bridge = new TrueForgeHarnessBridge();
    const init = await bridge.initializeHarness();

    assert.strictEqual(init.registeredTools.length, 5);
    assert.ok(init.registeredTools.includes("debugforge_ingest_error"));
    assert.ok(init.registeredTools.includes("debugforge_reproduce_in_sandbox"));
    assert.ok(init.registeredTools.includes("debugforge_trace_and_analyze"));
    assert.ok(init.registeredTools.includes("debugforge_auto_patch"));
    assert.ok(init.registeredTools.includes("debugforge_verify_fix"));
  });
});
