import * as path from 'path';
import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';
import { ISandboxInstance, SandboxFactory, findProjectRoot } from '../sandbox/lifecycle.js';

export interface VerifierConfig {
  port?: number;
  useLocalRunner?: boolean;
}

export class ImmunizationVerifier {
  private config: VerifierConfig;

  constructor(config: VerifierConfig = {}) {
    this.config = {
      port: config.port || 8080,
      useLocalRunner: config.useLocalRunner ?? true,
    };
  }

  public async verifyPatchInSandbox(
    vulnerability: VulnerabilityReport,
    candidatePatch: SecurityPatchNode,
    sandbox: ISandboxInstance
  ): Promise<SecurityPatchNode> {
    const startTime = Date.now();

    // STEP 1: Apply Candidate Patch inside the Sandbox Filesystem
    const projectRoot = findProjectRoot(vulnerability.vulnerableFilePath);
    const relPath = path.relative(projectRoot, vulnerability.vulnerableFilePath).replace(/\\/g, '/');
    await sandbox.writeFile(relPath, candidatePatch.patchedCodeSnippet);

    // STEP 2: Restart Sandbox Target Service with Patched Code
    await sandbox.restartService('src/server.ts');

    // STEP 3: Lock 1 — Re-fire Red Agent Exploit to assert it is blocked
    const spec = vulnerability.exploitPayloadSpec;
    const exploitRes = await sandbox.dispatchHttp({
      method: spec.protocol === 'HTTP_POST' ? 'POST' : 'GET',
      path: spec.endpoint,
      headers: spec.headers,
      bodyPayload: spec.bodyPayload,
    });

    const isBlocked = (exploitRes.statusCode === 400 || exploitRes.statusCode === 403) &&
      !exploitRes.body.includes(spec.expectedProofSignature);

    // STEP 4: Lock 2 — Dispatch Golden Legitimate Inputs to assert normal functionality
    let goldenPassed = true;
    if (vulnerability.goldenValidInputs && vulnerability.goldenValidInputs.length > 0) {
      for (const golden of vulnerability.goldenValidInputs) {
        const goldenRes = await sandbox.dispatchHttp({
          method: golden.protocol === 'HTTP_POST' ? 'POST' : 'GET',
          path: golden.endpoint,
          headers: golden.headers,
          bodyPayload: golden.bodyPayload,
        });

        const matchesCode = goldenRes.statusCode === golden.expectedStatusCode;
        const matchesContent = goldenRes.body.includes(golden.expectedResponseSubstring);
        if (!matchesCode || !matchesContent) {
          goldenPassed = false;
          break;
        }
      }
    }

    // STEP 5: Lock 3 — Run Real Target Test Suite INSIDE Sandbox
    const testResult = await sandbox.executeCommand('npm test', 25);
    const testsPassed = testResult.exitCode === 0;

    const allPassed = isBlocked && goldenPassed && testsPassed;

    return {
      ...candidatePatch,
      immunizationResults: {
        exploitBlocked: isBlocked,
        goldenInputsPreserved: goldenPassed,
        unitTestsPassed: testsPassed,
        testSuiteExitCode: testResult.exitCode,
        testSuiteOutput: testResult.stdout + '\n' + testResult.stderr,
        durationMs: Date.now() - startTime,
      },
      resultingCvssScore: allPassed ? 0.0 : vulnerability.cvssBaseScore,
      status: allPassed ? 'IMMUNIZED' : 'DEAD_END',
    };
  }

  public async verifyPatch(
    vulnerability: VulnerabilityReport,
    candidatePatch: SecurityPatchNode
  ): Promise<SecurityPatchNode> {
    const targetSourceDir = findProjectRoot(vulnerability.vulnerableFilePath);
    const sandbox = await SandboxFactory.createSandbox({
      sourceDir: targetSourceDir,
      port: this.config.port,
      forceLocal: this.config.useLocalRunner,
    });

    try {
      await sandbox.startService('src/server.ts');
      return await this.verifyPatchInSandbox(vulnerability, candidatePatch, sandbox);
    } finally {
      await sandbox.destroy();
    }
  }
}
