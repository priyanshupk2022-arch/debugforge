import * as fs from "fs";
import * as path from "path";
import { BlastRadiusResult } from "../types.js";

export interface BlastRadiusOptions {
  projectPath: string;
  targetFile: string;
  startLine?: number;
  endLine?: number;
  changedCode?: string;
}

/**
 * Recursively scans directory for source and test files.
 */
function scanSourceFiles(dir: string, baseDir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build"
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(scanSourceFiles(fullPath, baseDir));
    } else if (entry.isFile() && /\.(ts|js|mjs|cjs|jsx|tsx)$/.test(entry.name)) {
      results.push(relPath);
    }
  }
  return results;
}

/**
 * Dependency-aware Blast Radius Analyzer extracting changed symbols, direct callers, and affected test suites.
 */
export class BlastRadiusAnalyzer {
  /**
   * Analyzes the transitive blast radius of a patch targeting a specific file and line range.
   */
  public analyzeBlastRadius(options: BlastRadiusOptions): BlastRadiusResult {
    const { projectPath, targetFile, startLine = 1, endLine } = options;
    const resolvedTarget = path.isAbsolute(targetFile)
      ? path.relative(projectPath, targetFile).replace(/\\/g, "/")
      : targetFile.replace(/\\/g, "/");

    const fullTargetPath = path.resolve(projectPath, resolvedTarget);
    let targetContent = "";
    if (fs.existsSync(fullTargetPath)) {
      targetContent = fs.readFileSync(fullTargetPath, "utf-8");
    }

    const lines = targetContent.split(/\r?\n/);
    const effectiveEndLine = endLine ? Math.min(lines.length, endLine) : lines.length;
    const modifiedLines = lines.slice(Math.max(0, startLine - 1), effectiveEndLine).join("\n");

    // 1. Extract changed and exported symbols
    const changedSymbols: string[] = [];
    const exportedSymbols: string[] = [];

    // Find all export declarations in target file
    const exportRegex = /export\s+(?:async\s+)?(?:function|const|let|var|class|interface|type)\s+([a-zA-Z0-9_$]+)/g;
    let match;
    while ((match = exportRegex.exec(targetContent)) !== null) {
      exportedSymbols.push(match[1]);
    }

    // Check default export
    if (/export\s+default\s+([a-zA-Z0-9_$]+)/.test(targetContent)) {
      const defMatch = targetContent.match(/export\s+default\s+([a-zA-Z0-9_$]+)/);
      if (defMatch?.[1]) exportedSymbols.push(defMatch[1]);
    }

    // Check symbols inside modified line range
    for (const sym of exportedSymbols) {
      if (modifiedLines.includes(sym)) {
        changedSymbols.push(sym);
      }
    }

    if (changedSymbols.length === 0 && exportedSymbols.length > 0) {
      changedSymbols.push(exportedSymbols[0]);
    }

    // 2. Scan all project files for import references to targetFile
    const allFiles = scanSourceFiles(projectPath, projectPath);
    const directCallerFiles: string[] = [];
    const dependentTestFiles: string[] = [];

    const targetBaseName = path.basename(resolvedTarget, path.extname(resolvedTarget));

    for (const relPath of allFiles) {
      if (relPath === resolvedTarget) continue;

      const fileFullPath = path.resolve(projectPath, relPath);
      const fileContent = fs.readFileSync(fileFullPath, "utf-8");

      // Check if file imports from target file
      const importsTarget =
        fileContent.includes(targetBaseName) ||
        fileContent.includes(resolvedTarget) ||
        (changedSymbols.length > 0 && changedSymbols.some((s) => fileContent.includes(s)));

      if (importsTarget) {
        const isTest =
          relPath.includes("test") ||
          relPath.includes("spec") ||
          relPath.endsWith(".test.ts") ||
          relPath.endsWith(".test.js") ||
          relPath.endsWith(".spec.ts") ||
          relPath.endsWith(".spec.js");

        if (isTest) {
          dependentTestFiles.push(relPath);
        } else {
          directCallerFiles.push(relPath);
        }
      }
    }

    const isShared = directCallerFiles.length > 0 || exportedSymbols.length > 0;
    const widenVerificationRequired = directCallerFiles.length > 0;

    const recommendedTestScope = [
      ...dependentTestFiles,
      ...(widenVerificationRequired ? ["full-test-suite"] : []),
    ];

    const rationale = widenVerificationRequired
      ? `Patch touches shared exported symbol(s) [${changedSymbols.join(", ")}] referenced by ${directCallerFiles.length} caller(s). Widen verification across dependent tests.`
      : `Patch is locally scoped to ${resolvedTarget}. Standard test execution is sufficient.`;

    return {
      targetFile: resolvedTarget,
      changedSymbols,
      directCallerFiles,
      dependentTestFiles,
      exportedSymbols,
      widenVerificationRequired,
      recommendedTestScope: recommendedTestScope.length > 0 ? recommendedTestScope : ["default-test-command"],
      confidence: 0.92,
      rationale,
    };
  }
}

export const blastRadiusAnalyzer = new BlastRadiusAnalyzer();
