import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import * as fs from 'fs';
import {
  VulnerabilityHunter,
  BlueAgentImmunizer,
  ImmunizationVerifier,
  HITLGatekeeper,
} from '../../packages/core/dist/src/index.js';

describe('ZeroShield End-to-End Autonomous Pipeline', () => {
  it('should run full scan -> red proof -> blue AVO patch -> triple-lock verify -> HITL card on vulnerable fixture', async () => {
    const fixtureDir = path.resolve(process.cwd(), 'fixtures/vulnerable-payment-app');

    // 1. Static Scan
    const hunter = new VulnerabilityHunter();
    const reports = hunter.scanDirectory(fixtureDir);

    assert.equal(reports.length >= 1, true);
    const vuln = reports[0];
    assert.equal(vuln.category, 'COMMAND_INJECTION');
    assert.equal(vuln.cvssBaseScore, 9.8);

    // 2. Blue Agent Patch Generation
    const immunizer = new BlueAgentImmunizer();
    const originalCode = fs.readFileSync(vuln.vulnerableFilePath, 'utf8');
    const patch = immunizer.synthesizePatch(vuln, originalCode);

    assert.equal(patch.status, 'CANDIDATE');
    assert.match(patch.patchedCodeSnippet, /execFile/);
    assert.match(patch.patchDigest, /^[a-f0-9]{64}$/);

    // 3. Triple-Lock Verification
    const verifier = new ImmunizationVerifier({ sandboxDir: fixtureDir });
    const verifiedPatch = await verifier.verifyPatch(vuln, patch);

    assert.equal(verifiedPatch.status, 'IMMUNIZED');
    assert.equal(verifiedPatch.resultingCvssScore, 0.0);

    // 4. HITL Approval Card
    const gatekeeper = new HITLGatekeeper('production-test-e2e-secret-key-123');
    const reviewCard = gatekeeper.generateReviewCard(vuln, verifiedPatch);

    assert.equal(reviewCard.scoreDrop, 9.8);
    assert.equal(
      gatekeeper.verifyApproval(
        verifiedPatch.id,
        verifiedPatch.patchDigest,
        reviewCard.approvalToken,
        reviewCard.expiresAt
      ),
      true
    );
  });
});
