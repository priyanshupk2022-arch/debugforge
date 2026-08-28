import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ZeroShieldOrchestrator } from '../src/orchestrator/engine.js';

describe('ZeroShieldOrchestrator (Multi-Agent State Machine & Supervisor)', () => {
  it('should initialize orchestrator with supervisor and handle clean target gracefully', async () => {
    const orchestrator = new ZeroShieldOrchestrator();
    assert.ok(orchestrator.getSupervisor());

    const eventsCaptured: string[] = [];
    orchestrator.on('PIPELINE_STARTED', () => eventsCaptured.push('PIPELINE_STARTED'));
    orchestrator.on('HUNT_STARTED', () => eventsCaptured.push('HUNT_STARTED'));
    orchestrator.on('HUNT_COMPLETED', () => eventsCaptured.push('HUNT_COMPLETED'));

    // Create a clean temporary directory with safe non-vulnerable code
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-clean-'));
    fs.writeFileSync(path.join(tmpDir, 'index.ts'), 'export const greeting = "hello world";\n');

    const result = await orchestrator.runPipeline({
      targetDir: tmpDir,
    });

    assert.ok(result.sessionId.startsWith('zeroshield_'));
    assert.equal(result.vulnerabilitiesFound.length, 0);
    assert.equal(result.verifiedPatches.length, 0);
    assert.ok(eventsCaptured.includes('PIPELINE_STARTED'));
    assert.ok(eventsCaptured.includes('HUNT_STARTED'));
    assert.ok(eventsCaptured.includes('HUNT_COMPLETED'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should run full multi-agent pipeline on vulnerable fixture and achieve immunization', async () => {
    const orchestrator = new ZeroShieldOrchestrator();
    const fixtureDir = path.resolve('fixtures/vulnerable-payment-app');

    const events: string[] = [];
    orchestrator.on('HUNT_COMPLETED', (data) => events.push(`HUNT_${data.totalSinks}`));
    orchestrator.on('RED_EXPLOIT_CONFIRMED', () => events.push('EXPLOIT_CONFIRMED'));
    orchestrator.on('TRIPLE_LOCK_PASSED', () => events.push('TRIPLE_LOCK_PASSED'));
    orchestrator.on('HITL_CARD_ISSUED', () => events.push('HITL_ISSUED'));

    const result = await orchestrator.runPipeline({
      targetDir: fixtureDir,
      forceLocalSandbox: true,
      sandboxPort: 3995,
      hitlSecret: 'production-verified-secret-key-12345',
    });

    assert.equal(result.vulnerabilitiesFound.length, 1);
    assert.equal(result.verifiedPatches.length, 1);
    assert.equal(result.verifiedPatches[0].status, 'IMMUNIZED');
    assert.equal(result.verifiedPatches[0].resultingCvssScore, 0.0);
    assert.equal(result.hitlReviewCards.length, 1);
    assert.ok(events.includes('EXPLOIT_CONFIRMED'));
    assert.ok(events.includes('TRIPLE_LOCK_PASSED'));
    assert.ok(events.includes('HITL_ISSUED'));
  });
});
