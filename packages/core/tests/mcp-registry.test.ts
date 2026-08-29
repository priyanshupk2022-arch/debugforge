import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { MCPToolRegistry } from '../src/tools/registry.js';

describe('MCPToolRegistry', () => {
  const registry = new MCPToolRegistry();

  test('registers all 5 required TrueForge MCP debug tools', () => {
    const allTools = registry.getAllTools();
    const toolNames = allTools.map((t) => t.name);

    assert.ok(toolNames.includes('ingest_error'));
    assert.ok(toolNames.includes('reproduce_in_sandbox'));
    assert.ok(toolNames.includes('trace_and_analyze'));
    assert.ok(toolNames.includes('auto_patch_and_verify'));
    assert.ok(toolNames.includes('hitl_approval'));
    assert.equal(toolNames.length, 5);
  });

  test('executes registered tool directly', async () => {
    const parsed = await registry.executeTool('ingest_error', {
      rawLog: 'TypeError: Cannot read properties of undefined',
    });

    assert.equal(parsed.errorType, 'TypeError');
  });

  test('throws error on unknown tool name', async () => {
    await assert.rejects(
      () => registry.executeTool('unknown_tool', {}),
      /not found in TrueForge registry/
    );
  });
});
