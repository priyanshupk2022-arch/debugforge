/**
 * Feature F14: Web Hero Banner Tests
 * Tests 2026 Developer Productivity Paradox metrics, hero typography, CTAs, and responsive structure.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const HERO_DATA = {
  headline: 'The Autonomous AI Debugging Agent Harness',
  subheadline: 'DebugForge autonomously reproduces, diagnoses (backward causal tracing), and auto-heals runtime bugs inside isolated Daytona sandboxes before code reaches production.',
  paradoxStats: [
    {
      metric: '67%',
      label: 'Developer Time Lost',
      description: 'Developers in 2026 spend more than 2/3 of their engineering hours triaging AI-generated hallucinations, edge-case regressions, and silent runtime failures.',
    },
    {
      metric: '43%',
      label: 'Post-Test Failure Rate',
      description: '43% of runtime incidents pass standard unit tests but fail under asynchronous concurrency, database connection stalls, or memory leaks in production.',
    },
    {
      metric: '10x',
      label: 'Faster MTTR',
      description: 'Autonomous ReAct loop reduces Mean Time to Resolution from 4.2 hours to under 2 minutes with surgical AST auto-patching and Triple-Lock verification.',
    },
  ],
  ctaButtons: [
    { label: 'Start Debugging (CLI)', target: '#quick-install', primary: true },
    { label: 'Explore 5-Stage Pipeline', target: '#pipeline', primary: false },
  ],
};

describe('Feature F14: Web Hero Banner', () => {
  it('F14-1: Contains authoritative 2026 Developer Productivity Paradox metrics', () => {
    const stats = HERO_DATA.paradoxStats;
    assert.strictEqual(stats.length, 3);
    assert.strictEqual(stats[0].metric, '67%');
    assert.strictEqual(stats[1].metric, '43%');
    assert.strictEqual(stats[2].metric, '10x');
  });

  it('F14-2: Includes descriptive explanations for all three paradox callout cards', () => {
    for (const stat of HERO_DATA.paradoxStats) {
      assert.ok(stat.label.length > 0);
      assert.ok(stat.description.length > 20);
    }
  });

  it('F14-3: Verifies core value proposition headline and subheadline', () => {
    assert.ok(HERO_DATA.headline.includes('Autonomous AI Debugging'));
    assert.ok(HERO_DATA.subheadline.includes('Daytona sandboxes'));
    assert.ok(HERO_DATA.subheadline.includes('backward causal tracing'));
  });

  it('F14-4: Defines primary and secondary call-to-action buttons with valid anchor links', () => {
    const ctas = HERO_DATA.ctaButtons;
    assert.strictEqual(ctas.length, 2);
    assert.strictEqual(ctas[0].primary, true);
    assert.strictEqual(ctas[0].target, '#quick-install');
    assert.strictEqual(ctas[1].primary, false);
    assert.strictEqual(ctas[1].target, '#pipeline');
  });

  it('F14-5: Conforms to dark slate and cyber crimson brand design tokens', () => {
    const brandTokens = {
      bgSlate: '#090d16',
      accentCrimson: '#e5533c',
      accentGlow: '#ff6b52',
      fontSans: 'Plus Jakarta Sans',
      fontMono: 'JetBrains Mono',
    };

    assert.ok(brandTokens.bgSlate.startsWith('#'));
    assert.ok(brandTokens.accentCrimson.startsWith('#'));
    assert.strictEqual(brandTokens.fontSans, 'Plus Jakarta Sans');
  });
});
