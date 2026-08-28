import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VulnerabilityHunter } from '../src/hunter/scanner.js';

describe('VulnerabilityHunter (AST Sink Scanner)', () => {
  it('should detect CWE-78 Command Injection sink with child_process.exec', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-test-'));
    const testFile = path.join(tmpDir, 'controller.ts');
    
    const code = `
      import { exec } from 'child_process';
      import express from 'express';
      const app = express();

      app.post('/api/report', (req, res) => {
        const cmd = req.body.command;
        exec("generate_report.sh " + cmd, (err, stdout) => {
          res.send(stdout);
        });
      });
    `;
    fs.writeFileSync(testFile, code);

    const hunter = new VulnerabilityHunter();
    const reports = hunter.scanDirectory(tmpDir);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].category, 'COMMAND_INJECTION');
    assert.equal(reports[0].cwe, 'CWE-78: OS Command Injection');
    assert.equal(reports[0].cvssBaseScore, 9.8);
    assert.equal(reports[0].sinkIdentifier, 'exec');
    assert.equal(reports[0].exploitPayloadSpec.endpoint, '/api/report');
    assert.match(reports[0].codeSnippet, /exec\(/);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect CWE-1321 Prototype Pollution sink with recursive unsafe merge', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-test-'));
    const testFile = path.join(tmpDir, 'config.ts');
    
    const code = `
      export function mergeConfig(target: any, source: any) {
        for (const key in source) {
          if (typeof source[key] === 'object') {
            target[key] = mergeConfig(target[key] || {}, source[key]);
          } else {
            target[key] = source[key];
          }
        }
        return target;
      }
    `;
    fs.writeFileSync(testFile, code);

    const hunter = new VulnerabilityHunter();
    const reports = hunter.scanDirectory(tmpDir);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].category, 'PROTOTYPE_POLLUTION');
    assert.equal(reports[0].cwe, 'CWE-1321: Prototype Pollution');
    assert.equal(reports[0].cvssBaseScore, 7.5);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect CWE-287 Broken Authentication / IDOR with unverified jwt.decode', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-test-'));
    const testFile = path.join(tmpDir, 'auth.ts');
    
    const code = `
      import jwt from 'jsonwebtoken';
      export function getUserFromToken(token: string) {
        const user = jwt.decode(token);
        return user;
      }
    `;
    fs.writeFileSync(testFile, code);

    const hunter = new VulnerabilityHunter();
    const reports = hunter.scanDirectory(tmpDir);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].category, 'BROKEN_AUTH_IDOR');
    assert.equal(reports[0].cwe, 'CWE-287: Broken Authentication / IDOR');
    assert.equal(reports[0].cvssBaseScore, 8.8);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect CWE-918 SSRF with unvalidated URL fetching', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-test-'));
    const testFile = path.join(tmpDir, 'webhook.ts');

    const code = `
      import express from 'express';
      const app = express();
      app.post('/api/webhook', (req, res) => {
        const targetUrl = req.body.url;
        fetch(targetUrl).then(r => r.text()).then(t => res.send(t));
      });
    `;
    fs.writeFileSync(testFile, code);

    const hunter = new VulnerabilityHunter();
    const reports = hunter.scanDirectory(tmpDir);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].category, 'SSRF');
    assert.equal(reports[0].cwe, 'CWE-918: Server-Side Request Forgery');
    assert.equal(reports[0].cvssBaseScore, 8.6);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect CWE-22 Path Traversal with unvalidated fs read', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeroshield-test-'));
    const testFile = path.join(tmpDir, 'file.ts');

    const code = `
      import express from 'express';
      import fs from 'fs';
      const app = express();
      app.post('/api/file', (req, res) => {
        const fileName = req.body.filename;
        const content = fs.readFileSync(fileName, 'utf8');
        res.send(content);
      });
    `;
    fs.writeFileSync(testFile, code);

    const hunter = new VulnerabilityHunter();
    const reports = hunter.scanDirectory(tmpDir);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].category, 'PATH_TRAVERSAL');
    assert.equal(reports[0].cwe, 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory');
    assert.equal(reports[0].cvssBaseScore, 7.5);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
