import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface WorkspaceIntegritySnapshot {
  timestamp: string;
  workspacePath: string;
  files: Map<string, string>; // relativeFilePath -> sha256
}

export interface AntiGamingAuditResult {
  passed: boolean;
  violations: string[];
  tamperedFiles: string[];
  deletedFiles: string[];
  suspiciousPatterns: string[];
}

/**
 * Computes SHA-256 hash of a file on disk.
 */
export function computeFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Recursively collects all file paths within a directory matching protected patterns.
 */
function collectFiles(dir: string, baseDir: string, protectedPatterns: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(collectFiles(fullPath, baseDir, protectedPatterns));
    } else if (entry.isFile()) {
      const isProtected = protectedPatterns.some((pattern) => {
        if (pattern.endsWith("/**")) {
          const prefix = pattern.slice(0, -3);
          return relPath.startsWith(prefix);
        }
        if (pattern.startsWith("*.")) {
          const ext = pattern.slice(1);
          return relPath.endsWith(ext);
        }
        return relPath.includes(pattern) || relPath.startsWith(pattern);
      });

      if (isProtected || protectedPatterns.length === 0) {
        results.push(relPath);
      }
    }
  }
  return results;
}

/**
 * Captures a baseline integrity snapshot of protected workspace test and harness files.
 */
export function captureWorkspaceIntegritySnapshot(
  workspacePath: string,
  protectedPatterns: string[] = ["test/**", "tests/**", "spec/**", "fixtures/**", "bench/**"]
): WorkspaceIntegritySnapshot {
  const files = new Map<string, string>();
  const filePaths = collectFiles(workspacePath, workspacePath, protectedPatterns);

  for (const relPath of filePaths) {
    const fullPath = path.join(workspacePath, relPath);
    files.set(relPath, computeFileHash(fullPath));
  }

  return {
    timestamp: new Date().toISOString(),
    workspacePath,
    files,
  };
}

/**
 * Scans patch text for cheating, test deletion, or exception masking anti-patterns.
 */
export function scanForGamingAntiPatterns(patchDiff: string): string[] {
  const detected: string[] = [];

  // Normalize diff by stripping leading diff markers (+ and -) and whitespace
  const normalizedText = patchDiff
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\+\-]\s*/, ""))
    .join("\n");

  // Pattern 1: Empty exception swallowing / masking (including multiline comments or return true)
  const exceptionMaskingRegex = /catch\s*\([^)]*\)\s*\{[\s\n]*(?:\/\/[^\n]*[\s\n]*|\/\*[\s\S]*?\*\/[\s\n]*|return\s*true;?[\s\n]*|return;?[\s\n]*)*\}/i;
  if (exceptionMaskingRegex.test(normalizedText)) {
    detected.push("Exception Masking: Catch block silently swallows error or returns true without remediation.");
  }

  // Pattern 2: Test disabling (e.g. it.skip, describe.skip, xit, xtest)
  const testSkipRegex = /\b(it|test|describe)\.skip\b|\b(xit|xtest)\b/;
  if (testSkipRegex.test(normalizedText)) {
    detected.push("Test Neutralization: Injected test skipping directive (.skip / xit).");
  }

  // Pattern 3: Commenting out assertions
  const commentedAssertionRegex = /\/\/\s*expect\(|\/\/\s*assert\.|\/\/\s*assert\(/;
  if (commentedAssertionRegex.test(normalizedText)) {
    detected.push("Assertion Weakening: Assertion was commented out in patch.");
  }

  // Pattern 4: Hardcoded test cheats (e.g. if (x === 'test_case_1') return 'expected_output')
  const hardcodedCheatRegex = /if\s*\(\s*(?:input|val|id|str|param|name)\s*===?\s*['"][^'"]+['"]\s*\)\s*return\s*['"][^'"]+['"]/;
  if (hardcodedCheatRegex.test(normalizedText)) {
    detected.push("Hardcoded Test Oracle Cheat: Conditional branch targets specific test input string.");
  }

  return detected;
}

/**
 * Audits workspace integrity after patch application against the baseline snapshot.
 */
export function verifyWorkspaceIntegrity(
  workspacePath: string,
  snapshot: WorkspaceIntegritySnapshot,
  authorizedModifiedFiles: string[] = []
): AntiGamingAuditResult {
  const violations: string[] = [];
  const tamperedFiles: string[] = [];
  const deletedFiles: string[] = [];
  const suspiciousPatterns: string[] = [];

  const normalizedAuthorized = new Set(
    authorizedModifiedFiles.map((f) => f.replace(/\\/g, "/"))
  );

  // Check all baseline protected files
  for (const [relPath, originalHash] of snapshot.files.entries()) {
    const fullPath = path.join(workspacePath, relPath);

    if (!fs.existsSync(fullPath)) {
      deletedFiles.push(relPath);
      violations.push(`Protected file was deleted: ${relPath}`);
      continue;
    }

    const currentHash = computeFileHash(fullPath);
    if (currentHash !== originalHash && !normalizedAuthorized.has(relPath)) {
      tamperedFiles.push(relPath);
      violations.push(`Protected artifact was modified without authorization: ${relPath}`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    tamperedFiles,
    deletedFiles,
    suspiciousPatterns,
  };
}
