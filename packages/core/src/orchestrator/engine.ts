import { EventEmitter } from 'events';
import * as path from 'path';
import { VulnerabilityHunter } from '../hunter/scanner.js';
import { RedAgentArena } from '../redteam/exploit.js';
import { BlueAgentImmunizer } from '../blueteam/patcher.js';
import { ImmunizationVerifier } from '../verifier/assert.js';
import { SecuritySupervisor } from '../supervisor/detector.js';
import { HITLGatekeeper, HITLReviewCard } from '../hitl/gatekeeper.js';
import { GitHubIntegrationClient, PullRequestResult } from '../github/client.js';
import { SandboxFactory, findProjectRoot } from '../sandbox/lifecycle.js';
import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';
import { ExecutiveReportGenerator, ImmunizationAuditReport } from '../reporting/generator.js';

export interface OrchestratorRunOptions {
  targetDir: string;
  sandboxPort?: number;
  forceLocalSandbox?: boolean;
  forceDockerSandbox?: boolean;
  hitlSecret?: string;
  autoApprove?: boolean;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
}

export interface OrchestrationResult {
  sessionId: string;
  targetDir: string;
  vulnerabilitiesFound: VulnerabilityReport[];
  verifiedPatches: SecurityPatchNode[];
  hitlReviewCards: HITLReviewCard[];
  pullRequests: PullRequestResult[];
  auditReport: ImmunizationAuditReport;
  durationMs: number;
}

export class ZeroShieldOrchestrator extends EventEmitter {
  private hunter: VulnerabilityHunter;
  private redArena: RedAgentArena;
  private blueImmunizer: BlueAgentImmunizer;
  private verifier: ImmunizationVerifier;
  private supervisor: SecuritySupervisor;
  private reporter: ExecutiveReportGenerator;

  constructor() {
    super();
    this.hunter = new VulnerabilityHunter();
    this.redArena = new RedAgentArena();
    this.blueImmunizer = new BlueAgentImmunizer();
    this.verifier = new ImmunizationVerifier();
    this.supervisor = new SecuritySupervisor();
    this.reporter = new ExecutiveReportGenerator();
  }

  public getSupervisor(): SecuritySupervisor {
    return this.supervisor;
  }

