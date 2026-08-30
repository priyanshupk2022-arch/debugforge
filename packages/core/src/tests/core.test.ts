import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ingestError } from "../tools/ingest-error.js";
import { trueforgeMCPServer } from "../mcp/server.js";
import { hitlGatekeeper } from "../hitl/approval.js";
import { routeModel } from "../agent/router.js";
import {
  resolveModelProviderConfig,
  buildTrueForgeProviderManifest,
  formatProviderLabel,
} from "../agent/provider.js";
import { applyPatch } from "../tools/auto-patch.js";
import { PatchResult } from "../types.js";

describe("DebugForge Core Engine Suite", () => {
  it("should correctly ingest and classify null dereference errors", () => {
    const sampleLog = `TypeError: Cannot read properties of undefined (reading 'id')
    at orderService.processOrder (/app/src/services/order-service.ts:32:20)
    at /app/src/index.ts:15:10`;

    const report = ingestError(sampleLog);
    assert.strictEqual(report.errorType, "TypeError");
    assert.strictEqual(report.category, "null_dereference");
    assert.strictEqual(report.crashSite.line, 32);
    assert.ok(report.crashSite.file.includes("order-service.ts"));
  });

  it("should register TrueForge MCP tools", () => {
    const tools = trueforgeMCPServer.listTools();
    assert.ok(tools.length >= 5);
    const names = tools.map((t: { name: string }) => t.name);
    assert.ok(names.includes("debugforge_ingest_error"));
    assert.ok(names.includes("debugforge_reproduce_in_sandbox"));
    assert.ok(names.includes("debugforge_trace_and_analyze"));
    assert.ok(names.includes("debugforge_auto_patch"));
    assert.ok(names.includes("debugforge_verify_fix"));
  });

  it("should generate and evaluate HITL approval requests", () => {
    const fakePatch: PatchResult = {
      id: "patch_test_123",
      errorId: "err_test_456",
      patches: [],
      summary: "Test patch",
      synthesizedAt: Date.now(),
    };

    const req = hitlGatekeeper.createApprovalRequest(fakePatch);
    assert.ok(req.nonce.length > 0);

    const decision = hitlGatekeeper.evaluateDecision(req.nonce, "approved", { feedback: "Good fix" });
    assert.strictEqual(decision.status, "approved");
    assert.strictEqual(decision.patchId, "patch_test_123");
  });

  it("should resolve provider configurations dynamically across Anthropic, Google, OpenAI, and Custom", () => {
    // Anthropic Resolution
    const anthropicConfig = resolveModelProviderConfig({
      provider: "anthropic",
      model: "claude-3-5-sonnet-latest",
      apiKey: "test-anthropic-key",
    });
    assert.strictEqual(anthropicConfig.provider, "anthropic");
    assert.strictEqual(anthropicConfig.fullModelName, "anthropic/claude-3-5-sonnet-latest");
    assert.strictEqual(formatProviderLabel(anthropicConfig), "Anthropic (claude-3-5-sonnet-latest)");

    const anthropicManifest = buildTrueForgeProviderManifest(anthropicConfig);
    assert.strictEqual(anthropicManifest.manifest.type, "anthropic");
    assert.strictEqual(anthropicManifest.manifest.auth.apiKey, "test-anthropic-key");

    // Google Gemini Resolution
    const googleConfig = resolveModelProviderConfig({
      provider: "google",
      model: "gemini-2.0-flash",
      apiKey: "test-google-key",
    });
    assert.strictEqual(googleConfig.provider, "google-gemini");
    assert.strictEqual(googleConfig.fullModelName, "google-gemini/gemini-2.0-flash");
    assert.strictEqual(formatProviderLabel(googleConfig), "Google (gemini-2.0-flash)");

    const googleManifest = buildTrueForgeProviderManifest(googleConfig);
    assert.strictEqual(googleManifest.manifest.type, "google-gemini");

    // OpenAI Resolution
    const openaiConfig = resolveModelProviderConfig({
      provider: "openai",
      model: "gpt-4o",
      apiKey: "test-openai-key",
    });
    assert.strictEqual(openaiConfig.provider, "openai");
    assert.strictEqual(openaiConfig.fullModelName, "openai/gpt-4o");

    // Custom / DeepSeek Resolution
    const customConfig = resolveModelProviderConfig({
      provider: "deepseek",
      model: "deepseek-chat",
      apiKey: "test-deepseek-key",
      baseUrl: "https://api.deepseek.com/v1",
    });
    assert.strictEqual(customConfig.provider, "custom");
    assert.strictEqual(customConfig.fullModelName, "custom/deepseek-chat");
    const customManifest = buildTrueForgeProviderManifest(customConfig);
    assert.strictEqual(customManifest.manifest.baseUrl, "https://api.deepseek.com/v1");

    // Together AI Resolution (type: "together")
    const togetherConfig = resolveModelProviderConfig({
      provider: "together-ai",
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      apiKey: "test-together-key",
    });
    assert.strictEqual(togetherConfig.provider, "together");
    const togetherManifest = buildTrueForgeProviderManifest(togetherConfig);
    assert.strictEqual(togetherManifest.manifest.type, "together");

    // Fireworks Resolution (type: "fireworks")
    const fireworksConfig = resolveModelProviderConfig({
      provider: "fireworks",
      apiKey: "test-fireworks-key",
    });
    assert.strictEqual(fireworksConfig.provider, "fireworks");
    const fireworksManifest = buildTrueForgeProviderManifest(fireworksConfig);
    assert.strictEqual(fireworksManifest.manifest.type, "fireworks");

    // Alibaba Resolution (type: "alibaba")
    const alibabaConfig = resolveModelProviderConfig({
      provider: "alibaba",
      apiKey: "test-alibaba-key",
    });
    assert.strictEqual(alibabaConfig.provider, "alibaba");
    const alibabaManifest = buildTrueForgeProviderManifest(alibabaConfig);
    assert.strictEqual(alibabaManifest.manifest.type, "alibaba");

    // Moonshot Resolution (type: "moonshot")
    const moonshotConfig = resolveModelProviderConfig({
      provider: "moonshot",
      apiKey: "test-moonshot-key",
    });
    assert.strictEqual(moonshotConfig.provider, "moonshot");
    const moonshotManifest = buildTrueForgeProviderManifest(moonshotConfig);
    assert.strictEqual(moonshotManifest.manifest.type, "moonshot");

    // Zai Resolution (type: "zai")
    const zaiConfig = resolveModelProviderConfig({
      provider: "zai",
      apiKey: "test-zai-key",
    });
    assert.strictEqual(zaiConfig.provider, "zai");
    const zaiManifest = buildTrueForgeProviderManifest(zaiConfig);
    assert.strictEqual(zaiManifest.manifest.type, "zai");

    // Case & whitespace trimming tests
    assert.strictEqual(resolveModelProviderConfig({ provider: " GOOGLE " }).provider, "google-gemini");
    assert.strictEqual(resolveModelProviderConfig({ provider: "Claude" }).provider, "anthropic");
    assert.strictEqual(resolveModelProviderConfig({ provider: "GEMINI" }).provider, "google-gemini");
    assert.strictEqual(resolveModelProviderConfig({ provider: "qwen" }).provider, "alibaba");
    assert.strictEqual(resolveModelProviderConfig({ provider: "ollama" }).provider, "custom");
    assert.strictEqual(resolveModelProviderConfig({ provider: "local" }).provider, "custom");

    // Default behavior when omitted
    assert.strictEqual(resolveModelProviderConfig({}).provider, "openai");
    assert.strictEqual(resolveModelProviderConfig({ provider: undefined }).provider, "openai");
  });

  it("should validate supported provider types accurately via isSupportedProviderType", async () => {
    const { isSupportedProviderType } = await import("../agent/provider.js");
    // Valid providers and aliases
    assert.strictEqual(isSupportedProviderType("openai"), true);
    assert.strictEqual(isSupportedProviderType("gpt"), true);
    assert.strictEqual(isSupportedProviderType("google"), true);
    assert.strictEqual(isSupportedProviderType("gemini"), true);
    assert.strictEqual(isSupportedProviderType("google-gemini"), true);
    assert.strictEqual(isSupportedProviderType("anthropic"), true);
    assert.strictEqual(isSupportedProviderType("claude"), true);
    assert.strictEqual(isSupportedProviderType("together"), true);
    assert.strictEqual(isSupportedProviderType("together-ai"), true);
    assert.strictEqual(isSupportedProviderType("fireworks"), true);
    assert.strictEqual(isSupportedProviderType("alibaba"), true);
    assert.strictEqual(isSupportedProviderType("qwen"), true);
    assert.strictEqual(isSupportedProviderType("moonshot"), true);
    assert.strictEqual(isSupportedProviderType("zai"), true);
    assert.strictEqual(isSupportedProviderType("custom"), true);
    assert.strictEqual(isSupportedProviderType("deepseek"), true);
    assert.strictEqual(isSupportedProviderType("ollama"), true);
    assert.strictEqual(isSupportedProviderType("local"), true);

    // Invalid providers MUST return false
    assert.strictEqual(isSupportedProviderType("foobar"), false);
    assert.strictEqual(isSupportedProviderType("unknown"), false);
    assert.strictEqual(isSupportedProviderType("random-vendor"), false);
    assert.strictEqual(isSupportedProviderType("openrouter-invalid-format"), false);
    assert.strictEqual(isSupportedProviderType("xai-invalid-format"), false);
    assert.strictEqual(isSupportedProviderType("totally-invalid-provider"), false);
    assert.strictEqual(isSupportedProviderType(""), false);
  });

  it("REGRESSION: should fail closed and THROW on invalid provider names rather than silently defaulting to openai", async () => {
    const { normalizeProviderName } = await import("../agent/provider.js");

    const invalidInputs = [
      "totally-invalid-provider",
      "foobar",
      "unknown",
      "random-vendor",
      "openrouter-invalid-format",
      "xai-invalid-format",
      " invalid-vendor ",
    ];

    for (const invalid of invalidInputs) {
      assert.throws(
        () => {
          normalizeProviderName(invalid);
        },
        /\[TrueForge Provider Blocker\] Unsupported provider type/,
        `normalizeProviderName("${invalid}") must throw [TrueForge Provider Blocker]`
      );

      assert.throws(
        () => {
          resolveModelProviderConfig({ provider: invalid });
        },
        /\[TrueForge Provider Blocker\] Unsupported provider type/,
        `resolveModelProviderConfig({ provider: "${invalid}" }) must throw rather than produce openai`
      );
    }
  });

  it("should route models adaptively across providers based on task complexity", () => {
    // Anthropic routing
    const anthropicRca = routeModel("rca", "anthropic");
    assert.strictEqual(anthropicRca.provider, "anthropic");
    assert.strictEqual(anthropicRca.modelName, "claude-3-5-sonnet-latest");

    const anthropicFast = routeModel("verify", "anthropic");
    assert.strictEqual(anthropicFast.provider, "anthropic");
    assert.strictEqual(anthropicFast.modelName, "claude-3-5-haiku-latest");

    // Google routing
    const googleRca = routeModel("rca", "google");
    assert.strictEqual(googleRca.provider, "google-gemini");
    assert.strictEqual(googleRca.modelName, "gemini-2.0-flash");

    const googleFast = routeModel("triage", "google");
    assert.strictEqual(googleFast.provider, "google-gemini");
    assert.strictEqual(googleFast.modelName, "gemini-1.5-flash");
  });

  it("should fail closed when live mode requires credentials for selected provider", () => {
    assert.throws(
      () => {
        resolveModelProviderConfig({
          provider: "anthropic",
          requireCredentials: true,
        });
      },
      /\[Model Provider Blocker\] Missing required API key for provider "anthropic"/
    );
  });

  it("should execute actual patch application on disk via applyPatch", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "debugforge-patch-test-"));

    try {
      const targetFile = "src/services/user-service.ts";
      const initialCode = "export function findUser() { return null; }";
      const patchedCode = "export function findUser() { return { id: 1, name: 'Patched' }; }";

      const testPatch: PatchResult = {
        id: "patch_disk_test_01",
        errorId: "err_disk_01",
        patches: [
          {
            filePath: targetFile,
            originalCode: initialCode,
            patchedCode: patchedCode,
            diffHunk: "@@ -1,1 +1,1 @@\n-export function findUser() { return null; }\n+export function findUser() { return { id: 1, name: 'Patched' }; }",
            purpose: "Fix user lookup return value",
          },
        ],
        summary: "Apply valid user object return",
        synthesizedAt: Date.now(),
      };

      // Apply patch to temp directory
      await applyPatch(testPatch, tempDir);

      // Verify file was written
      const readContent = await fs.readFile(path.join(tempDir, targetFile), "utf-8");
      assert.strictEqual(readContent, patchedCode, "Patched file content must match on disk");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
