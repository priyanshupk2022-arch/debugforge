import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { TrueForge } from "@truefoundry/trueforge-sdk";
import {
  resolveModelProviderConfig,
  formatProviderLabel,
  buildTrueForgeProviderManifest,
  getEnvVarHintForProvider,
} from "../agent/provider.js";
import { startMCPServer } from "../mcp/http-server.js";

describe("TrueForge Real Multi-Provider Smoke Test Suite", () => {
  const isRealProviderTest = process.env.REAL_PROVIDER_TEST === "true";
  const tfPort = 8790;
  let tfProcess: any = null;
  const client = new TrueForge({ baseUrl: `http://localhost:${tfPort}` });

  before(async () => {
    if (!isRealProviderTest) return;

    // Check if TrueForge server is already running
    try {
      await client.server.getCapabilities();
    } catch {
      const fs = await import("node:fs");
      let cliPath = "./packages/core/node_modules/@truefoundry/trueforge/dist/cli.js";
      if (!fs.existsSync(cliPath)) {
        cliPath = "./node_modules/@truefoundry/trueforge/dist/cli.js";
      }

      // Spawn TrueForge server in background
      tfProcess = spawn("node", [cliPath, "--port", String(tfPort)], {
        stdio: "ignore",
      });

      // Poll until server is ready
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 250));
        try {
          await client.server.getCapabilities();
          break;
        } catch {}
      }
    }
  });

  after(() => {
    if (tfProcess) {
      try {
        tfProcess.kill();
      } catch {}
    }
  });

  it("should execute smoke test against configured real provider when REAL_PROVIDER_TEST=true", async (t) => {
    if (!isRealProviderTest) {
      t.skip(
        "Skipping Real Provider Smoke Test because REAL_PROVIDER_TEST is not set to 'true'. This test is opt-in to prevent unintentional API usage/costs."
      );
      return;
    }

    let providerConfig;
    try {
      providerConfig = resolveModelProviderConfig({
        requireCredentials: true,
      });
    } catch (err: any) {
      throw new Error(
        `[Real Provider Smoke Test Blocker] Cannot run real provider smoke test without credentials: ${err?.message}`
      );
    }

    console.log(`[Real Provider Smoke Test] Running with Provider: ${formatProviderLabel(providerConfig)}`);

    // 1. Verify TrueForge server is online
    const capabilities = await client.server.getCapabilities();
    assert.ok(capabilities, "TrueForge server must respond with tenant capabilities");

    // 2. Start DebugForge real MCP server
    const { url: mcpUrl, close: closeMcp } = await startMCPServer(3106);

    try {
      // 3. Register provider manifest in TrueForge
      const providerManifest = buildTrueForgeProviderManifest(providerConfig);
      await client.settings.modelProviders.createOrUpdate(providerManifest);

      // 4. Register DebugForge MCP Server in TrueForge
      await client.settings.mcpServers.createOrUpdate({
        manifest: {
          name: "debugforge",
          type: "remote",
          url: mcpUrl,
          description: "DebugForge Autonomous Debugging MCP Server",
        },
      });

      // 5. Provision agent configured with selected provider and model
      const agentName = `debugforge-smoke-${providerConfig.provider}`;
      const agentRes = await client.agents.create({
        name: agentName,
        manifest: {
          model: { name: providerConfig.fullModelName },
          instructions: "You are DebugForge. For any error diagnosis, invoke debugforge_ingest_error tool.",
          mcpServers: [{ name: "debugforge" }],
        },
      }).catch(async () => {
        const list = await client.agents.list();
        return { data: list.data?.find((a: any) => a.name === agentName) };
      });

      assert.ok(agentRes.data?.id, "Agent must be registered with TrueForge");

      // 6. Create session and run a single turn stream with the real model provider
      const session = await client.sessions.create({
        agent: { name: agentName },
      });
      assert.ok(session.data?.id, "Real session must be created on TrueForge");

      const stream = await client.sessions.createTurnStream(session.data!.id, {
        input: [
          {
            type: "user.message",
            content: "Diagnose error: TypeError: Cannot read properties of undefined (reading 'id') at src/index.js:10:5",
          },
        ],
      });

      let turnCompleted = false;
      for await (const event of stream) {
        if (event.type === "turn.done") {
          turnCompleted = true;
          break;
        }
      }

      assert.ok(turnCompleted, "Turn stream must successfully complete with real provider");
      console.log(`[Real Provider Smoke Test] Successfully verified ${formatProviderLabel(providerConfig)}`);
    } finally {
      await closeMcp();
    }
  });
});
