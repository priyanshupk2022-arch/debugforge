import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ExecutiveReportGenerator } from '../src/reporting/generator.js';
import { VulnerabilityReport, SecurityPatchNode } from '../src/types/index.js';

describe('ExecutiveReportGenerator (Compliance & Threat Intelligence Engine)', () => {
  it('should generate comprehensive executive audit report with SOC2/ISO mappings and CVSS delta', () => {
    const generator = new ExecutiveReportGenerator();

    const mockVuln: VulnerabilityReport = {
      id: 'vuln_1',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      confidence: 'HIGH',
      vulnerableFilePath: 'src/routes/report.ts',
      vulnerableLineNumber: 15,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'exec',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.cmd',
        sinkSymbol: 'exec',
        taintedParameter: 'cmd',
        frameworkContext: 'Express',
        tracePath: ['line 15'],
      },
      codeSnippet: 'exec(cmd)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/report',
        expectedProofSignature: 'EXPLOIT_PROOF',
      },
      goldenValidInputs: [],
      status: 'EXPLOIT_CONFIRMED',
    };

    const mockPatch: SecurityPatchNode = {
      id: 'patch_1',
      parentId: null,
      vulnerabilityId: 'vuln_1',
      timestamp: Date.now(),
      filePath: 'src/routes/report.ts',
      originalCodeSnippet: 'exec(cmd)',
      patchedCodeSnippet: 'execFile(...)',
      patchDiff: '+ execFile(...)',
      patchDigest: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      sanitizationSchema: 'zod schema',
      immunizationResults: {
        exploitBlocked: true,
        goldenInputsPreserved: true,
        unitTestsPassed: true,
        testSuiteExitCode: 0,
        testSuiteOutput: 'All tests passed',
        durationMs: 1500,
      },
      resultingCvssScore: 0.0,
      status: 'IMMUNIZED',
    };

    const report = generator.generateReport({
      targetRepo: 'github.com/zeroshield/sample-app',
      vulnerabilities: [mockVuln],
      verifiedPatches: [mockPatch],
    });

    assert.ok(report.reportId.startsWith('ZEROSHIELD_AUDIT_'));
    assert.equal(report.totalVulnerabilitiesFound, 1);
    assert.equal(report.totalImmunized, 1);
    assert.equal(report.initialOverallCvss, 9.8);
    assert.equal(report.finalOverallCvss, 0.0);
    assert.equal(report.threatReductionPercent, 100);
    assert.equal(report.complianceStandardsMapped.length, 4);

    const markdown = generator.renderMarkdown(report);
    assert.match(markdown, /ZeroShield Executive Cyber Threat/);
    assert.match(markdown, /9\.8 Critical ──► 0 Clean/);
    assert.match(markdown, /SOC2 Type II/);
    assert.match(markdown, /ISO\/IEC 27001/);
  });
});
