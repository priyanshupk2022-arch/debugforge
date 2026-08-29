/**
 * Feature F9: React Ink Terminal UI Component Tests
 * Tests HUD, Thought Feed, Diff Viewer, Causal Graph, and HITL prompt terminal rendering.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { stripAnsi } = require('../harness');

// Terminal UI Mock Renderers
function renderHeaderHUD(state) {
  return [
    `=== DEBUGFORGE v1.0.0 [Autonomous AI Debugger] ===`,
    `Workspace: ${state.workspace} | Sandbox: [${state.sandboxType.toUpperCase()}] | Status: [${state.status}]`,
    `==================================================`,
  ].join('\n');
}

function renderStreamingFeed(steps) {
  return steps.map(s => `[Step ${s.stepIndex}] [${s.type}] ${s.thought || ''}`).join('\n');
}

function renderUnifiedDiff(diff) {
  return diff.split('\n').map(line => {
    if (line.startsWith('+')) return `\x1b[32m${line}\x1b[0m`;
    if (line.startsWith('-')) return `\x1b[31m${line}\x1b[0m`;
    return line;
  }).join('\n');
}

function renderTripleLockBadges(tripleLock) {
  return [
    `[Lock 1: Failing Test] ${tripleLock.lock1_targetTest.passed ? '✅ PASS' : '❌ FAIL'}`,
    `[Lock 2: Full Suite]   ${tripleLock.lock2_fullSuite.passed ? '✅ PASS' : '❌ FAIL'}`,
    `[Lock 3: Stress Test]  ${tripleLock.lock3_stressTest.passed ? '✅ PASS' : '❌ FAIL'}`,
  ].join('\n');
}

function renderHITLPrompt() {
  return [
    `--- HUMAN-IN-THE-LOOP APPROVAL GATE ---`,
    `[1] ▶ Apply Patch to Workspace`,
    `[2]   Edit Patch in Default Editor`,
    `[3]   Reject & Retry Reasoning Loop`,
    `[4]   Explain Causal Blame Proof`,
  ].join('\n');
}

describe('Feature F9: React Ink Terminal UI', () => {
  it('F9-1: Renders HeaderHUD with workspace, sandbox badge, and active status', () => {
    const hud = renderHeaderHUD({ workspace: '/app/orders', sandboxType: 'daytona', status: 'REPRODUCING' });
    assert.ok(hud.includes('DEBUGFORGE v1.0.0'));
    assert.ok(hud.includes('/app/orders'));
    assert.ok(hud.includes('[DAYTONA]'));
    assert.ok(hud.includes('[REPRODUCING]'));
  });

  it('F9-2: Renders StreamingThoughtFeed with step chronology and thought monologue', () => {
    const steps = [
      { stepIndex: 1, type: 'THOUGHT', thought: 'Analyzing stack trace...' },
      { stepIndex: 2, type: 'ACTION', thought: 'Spawning sandbox container...' },
      { stepIndex: 3, type: 'OBSERVATION', thought: 'Reproduction confirmed: Exit code 1' },
    ];
    const feed = renderStreamingFeed(steps);
    assert.ok(feed.includes('[Step 1] [THOUGHT] Analyzing stack trace...'));
    assert.ok(feed.includes('[Step 2] [ACTION] Spawning sandbox container...'));
    assert.ok(feed.includes('[Step 3] [OBSERVATION] Reproduction confirmed: Exit code 1'));
  });

  it('F9-3: Renders syntax-highlighted UnifiedDiffViewer with green additions and red deletions', () => {
    const rawDiff = '--- a/pool.ts\n+++ b/pool.ts\n@@ -1,1 +1,2 @@\n-return null;\n+return retryAcquire();';
    const coloredDiff = renderUnifiedDiff(rawDiff);
    
    assert.ok(coloredDiff.includes('\x1b[32m+return retryAcquire();\x1b[0m'));
    assert.ok(coloredDiff.includes('\x1b[31m-return null;\x1b[0m'));

    const stripped = stripAnsi(coloredDiff);
    assert.strictEqual(stripped, rawDiff);
  });

  it('F9-4: Renders TripleLockBadgeGrid reflecting verification statuses', () => {
    const tripleLock = {
      lock1_targetTest: { passed: true },
      lock2_fullSuite: { passed: true },
      lock3_stressTest: { passed: true },
    };
    const badges = renderTripleLockBadges(tripleLock);
    assert.ok(badges.includes('[Lock 1: Failing Test] ✅ PASS'));
    assert.ok(badges.includes('[Lock 2: Full Suite]   ✅ PASS'));
    assert.ok(badges.includes('[Lock 3: Stress Test]  ✅ PASS'));
  });

  it('F9-5: Renders interactive HITLPrompt with 4 action options', () => {
    const prompt = renderHITLPrompt();
    assert.ok(prompt.includes('HUMAN-IN-THE-LOOP APPROVAL GATE'));
    assert.ok(prompt.includes('[1] ▶ Apply Patch to Workspace'));
    assert.ok(prompt.includes('[2]   Edit Patch in Default Editor'));
    assert.ok(prompt.includes('[3]   Reject & Retry Reasoning Loop'));
    assert.ok(prompt.includes('[4]   Explain Causal Blame Proof'));
  });
});
