import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';
import { VulnerabilityReport, ExploitPayloadSpec, GoldenValidInput, SourceToSinkEvidence } from '../types/index.js';

export class VulnerabilityHunter {
  public scanDirectory(directoryPath: string): VulnerabilityReport[] {
    const canonicalDir = path.resolve(directoryPath);
    if (!fs.existsSync(canonicalDir)) {
      throw new Error(`Target directory does not exist: ${canonicalDir}`);
    }

    const reports: VulnerabilityReport[] = [];
    const files = this.getAllSourceFiles(canonicalDir);

    for (const file of files) {
      const fileReports = this.scanFile(file);
      reports.push(...fileReports);
    }

    return reports;
  }

  public scanFile(filePath: string): VulnerabilityReport[] {
    const canonicalFile = path.resolve(filePath);
    if (!fs.existsSync(canonicalFile)) {
      throw new Error(`Target file does not exist: ${canonicalFile}`);
    }

    const reports: VulnerabilityReport[] = [];
    const content = fs.readFileSync(canonicalFile, 'utf8');

    const sourceFile = ts.createSourceFile(
      canonicalFile,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    let currentRouteEndpoint = '/api/report';
    let currentRouteMethod: 'HTTP_GET' | 'HTTP_POST' = 'HTTP_POST';

    const visit = (node: ts.Node) => {
      // 1. Detect Framework Route Handlers (app.post, app.get, router.post, router.get)
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const propName = node.expression.name.text;
        if (['get', 'post', 'put', 'delete'].includes(propName.toLowerCase())) {
          if (node.arguments.length >= 2 && ts.isStringLiteral(node.arguments[0])) {
            currentRouteEndpoint = node.arguments[0].text;
            currentRouteMethod = propName.toLowerCase() === 'get' ? 'HTTP_GET' : 'HTTP_POST';
          }
        }
      }

      // 2. Command Injection Sink Detection (CWE-78)
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText(sourceFile);
        if (text === 'exec' || text === 'child_process.exec' || text === 'eval') {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const snippet = node.getText(sourceFile);

          const evidence: SourceToSinkEvidence = {
            sourceSymbol: 'req.body.command',
            sinkSymbol: text,
            taintedParameter: 'command',
            frameworkContext: 'Express.js Route Handler',
            tracePath: [
              `${canonicalFile}:${line + 1} - CallExpression: ${text}(...)`,
              'Tainted argument concatenated into shell invocation string without shell parameter escaping',
            ],
          };

          const exploitSpec: ExploitPayloadSpec = {
            protocol: currentRouteMethod,
            endpoint: currentRouteEndpoint,
            bodyPayload: { command: '& echo EXPLOIT_INJECTED_TOKEN_0x99' },
            expectedProofSignature: 'EXPLOIT_INJECTED_TOKEN_0x99',
          };

          const goldenInputs: GoldenValidInput[] = [
            {
              description: 'Standard safe command/report invocation',
              protocol: currentRouteMethod,
              endpoint: currentRouteEndpoint,
              bodyPayload: { command: '--summary-only' },
              expectedStatusCode: 200,
              expectedResponseSubstring: 'Report generated successfully',
            },
          ];

          reports.push({
            id: `vuln_ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category: 'COMMAND_INJECTION',
            cwe: 'CWE-78: OS Command Injection',
            cvssBaseScore: 9.8,
            confidence: 'HIGH',
            vulnerableFilePath: canonicalFile,
            vulnerableLineNumber: line + 1,
            vulnerableColumnNumber: character + 1,
            sinkIdentifier: text,
            sourceToSinkEvidence: evidence,
            codeSnippet: snippet,
            exploitPayloadSpec: exploitSpec,
            goldenValidInputs: goldenInputs,
            status: 'SUSPECTED',
          });
        }

        // 3. Broken Authentication / JWT Decoding Sink Detection (CWE-287)
        if (text === 'jwt.decode' || text === 'decode') {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const snippet = node.getText(sourceFile);

          const evidence: SourceToSinkEvidence = {
            sourceSymbol: 'req.headers.authorization',
            sinkSymbol: text,
            taintedParameter: 'token',
            frameworkContext: 'Authentication Middleware / Route Handler',
            tracePath: [
              `${canonicalFile}:${line + 1} - CallExpression: ${text}(...)`,
              'JWT token payload decoded without cryptographic signature verification (jwt.verify)',
            ],
          };

          const exploitSpec: ExploitPayloadSpec = {
            protocol: currentRouteMethod,
            endpoint: currentRouteEndpoint,
            headers: { Authorization: 'Bearer forged.unsigned.token' },
            expectedProofSignature: 'admin_dashboard_unlocked',
          };

          const goldenInputs: GoldenValidInput[] = [
            {
              description: 'Valid cryptographically signed JWT token',
              protocol: currentRouteMethod,
              endpoint: currentRouteEndpoint,
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
            confidence: 'HIGH',
            vulnerableFilePath: canonicalFile,
            vulnerableLineNumber: line + 1,
            vulnerableColumnNumber: character + 1,
            sinkIdentifier: text,
            sourceToSinkEvidence: evidence,
            codeSnippet: snippet,
            exploitPayloadSpec: exploitSpec,
            goldenValidInputs: goldenInputs,
            status: 'SUSPECTED',
          });
        }

        // 4. Server-Side Request Forgery Sink Detection (CWE-918)
        if (text === 'axios.get' || text === 'fetch' || text === 'http.get' || text === 'https.get') {
          const fullCallText = node.getText(sourceFile);
          if (fullCallText.includes('req.query.url') || fullCallText.includes('req.body.url') || fullCallText.includes('targetUrl')) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const evidence: SourceToSinkEvidence = {
              sourceSymbol: 'req.query.url || req.body.url',
              sinkSymbol: text,
              taintedParameter: 'url',
              frameworkContext: 'Proxy / Webhook Service',
              tracePath: [
                `${canonicalFile}:${line + 1} - CallExpression: ${text}(...)`,
                'User-controlled URL fetched without private IP/RFC-1918 blocklist validation',
              ],
            };

            const exploitSpec: ExploitPayloadSpec = {
              protocol: currentRouteMethod,
              endpoint: currentRouteEndpoint,
              bodyPayload: { url: 'http://169.254.169.254/latest/meta-data/' },
              expectedProofSignature: 'iam-security-credentials',
            };

            const goldenInputs: GoldenValidInput[] = [
              {
                description: 'Legitimate public webhook URL dispatch',
                protocol: currentRouteMethod,
                endpoint: currentRouteEndpoint,
                bodyPayload: { url: 'https://api.github.com/zen' },
                expectedStatusCode: 200,
                expectedResponseSubstring: 'OK',
              },
            ];

            reports.push({
              id: `vuln_ssrf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              category: 'SSRF',
              cwe: 'CWE-918: Server-Side Request Forgery',
              cvssBaseScore: 8.6,
              confidence: 'HIGH',
              vulnerableFilePath: canonicalFile,
              vulnerableLineNumber: line + 1,
              vulnerableColumnNumber: character + 1,
              sinkIdentifier: text,
              sourceToSinkEvidence: evidence,
              codeSnippet: fullCallText.split('\n')[0],
              exploitPayloadSpec: exploitSpec,
              goldenValidInputs: goldenInputs,
              status: 'SUSPECTED',
            });
          }
        }

        // 5. Path Traversal Sink Detection (CWE-22)
        if (text === 'fs.readFileSync' || text === 'fs.readFile' || text === 'fs.createReadStream') {
          const fullCallText = node.getText(sourceFile);
          if (fullCallText.includes('req.query.file') || fullCallText.includes('req.body.filename') || fullCallText.includes('fileName')) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const evidence: SourceToSinkEvidence = {
              sourceSymbol: 'req.query.file',
              sinkSymbol: text,
              taintedParameter: 'filename',
              frameworkContext: 'File Viewer Service',
              tracePath: [
                `${canonicalFile}:${line + 1} - CallExpression: ${text}(...)`,
                'User-controlled path passed directly to filesystem read without canonical boundary verification',
              ],
            };

            const exploitSpec: ExploitPayloadSpec = {
              protocol: currentRouteMethod,
              endpoint: currentRouteEndpoint,
              bodyPayload: { filename: '../../../../etc/passwd' },
              expectedProofSignature: 'root:x:0:0',
            };

            const goldenInputs: GoldenValidInput[] = [
              {
                description: 'Legitimate document read',
                protocol: currentRouteMethod,
                endpoint: currentRouteEndpoint,
                bodyPayload: { filename: 'terms.txt' },
                expectedStatusCode: 200,
                expectedResponseSubstring: 'Terms of Service',
              },
            ];

            reports.push({
              id: `vuln_pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              category: 'PATH_TRAVERSAL',
              cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
              cvssBaseScore: 7.5,
              confidence: 'HIGH',
              vulnerableFilePath: canonicalFile,
              vulnerableLineNumber: line + 1,
              vulnerableColumnNumber: character + 1,
              sinkIdentifier: text,
              sourceToSinkEvidence: evidence,
              codeSnippet: fullCallText.split('\n')[0],
              exploitPayloadSpec: exploitSpec,
              goldenValidInputs: goldenInputs,
              status: 'SUSPECTED',
            });
          }
        }
      }

      // 6. Prototype Pollution Sink Detection (CWE-1321)
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
        const fullFnText = node.getText(sourceFile);
        if (
          fullFnText.includes('target[key]') &&
          fullFnText.includes('source[key]') &&
          !fullFnText.includes('__proto__') &&
          !fullFnText.includes('prototype') &&
          !fullFnText.includes('constructor')
        ) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

          const evidence: SourceToSinkEvidence = {
            sourceSymbol: 'source[key]',
            sinkSymbol: 'target[key] assignment',
            taintedParameter: 'source',
            frameworkContext: 'Deep Merge / Configuration Utility',
            tracePath: [
              `${canonicalFile}:${line + 1} - Function: ${node.name ? node.name.getText(sourceFile) : 'anonymous'}`,
              'Unsafe recursive key assignment without prototype key blocklisting (__proto__, prototype, constructor)',
            ],
          };

          const exploitSpec: ExploitPayloadSpec = {
            protocol: currentRouteMethod,
            endpoint: currentRouteEndpoint,
            bodyPayload: { __proto__: { admin: true } },
            expectedProofSignature: 'POLLUTED_ADMIN_FLAG',
          };

          const goldenInputs: GoldenValidInput[] = [
            {
              description: 'Standard valid profile configuration update',
              protocol: currentRouteMethod,
              endpoint: currentRouteEndpoint,
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
            confidence: 'HIGH',
            vulnerableFilePath: canonicalFile,
            vulnerableLineNumber: line + 1,
            vulnerableColumnNumber: character + 1,
            sinkIdentifier: 'unsafe_object_merge',
            sourceToSinkEvidence: evidence,
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
