import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';
import { VulnerabilityReport, ExploitPayloadSpec, GoldenValidInput } from '../types/index.js';

export class VulnerabilityHunter {
  public scanDirectory(directoryPath: string): VulnerabilityReport[] {
    const reports: VulnerabilityReport[] = [];
    const files = this.getAllSourceFiles(directoryPath);

    for (const file of files) {
      const fileReports = this.scanFile(file);
      reports.push(...fileReports);
    }

    return reports;
  }

  public scanFile(filePath: string): VulnerabilityReport[] {
    const reports: VulnerabilityReport[] = [];
    const content = fs.readFileSync(filePath, 'utf8');

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      // Rule 1: Command Injection (child_process.exec / eval)
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText(sourceFile);
        if (text === 'exec' || text === 'child_process.exec' || text === 'eval') {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const snippet = node.getText(sourceFile);

          const exploitSpec: ExploitPayloadSpec = {
            protocol: 'HTTP_POST',
            endpoint: '/api/report',
            bodyPayload: { command: '; cat /etc/passwd' },
            expectedProofSignature: 'root:x:0:0',
          };

          const goldenInputs: GoldenValidInput[] = [
            {
              description: 'Standard safe report generation',
              protocol: 'HTTP_POST',
              endpoint: '/api/report',
              bodyPayload: { command: '--summary-only' },
              expectedStatusCode: 200,
              expectedResponseSubstring: 'Report generated',
            },
          ];

          reports.push({
            id: `vuln_ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category: 'COMMAND_INJECTION',
            cwe: 'CWE-78: OS Command Injection',
            cvssBaseScore: 9.8,
            vulnerableFilePath: filePath,
            vulnerableLineNumber: line + 1,
            sinkIdentifier: text,
            codeSnippet: snippet,
            exploitPayloadSpec: exploitSpec,
            goldenValidInputs: goldenInputs,
            status: 'SUSPECTED',
          });
        }

        // Rule 3: Broken Authentication / IDOR (jwt.decode without verify)
        if (text === 'jwt.decode' || text === 'decode') {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const snippet = node.getText(sourceFile);

          const exploitSpec: ExploitPayloadSpec = {
            protocol: 'HTTP_GET',
            endpoint: '/api/user/profile',
            headers: { Authorization: 'Bearer forged.unsigned.token' },
            expectedProofSignature: 'admin_dashboard_unlocked',
          };

          const goldenInputs: GoldenValidInput[] = [
            {
              description: 'Valid signed JWT token',
              protocol: 'HTTP_GET',
              endpoint: '/api/user/profile',
              headers: { Authorization: 'Bearer valid.signed.jwt.token' },
              expectedStatusCode: 200,
              expectedResponseSubstring: 'profile',
            },
          ];

          reports.push({
            id: `vuln_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category: 'BROKEN_AUTH_IDOR',
            cwe: 'CWE-287: Broken Authentication / IDOR',
            cvssBaseScore: 8.8,
            vulnerableFilePath: filePath,
            vulnerableLineNumber: line + 1,
            sinkIdentifier: text,
            codeSnippet: snippet,
            exploitPayloadSpec: exploitSpec,
            goldenValidInputs: goldenInputs,
            status: 'SUSPECTED',
          });
        }
      }

      // Rule 2: Prototype Pollution (Unsafe recursive deep-merge / dynamic bracket assign)
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
        const fullFnText = node.getText(sourceFile);
        if (
          (fullFnText.includes('target[key]') && fullFnText.includes('source[key]')) &&
          !fullFnText.includes('__proto__') &&
          !fullFnText.includes('prototype')
        ) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const exploitSpec: ExploitPayloadSpec = {
            protocol: 'HTTP_POST',
            endpoint: '/api/config/update',
            bodyPayload: { __proto__: { admin: true } },
            expectedProofSignature: 'POLLUTED_ADMIN_FLAG',
          };

          const goldenInputs: GoldenValidInput[] = [
            {
              description: 'Standard valid profile config update',
              protocol: 'HTTP_POST',
              endpoint: '/api/config/update',
              bodyPayload: { theme: 'dark', notifications: true },
              expectedStatusCode: 200,
              expectedResponseSubstring: 'Config updated',
            },
          ];

          reports.push({
            id: `vuln_pp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category: 'PROTOTYPE_POLLUTION',
            cwe: 'CWE-1321: Prototype Pollution',
            cvssBaseScore: 7.5,
            vulnerableFilePath: filePath,
            vulnerableLineNumber: line + 1,
            sinkIdentifier: 'unsafe_object_merge',
            codeSnippet: fullFnText.split('\n')[0],
            exploitPayloadSpec: exploitSpec,
            goldenValidInputs: goldenInputs,
            status: 'SUSPECTED',
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return reports;
  }

  private getAllSourceFiles(dir: string): string[] {
    let files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
          files = files.concat(this.getAllSourceFiles(fullPath));
        }
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }
}
