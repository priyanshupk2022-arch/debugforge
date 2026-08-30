import { describe, it } from "node:test";
import assert from "node:assert";
import { TrueForgeHarnessBridge } from "../mcp/trueforge-runtime.js";
import { startMCPServer } from "../mcp/http-server.js";

describe("TrueForge Live Server Integration Gate", () => {
  const isLiveTest = process.env.TRUEFORGE_LIVE_TEST === "true";

  it("should execute full live TrueForge server integration loop when TRUEFORGE_LIVE_TEST=true", async (t) => {
    if (!isLiveTest) {
      t.skip("Skipping Live TrueForge Server test because TRUEFORGE_LIVE_TEST is not set to 'true'.");
      return;
    }

    const baseUrl = process.env.TRUEFORGE_BASE_URL || "http://localhost:8790";
    const apiKey = process.env.TRUEFORGE_API_KEY;

    // 1. Start real MCP server
    const { url: mcpUrl, close: closeMcp } = await startMCPServer(3001);

    try {
      const bridge = new TrueForgeHarnessBridge({
        mode: "required",
        baseUrl,
        apiKey,
        mcpServerUrl: mcpUrl,
      });

      // 2. Initialize harness (Server capabilities + Model provider + MCP server registration + Agent provisioning)
      const init = await bridge.initializeHarness();
      assert.strictEqual(init.mode, "LIVE_TRUEFORGE_HARNESS");
      assert.ok(init.agentId, "TrueForge agent must be provisioned and return an agent ID");
      assert.strictEqual(init.registeredTools.length, 5);

      // 3. Create real session on live TrueForge server
      const sessionId = await bridge.createSession(process.cwd());
      assert.ok(sessionId, "TrueForge server must allocate a real session ID");
      assert.ok(!sessionId.startsWith("local_dev_sess_"), "Must be a real server-allocated session ID");

      // 4. Verify agent and session exist on server
      const client = bridge.getTrueForgeClient();
      assert.ok(client);
      const sessionData = await client.sessions.get(sessionId);
      assert.strictEqual(sessionData.data?.id, sessionId);
      assert.strictEqual((sessionData.data?.agent as any)?.name, "debugforge-autonomous-agent");

      console.log(`[TrueForge Live Gate Proof] Successfully verified live TrueForge server session: ${sessionId} for agent: ${init.agentId}`);
    } finally {
      await closeMcp();
    }
  });
});