  public async runPipeline(options: OrchestratorRunOptions): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const sessionId = `zeroshield_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const canonicalTarget = path.resolve(options.targetDir);

    this.emit('PIPELINE_STARTED', { sessionId, targetDir: canonicalTarget });

    // 1. SCAN PHASE: Hunt AST Sinks
    this.emit('HUNT_STARTED', { targetDir: canonicalTarget });
    const discoveredSinks = this.hunter.scanDirectory(canonicalTarget);
    this.emit('HUNT_COMPLETED', { totalSinks: discoveredSinks.length, sinks: discoveredSinks });

    if (discoveredSinks.length === 0) {
      const emptyReport = this.reporter.generateReport({
        targetRepo: canonicalTarget,
        vulnerabilities: [],
        verifiedPatches: [],
      });
      return {
        sessionId,
        targetDir: canonicalTarget,
        vulnerabilitiesFound: [],
        verifiedPatches: [],
        hitlReviewCards: [],
        pullRequests: [],
        auditReport: emptyReport,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. SANDBOX CREATION
    this.emit('SANDBOX_SPAWNING', { targetDir: canonicalTarget });
    const sandbox = await SandboxFactory.createSandbox({
      sourceDir: canonicalTarget,
      port: options.sandboxPort || 3998,
      forceLocal: options.forceLocalSandbox,
      forceDocker: options.forceDockerSandbox,
    });
    this.emit('SANDBOX_READY', { sandboxId: sandbox.id, sandboxType: sandbox.type, port: sandbox.port });

    const verifiedPatches: SecurityPatchNode[] = [];
    const hitlCards: HITLReviewCard[] = [];
    const pullRequests: PullRequestResult[] = [];

    const hitlSecret = options.hitlSecret || process.env.HITL_SECRET || 'zeroshield-prod-secret-key-12345';
    const gatekeeper = new HITLGatekeeper(hitlSecret);
    const githubClient = new GitHubIntegrationClient({
      token: options.githubToken,
      repoOwner: options.githubOwner,
      repoName: options.githubRepo,
    });

    try {
      // 3. ADVERSARIAL EXECUTION LOOP PER SINK
      for (let i = 0; i < discoveredSinks.length; i++) {
        const vuln = discoveredSinks[i];
        this.emit('VULNERABILITY_PROCESSING', { index: i + 1, total: discoveredSinks.length, vuln });

        // Start vulnerable target in sandbox
        await sandbox.startService('src/server.ts');

        // RED AGENT: Prove exploit
        this.emit('RED_EXPLOIT_STARTING', { vulnId: vuln.id, payload: vuln.exploitPayloadSpec });
        const exploitProof = await this.redArena.executeExploitInSandbox(vuln, sandbox);

        if (!exploitProof.exploitConfirmed) {
          this.emit('RED_EXPLOIT_UNCONFIRMED', { vulnId: vuln.id, reason: 'Target blocked or did not exhibit proof signature' });
          continue;
        }

        this.emit('RED_EXPLOIT_CONFIRMED', {
          vulnId: vuln.id,
          proof: exploitProof.capturedProof,
          cvss: vuln.cvssBaseScore,
        });

        // BLUE AGENT: NVIDIA AVO Patch Synthesis
        this.emit('BLUE_PATCH_SYNTHESIZING', { vulnId: vuln.id });
        const sourceCode = await sandbox.readFile(path.relative(findProjectRoot(vuln.vulnerableFilePath), vuln.vulnerableFilePath).replace(/\\/g, '/'));
        const patchCandidate = this.blueImmunizer.synthesizePatch(vuln, sourceCode);
        this.emit('BLUE_PATCH_SYNTHESIZED', { patchId: patchCandidate.id, diff: patchCandidate.patchDiff });

        // TRIPLE-LOCK VERIFICATION IN SANDBOX
        this.emit('TRIPLE_LOCK_VERIFYING', { patchId: patchCandidate.id });
        const verifiedPatch = await this.verifier.verifyPatchInSandbox(vuln, patchCandidate, sandbox);

        if (verifiedPatch.status !== 'IMMUNIZED') {
          this.emit('TRIPLE_LOCK_FAILED', { patchId: patchCandidate.id, results: verifiedPatch.immunizationResults });
          continue;
        }

        this.emit('TRIPLE_LOCK_PASSED', {
          patchId: verifiedPatch.id,
          resultingCvss: verifiedPatch.resultingCvssScore,
          locks: verifiedPatch.immunizationResults,
        });
        verifiedPatches.push(verifiedPatch);

        // CRYPTOGRAPHIC HITL GATE
        const reviewCard = gatekeeper.generateReviewCard(vuln, verifiedPatch);
        hitlCards.push(reviewCard);
        this.emit('HITL_CARD_ISSUED', { card: reviewCard });

        // AUTOMATED OR HITL APPROVED PR DISPATCH
        if (options.autoApprove && options.githubToken) {
          const isValid = gatekeeper.verifyApproval(
            verifiedPatch.id,
            verifiedPatch.patchDigest,
            reviewCard.approvalToken,
            reviewCard.expiresAt
          );

          if (isValid) {
            this.emit('PR_CREATING', { patchId: verifiedPatch.id });
            const pr = await githubClient.createImmunizedPullRequest(vuln, verifiedPatch, reviewCard.approvalToken);
            pullRequests.push(pr);
            this.emit('PR_CREATED', { prUrl: pr.prUrl, prNumber: pr.prNumber });
          }
        }
      }
    } finally {
      await sandbox.destroy();
      this.emit('SANDBOX_DESTROYED', { sandboxId: sandbox.id });
    }

    const auditReport = this.reporter.generateReport({
      targetRepo: canonicalTarget,
      vulnerabilities: discoveredSinks,
      verifiedPatches,
      hitlCards,
      sandboxType: sandbox.type,
    });

    this.emit('PIPELINE_COMPLETED', { report: auditReport });

    return {
      sessionId,
      targetDir: canonicalTarget,
      vulnerabilitiesFound: discoveredSinks,
      verifiedPatches,
      hitlReviewCards: hitlCards,
      pullRequests,
      auditReport,
      durationMs: Date.now() - startTime,
    };
  }
}
