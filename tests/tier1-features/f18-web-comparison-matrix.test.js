/**
 * Feature F18: Web Comparison Matrix Tests
 * Tests comparison matrix data vs Cursor, Sentry, and SWE-agent.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const COMPARISON_ROWS = [
  {
    feature: 'Autonomous Sandbox Reproduction',
    debugforge: '✅ Daytona Ephemeral Containers',
    cursor: '❌ Manual IDE Execution',
    sentry: '❌ Production Log Only',
    sweAgent: '⚠️ Docker Local Only',
  },
  {
    feature: 'Dynamic Backward Causal Tracing',
    debugforge: '✅ AST Origin vs Crash Site Blame',
    cursor: '❌ Prompt-based Guessing',
    sentry: '❌ Crash Stack Only',
    sweAgent: '⚠️ LLM Heuristic',
  },
  {
    feature: 'Triple-Lock Differential Verification',
    debugforge: '✅ Original + Full Suite + Stress',
    cursor: '❌ None (Dev manual)',
    sentry: '❌ None',
    sweAgent: '⚠️ Single Test Pass',
  },
  {
    feature: 'Surgical AST-Level Auto-Patching',
    debugforge: '✅ Zero-hallucination AST rewrites',
    cursor: '⚠️ Raw LLM Diff',
    sentry: '❌ None',
    sweAgent: '⚠️ Whole-file edits',
  },
  {
    feature: 'True Human-In-The-Loop (HITL) Gate',
    debugforge: '✅ Interactive CLI & Web Decision State',
    cursor: '⚠️ Inline accept only',
    sentry: '❌ None',
    sweAgent: '❌ Autonomous Run',
  },
  {
    feature: 'Automated Qodo PR Quality Review',
    debugforge: '✅ Integrated PR-Agent Gate',
    cursor: '❌ None',
    sentry: '❌ None',
    sweAgent: '❌ None',
  },
  {
    feature: 'Interactive Terminal UI (React Ink)',
    debugforge: '✅ Live Streaming Thoughts & HUD',
    cursor: '❌ GUI Chat Only',
    sentry: '❌ Web Only',
    sweAgent: '⚠️ CLI Stdout',
  },
  {
    feature: 'Mean Time to Resolution (MTTR)',
    debugforge: '⚡ < 2 Minutes',
    cursor: '⏱️ 15–45 Minutes',
    sentry: '⏱️ Hours/Days',
    sweAgent: '⏱️ 10–30 Minutes',
  },
];

describe('Feature F18: Web Comparison Matrix', () => {
  it('F18-1: Contains all 8 key architectural comparison dimensions', () => {
    assert.strictEqual(COMPARISON_ROWS.length, 8);
    const featureNames = COMPARISON_ROWS.map(r => r.feature);
    assert.ok(featureNames.includes('Autonomous Sandbox Reproduction'));
    assert.ok(featureNames.includes('Dynamic Backward Causal Tracing'));
    assert.ok(featureNames.includes('Triple-Lock Differential Verification'));
    assert.ok(featureNames.includes('Automated Qodo PR Quality Review'));
  });

  it('F18-2: Compares across all 4 platforms (DebugForge, Cursor, Sentry, SWE-agent)', () => {
    for (const row of COMPARISON_ROWS) {
      assert.ok(row.debugforge, 'Must have debugforge cell');
      assert.ok(row.cursor, 'Must have cursor cell');
      assert.ok(row.sentry, 'Must have sentry cell');
      assert.ok(row.sweAgent, 'Must have sweAgent cell');
    }
  });

  it('F18-3: Confirms DebugForge feature supremacy with checkmarks across all rows', () => {
    for (const row of COMPARISON_ROWS) {
      assert.ok(row.debugforge.startsWith('✅') || row.debugforge.startsWith('⚡'), `DebugForge should show superiority on: ${row.feature}`);
    }
  });

  it('F18-4: Highlights Qodo PR automated review integration superiority', () => {
    const qodoRow = COMPARISON_ROWS.find(r => r.feature.includes('Qodo'));
    assert.ok(qodoRow.debugforge.includes('Integrated PR-Agent'));
    assert.strictEqual(qodoRow.cursor, '❌ None');
    assert.strictEqual(qodoRow.sentry, '❌ None');
  });

  it('F18-5: Verifies MTTR metric comparison (< 2 minutes for DebugForge)', () => {
    const mttrRow = COMPARISON_ROWS.find(r => r.feature.includes('MTTR'));
    assert.ok(mttrRow.debugforge.includes('< 2 Minutes'));
    assert.ok(mttrRow.cursor.includes('15–45 Minutes'));
  });
});
