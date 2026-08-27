import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlueAgentImmunizer } from '../src/blueteam/patcher.js';
import { VulnerabilityReport } from '../src/types/index.js';

describe('BlueAgentImmunizer (NVIDIA AVO Patch Synthesizer)', () => {
  it('should synthesize secure AST patch for Command Injection using execFile + Zod', () => {
    const report: VulnerabilityReport = {
      id: 'vuln_ci_1',
      category: 'COMMAND_INJECTION',
      cwe: 'CWE-78: OS Command Injection',
      cvssBaseScore: 9.8,
      confidence: 'HIGH',
      vulnerableFilePath: 'src/report.ts',
      vulnerableLineNumber: 12,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'exec',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.command',
        sinkSymbol: 'exec',
        taintedParameter: 'command',
        frameworkContext: 'Express.js',
        tracePath: ['line 12'],
      },
      codeSnippet: 'exec("generate.sh " + req.body.command)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/report',
        expectedProofSignature: 'root:x:0:0',
      },
      goldenValidInputs: [],
      status: 'EXPLOIT_CONFIRMED',
    };

    const originalSource = `
      import { exec } from 'child_process';
      export function handleReport(req: any, res: any) {
        exec("generate.sh " + req.body.command, (err, stdout) => {
          res.send(stdout);
        });
      }
    `;

    const immunizer = new BlueAgentImmunizer();
    const patchNode = immunizer.synthesizePatch(report, originalSource);

    assert.equal(patchNode.status, 'CANDIDATE');
    assert.match(patchNode.patchedCodeSnippet, /execFile/);
    assert.match(patchNode.patchedCodeSnippet, /z\.string\(\)/);
    assert.match(patchNode.patchDiff, /\+.*execFile/);
    assert.match(patchNode.patchDigest, /^[a-f0-9]{64}$/);
  });

  it('should synthesize secure AST patch for Prototype Pollution using key validation', () => {
    const report: VulnerabilityReport = {
      id: 'vuln_pp_1',
      category: 'PROTOTYPE_POLLUTION',
      cwe: 'CWE-1321: Prototype Pollution',
      cvssBaseScore: 7.5,
      confidence: 'HIGH',
      vulnerableFilePath: 'src/config.ts',
      vulnerableLineNumber: 8,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'unsafe_object_merge',
      sourceToSinkEvidence: {
        sourceSymbol: 'source[key]',
        sinkSymbol: 'target[key]',
        taintedParameter: 'source',
        frameworkContext: 'Config Loader',
        tracePath: ['line 8'],
      },
      codeSnippet: 'target[key] = source[key]',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/config',
        expectedProofSignature: 'POLLUTED',
      },
      goldenValidInputs: [],
      status: 'EXPLOIT_CONFIRMED',
    };

    const originalSource = `
      export function mergeConfig(target: any, source: any) {
        for (const key in source) {
          target[key] = source[key];
        }
        return target;
      }
    `;

    const immunizer = new BlueAgentImmunizer();
    const patchNode = immunizer.synthesizePatch(report, originalSource);

    assert.equal(patchNode.status, 'CANDIDATE');
    assert.match(patchNode.patchedCodeSnippet, /__proto__|prototype|constructor/);
  });
});
