import { describe, it } from "node:test";
import assert from "node:assert";
import { TrueForgeHarnessBridge } from "../mcp/trueforge-runtime.js";

describe("TrueForge Live Server Integration Gate", () => {
  const isLiveTest = process.env.TRUEFORGE_LIVE_TEST === "true";

  it("should execute full live TrueForge server integration loop when TRUEFORGE_LIVE_TEST=true", async (t) => {
    if (!isLiveTest) {
      t.skip("Skipping Live TrueForge Server test because TRUEFORGE_LIVE_TEST is not set to 'true'.");
      return;
    }

    const baseUrl = process.env.TRUEFORGE_BASE_URL;
    const apiKey = process.env.TRUEFORGE_API_KEY;

    if (!baseUrl) {
      throw new Error(
        "[LIVE_TRUEFORGE_BLOCKED] TRUEFORGE_LIVE_TEST=true requires TRUEFORGE_BASE_URL to be set."
      );
    }

    const bridge = new TrueForgeHarnessBridge({
      mode: "required",
      baseUrl,
      apiKey,
    });

    // 1. Initialize harness and verify live server connection & MCP registration
    const init = await bridge.initializeHarness();
    assert.strictEqual(init.mode, "LIVE_TRUEFORGE_HARNESS");
    assert.ok(init.agentId);

    // 2. Create real session on server
    const sessionId = await bridge.createSession(process.cwd());
    assert.ok(sessionId);
    assert.ok(!sessionId.startsWith("local_dev_sess_"));

    // 3. Create real turn stream on server
    const turnStream = bridge.createTurnStream(sessionId, {
      prompt: "Execute diagnostics on target",
      rawError: "TypeError: Cannot read properties of undefined",
      projectPath: process.cwd(),
    });

    let receivedEvents = 0;
    for await (const event of turnStream) {
      receivedEvents++;
      assert.ok(event.timestamp);
      if (receivedEvents >= 1) break;
    }

    assert.ok(receivedEvents > 0);
  });
});
