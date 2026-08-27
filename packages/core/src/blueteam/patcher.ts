import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';

export class BlueAgentImmunizer {
  public synthesizePatch(report: VulnerabilityReport, sourceContent: string): SecurityPatchNode {
    let patchedContent = sourceContent;
    let schemaInjected = '';

    if (report.category === 'COMMAND_INJECTION') {
      schemaInjected = 'const InputSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/);';
      patchedContent = patchedContent
        .replace(/import\s*\{\s*exec\s*\}\s*from\s*['"]child_process['"];?/g, "import { execFile } from 'child_process';\nimport { z } from 'zod';")
        .replace(
          /exec\s*\(\s*["']([^"']+)["']\s*\+\s*([^,]+),\s*\(([^)]+)\)\s*=>/g,
          `const parsed = z.string().regex(/^[a-zA-Z0-9_\\-\\s]+$/).safeParse($2);\n    if (!parsed.success) return res.status(400).json({ error: 'Invalid command input' });\n    execFile('$1', [parsed.data], ($3) =>`
        );
    } else if (report.category === 'PROTOTYPE_POLLUTION') {
      schemaInjected = 'const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);';
      patchedContent = patchedContent.replace(
        /for\s*\(\s*const\s+key\s+in\s+source\s*\)\s*\{/g,
        `for (const key in source) {\n      if (key === '__proto__' || key === 'prototype' || key === 'constructor') continue;`
      );
    } else if (report.category === 'BROKEN_AUTH_IDOR') {
      schemaInjected = 'const JWT_SECRET = process.env.JWT_SECRET || "secure-app-secret-key";';
      patchedContent = patchedContent.replace(
        /jwt\.decode\s*\(\s*([^)]+)\s*\)/g,
        `jwt.verify($1, process.env.JWT_SECRET || 'default-secret-key', { algorithms: ['HS256'] })`
      );
    }

    const patchDiff = this.generateUnifiedDiff(report.vulnerableFilePath, sourceContent, patchedContent);

    return {
      id: `patch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId: null,
      vulnerabilityId: report.id,
      timestamp: Date.now(),
      filePath: report.vulnerableFilePath,
      originalCodeSnippet: sourceContent,
      patchedCodeSnippet: patchedContent,
      patchDiff: patchDiff,
      sanitizationSchema: schemaInjected,
      immunizationResults: {
        exploitBlocked: false,
        goldenInputsPreserved: false,
        unitTestsPassed: false,
        testSuiteExitCode: -1,
      },
      resultingCvssScore: 0.0,
      status: 'CANDIDATE',
    };
  }

  private generateUnifiedDiff(filePath: string, original: string, modified: string): string {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    let diff = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${origLines.length} +1,${modLines.length} @@\n`;

    const max = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < max; i++) {
      const o = origLines[i];
      const m = modLines[i];
      if (o !== m) {
        if (o !== undefined) diff += `- ${o}\n`;
        if (m !== undefined) diff += `+ ${m}\n`;
      } else if (o !== undefined) {
        diff += `  ${o}\n`;
      }
    }
    return diff;
  }
}
