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

  it('should synthesize secure AST patch for SSRF using URL validation', () => {
    const report: VulnerabilityReport = {
      id: 'vuln_ssrf_1',
      category: 'SSRF',
      cwe: 'CWE-918: Server-Side Request Forgery',
      cvssBaseScore: 8.6,
      confidence: 'HIGH',
      vulnerableFilePath: 'src/webhook.ts',
      vulnerableLineNumber: 5,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'fetch',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.url',
        sinkSymbol: 'fetch',
        taintedParameter: 'url',
        frameworkContext: 'Webhook proxy',
        tracePath: ['line 5'],
      },
      codeSnippet: 'fetch(targetUrl)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/webhook',
        expectedProofSignature: '169.254.169.254',
      },
      goldenValidInputs: [],
      status: 'EXPLOIT_CONFIRMED',
    };

    const originalSource = `
      import express from 'express';
      export function handleWebhook(req: any, res: any) {
        const targetUrl = req.body.url;
        fetch(targetUrl);
      }
    `;

    const immunizer = new BlueAgentImmunizer();
    const patchNode = immunizer.synthesizePatch(report, originalSource);

    assert.equal(patchNode.status, 'CANDIDATE');
    assert.match(patchNode.patchedCodeSnippet, /169\.254\./);
    assert.match(patchNode.patchedCodeSnippet, /urlSchema/);
  });

  it('should synthesize secure AST patch for Path Traversal using safe path boundaries', () => {
    const report: VulnerabilityReport = {
      id: 'vuln_pt_1',
      category: 'PATH_TRAVERSAL',
      cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
      cvssBaseScore: 7.5,
      confidence: 'HIGH',
      vulnerableFilePath: 'src/file.ts',
      vulnerableLineNumber: 6,
      vulnerableColumnNumber: 5,
      sinkIdentifier: 'fs.readFileSync',
      sourceToSinkEvidence: {
        sourceSymbol: 'req.body.filename',
        sinkSymbol: 'fs.readFileSync',
        taintedParameter: 'filename',
        frameworkContext: 'File reader',
        tracePath: ['line 6'],
      },
      codeSnippet: 'fs.readFileSync(filePath)',
      exploitPayloadSpec: {
        protocol: 'HTTP_POST',
        endpoint: '/api/file',
        expectedProofSignature: 'root:x:0:0',
      },
      goldenValidInputs: [],
      status: 'EXPLOIT_CONFIRMED',
    };

    const originalSource = `
      import path from 'path';
      import fs from 'fs';
      export function readFile(req: any, res: any) {
        const filePath = path.join(process.cwd(), req.body.filename);
        const data = fs.readFileSync(filePath, 'utf8');
      }
    `;

    const immunizer = new BlueAgentImmunizer();
    const patchNode = immunizer.synthesizePatch(report, originalSource);

    assert.equal(patchNode.status, 'CANDIDATE');
    assert.match(patchNode.patchedCodeSnippet, /safePath\.startsWith/);
  });
});
