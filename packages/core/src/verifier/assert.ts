import * as http from 'http';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';

export interface VerifierConfig {
  port?: number;
  sandboxDir?: string;
}

export class ImmunizationVerifier {
  private config: VerifierConfig;

  constructor(config: VerifierConfig = {}) {
    this.config = {
      port: config.port || 8080,
      sandboxDir: config.sandboxDir,
    };
  }

  public async verifyPatch(
    vulnerability: VulnerabilityReport,
    candidatePatch: SecurityPatchNode
  ): Promise<SecurityPatchNode> {
    const startTime = Date.now();
    const port = this.config.port || 8080;

    // Lock 1: Re-fire Red Agent exploit to assert blockage
    const exploitBlocked = await this.probeExploitBlockage(vulnerability, port);

    // Lock 2: Dispatch Golden Legitimate Inputs to assert normal functionality
    const goldenPassed = await this.probeGoldenInputs(vulnerability, port);

    // Lock 3: Real test suite execution inside target repository/sandbox
    const testResult = this.executeSandboxTestSuite(this.config.sandboxDir || path.dirname(vulnerability.vulnerableFilePath));

    const allPassed = exploitBlocked && goldenPassed && testResult.exitCode === 0;

    return {
      ...candidatePatch,
      immunizationResults: {
        exploitBlocked,
        goldenInputsPreserved: goldenPassed,
        unitTestsPassed: testResult.exitCode === 0,
        testSuiteExitCode: testResult.exitCode,
        testSuiteOutput: testResult.output,
        durationMs: Date.now() - startTime,
      },
      resultingCvssScore: allPassed ? 0.0 : vulnerability.cvssBaseScore,
      status: allPassed ? 'IMMUNIZED' : 'DEAD_END',
    };
  }

  private executeSandboxTestSuite(dir: string): { exitCode: number; output: string } {
    try {
      let targetDir = dir;
      while (targetDir && !fs.existsSync(path.join(targetDir, 'package.json')) && targetDir !== path.dirname(targetDir)) {
        targetDir = path.dirname(targetDir);
      }

      if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
        return { exitCode: 0, output: 'No test suite package.json found; zero regression baseline.' };
      }

      // Real test execution via npm test with 10s timeout
      const output = execSync('npm test', {
        cwd: targetDir,
        timeout: 10000,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      return { exitCode: 0, output: output || 'Test suite passed with Exit Code 0' };
    } catch (err: unknown) {
      const errorOutput = err instanceof Error ? err.message : String(err);
      return { exitCode: 1, output: errorOutput };
    }
  }

  private async probeExploitBlockage(vulnerability: VulnerabilityReport, port: number): Promise<boolean> {
    const spec = vulnerability.exploitPayloadSpec;
    const payloadData = spec.bodyPayload ? JSON.stringify(spec.bodyPayload) : '';

    return new Promise<boolean>(resolve => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: port,
          path: spec.endpoint,
          method: spec.protocol === 'HTTP_POST' ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadData).toString(),
            ...(spec.headers || {}),
          },
          timeout: 4000,
        },
        res => {
          let body = '';
          res.on('data', chunk => (body += chunk));
          res.on('end', () => {
            const isBlocked = (res.statusCode === 400 || res.statusCode === 403) && !body.includes(spec.expectedProofSignature);
            resolve(isBlocked);
          });
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      if (payloadData) req.write(payloadData);
      req.end();
    });
  }

  private async probeGoldenInputs(vulnerability: VulnerabilityReport, port: number): Promise<boolean> {
    if (!vulnerability.goldenValidInputs || vulnerability.goldenValidInputs.length === 0) {
      return true;
    }

    for (const golden of vulnerability.goldenValidInputs) {
      const payloadData = golden.bodyPayload ? JSON.stringify(golden.bodyPayload) : '';

      const passed = await new Promise<boolean>(resolve => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: port,
            path: golden.endpoint,
            method: golden.protocol === 'HTTP_POST' ? 'POST' : 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payloadData).toString(),
              ...(golden.headers || {}),
            },
            timeout: 4000,
          },
          res => {
            let body = '';
            res.on('data', chunk => (body += chunk));
            res.on('end', () => {
              const matchesCode = res.statusCode === golden.expectedStatusCode;
              const matchesContent = body.includes(golden.expectedResponseSubstring);
              resolve(matchesCode && matchesContent);
            });
          }
        );

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });

        if (payloadData) req.write(payloadData);
        req.end();
      });

      if (!passed) return false;
    }

    return true;
  }
}
