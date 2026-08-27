import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import * as fs from 'fs';
import {
  VulnerabilityHunter,
  BlueAgentImmunizer,
  ImmunizationVerifier,
  HITLGatekeeper,
  SandboxFactory,
  RedAgentArena,
} from '../../packages/core/dist/src/index.js';

describe('ZeroShield Machine-Verifiable Sandbox E2E Verification Chain', () => {
  it('should execute full chain exclusively inside isolated sandbox: spawn -> exploit -> AVO patch -> apply to sandbox -> restart -> triple-lock verify -> exit 0', async () => {
    const fixtureDir = path.resolve(process.cwd(), 'fixtures/vulnerable-payment-app');
    const port = 3998;

    // STEP 1: AST Scan target
    const hunter = new VulnerabilityHunter();
    const reports = hunter.scanDirectory(fixtureDir);
    assert.equal(reports.length >= 1, true);
    const vuln = reports[0];
    assert.equal(vuln.category, 'COMMAND_INJECTION');

    // STEP 2: Spawn Real Sandbox Instance
    const sandbox = await SandboxFactory.createSandbox({
      sourceDir: fixtureDir,
      port,
      forceLocal: true,
    });
    assert.notEqual(sandbox.id, '');
    assert.ok(fs.existsSync(sandbox.workDir));

    try {
      // STEP 3: Start Target Exclusively Inside Sandbox
      await sandbox.startService('src/server.ts');
      const isListening = await sandbox.waitForPortReady(5000);
      assert.equal(isListening, true);

      // STEP 4: Run Red Exploit Against Sandbox Service
      const arena = new RedAgentArena();
      const exploitResult = await arena.executeExploitInSandbox(vuln, sandbox);
      assert.equal(exploitResult.exploitConfirmed, true);
      assert.equal(exploitResult.statusCode, 200);

      // STEP 5: Synthesize AST Blue Patch
      const immunizer = new BlueAgentImmunizer();
      const originalSource = await sandbox.readFile('src/routes/report.ts');
      const candidatePatch = immunizer.synthesizePatch(vuln, originalSource);
      assert.equal(candidatePatch.status, 'CANDIDATE');

      // STEP 6: Execute Triple-Lock Verification Inside Sandbox
      const verifier = new ImmunizationVerifier();
      const verifiedPatch = await verifier.verifyPatchInSandbox(vuln, candidatePatch, sandbox);

      // STEP 7: Assert Machine Evidence of Full Chain
      assert.equal(verifiedPatch.status, 'IMMUNIZED');
      assert.equal(verifiedPatch.resultingCvssScore, 0.0);
      assert.equal(verifiedPatch.immunizationResults.exploitBlocked, true);
      assert.equal(verifiedPatch.immunizationResults.goldenInputsPreserved, true);
      assert.equal(verifiedPatch.immunizationResults.unitTestsPassed, true);
      assert.equal(verifiedPatch.immunizationResults.testSuiteExitCode, 0);

      // STEP 8: Cryptographic HITL Review Card Binding
      const gatekeeper = new HITLGatekeeper('production-machine-verified-secret-key-123');
      const reviewCard = gatekeeper.generateReviewCard(vuln, verifiedPatch);
      assert.equal(
        gatekeeper.verifyApproval(
          verifiedPatch.id,
          verifiedPatch.patchDigest,
          reviewCard.approvalToken,
          reviewCard.expiresAt
        ),
        true
      );
    } finally {
      // STEP 9: Teardown Sandbox
      await sandbox.destroy();
    }
  });
});
