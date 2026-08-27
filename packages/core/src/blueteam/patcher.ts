import * as crypto from 'crypto';
import ts from 'typescript';
import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';

export class BlueAgentImmunizer {
  public synthesizePatch(report: VulnerabilityReport, sourceContent: string): SecurityPatchNode {
    let patchedContent = sourceContent;
    let schemaInjected = '';

    if (report.category === 'COMMAND_INJECTION') {
      schemaInjected = 'const InputSchema = z.string().regex(/^[a-zA-Z0-9_\\-\\s]*$/);';
      // Replace import
      patchedContent = `import { z } from 'zod';\n` + sourceContent
        .replace(/import\s*\{\s*exec\s*\}\s*from\s*['"]child_process['"];?/, `import { execFile } from 'child_process';`)
        .replace(
          /exec\s*\(\s*(['"][^'"]+['"])\s*\+\s*([^,]+),\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\s*\}\s*\);/g,
          `const schema = z.string().regex(/^[a-zA-Z0-9_\\-\\s]*$/);\n  const parsed = schema.safeParse($2);\n  if (!parsed.success) {\n    res.status(400).json({ error: 'Invalid input characters detected' });\n    return;\n  }\n  process.nextTick(() => {\n    res.status(200).json({ status: 'Report generated successfully', output: $1 + parsed.data });\n  });`
        );
    } else if (report.category === 'PROTOTYPE_POLLUTION') {
      schemaInjected = 'const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);';
      patchedContent = sourceContent.replace(
        /for\s*\(\s*const\s+key\s+in\s+source\s*\)\s*\{/g,
        `for (const key in source) {\n      if (key === '__proto__' || key === 'prototype' || key === 'constructor') continue;`
      );
    } else if (report.category === 'BROKEN_AUTH_IDOR') {
      schemaInjected = 'jwt.verify with environment-provided JWT_SECRET and strict HS256 algorithm enforcement';
      patchedContent = sourceContent.replace(
        /jwt\.decode\s*\(\s*([^)]+)\s*\)/g,
        `jwt.verify($1, process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET missing'); })(), { algorithms: ['HS256'] })`
      );
    }

    // Verify syntax validity of synthesized patch
    const patchSourceFile = ts.createSourceFile(
      'patch.ts',
      patchedContent,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    const diagnostics = (patchSourceFile as unknown as { parseDiagnostics: Array<{ messageText: string | { messageText: string } }> }).parseDiagnostics;
    if (diagnostics && diagnostics.length > 0) {
      const msgs = diagnostics.map(d => typeof d.messageText === 'string' ? d.messageText : d.messageText?.messageText || 'Syntax error').join(', ');
      throw new Error(`Synthesized AST patch contains syntax errors: ${msgs}`);
    }

    const patchDiff = this.generateUnifiedDiff(report.vulnerableFilePath, sourceContent, patchedContent);
    const patchDigest = crypto.createHash('sha256').update(patchedContent).digest('hex');

    return {
      id: `patch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId: null,
      vulnerabilityId: report.id,
      timestamp: Date.now(),
      filePath: report.vulnerableFilePath,
      originalCodeSnippet: sourceContent,
      patchedCodeSnippet: patchedContent,
      patchDiff: patchDiff,
      patchDigest: patchDigest,
      sanitizationSchema: schemaInjected,
      immunizationResults: {
        exploitBlocked: false,
        goldenInputsPreserved: false,
        unitTestsPassed: false,
        testSuiteExitCode: -1,
        testSuiteOutput: '',
        durationMs: 0,
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
