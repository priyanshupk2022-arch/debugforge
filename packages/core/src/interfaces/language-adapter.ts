export interface LanguageAdapter {
  languageId: "javascript" | "typescript" | "python" | "cpp" | "go";
  fileExtensions: string[];
  testRunnerCommand: string;
  defaultEntrypoint: string;
  formatStackTrace(rawLog: string): Array<{
    file: string;
    line: number;
    column?: number;
    function?: string;
  }>;
  generateBRTSkeleton(params: {
    testName: string;
    targetModule: string;
    triggeringExpression: string;
  }): string;
}

export class JavaScriptTypeScriptAdapter implements LanguageAdapter {
  public languageId = "typescript" as const;
  public fileExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
  public testRunnerCommand = "npm test";
  public defaultEntrypoint = "src/index.ts";

  public formatStackTrace(rawLog: string) {
    const lines = rawLog.split(/\r?\n/);
    const frames: Array<{ file: string; line: number; column?: number; function?: string }> = [];

    const frameRegex = /at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/;
    for (const line of lines) {
      const match = line.match(frameRegex);
      if (match) {
        frames.push({
          function: match[1] || "anonymous",
          file: match[2],
          line: parseInt(match[3], 10),
          column: parseInt(match[4], 10),
        });
      }
    }
    return frames;
  }

  public generateBRTSkeleton(params: {
    testName: string;
    targetModule: string;
    triggeringExpression: string;
  }): string {
    return `import assert from "node:assert/strict";
import test from "node:test";

test("${params.testName}", async () => {
  // Synthesized Minimal Reproduction Example
  ${params.triggeringExpression}
});
`;
  }
}

export class PythonAdapter implements LanguageAdapter {
  public languageId = "python" as const;
  public fileExtensions = [".py"];
  public testRunnerCommand = "pytest";
  public defaultEntrypoint = "main.py";

  public formatStackTrace(rawLog: string) {
    const lines = rawLog.split(/\r?\n/);
    const frames: Array<{ file: string; line: number; column?: number; function?: string }> = [];

    const frameRegex = /File "(.+?)", line (\d+), in (.+)/;
    for (const line of lines) {
      const match = line.match(frameRegex);
      if (match) {
        frames.push({
          file: match[1],
          line: parseInt(match[2], 10),
          function: match[3],
        });
      }
    }
    return frames;
  }

  public generateBRTSkeleton(params: {
    testName: string;
    targetModule: string;
    triggeringExpression: string;
  }): string {
    return `import pytest

def test_${params.testName.replace(/[^a-zA-Z0-9_]/g, "_")}():
    # Synthesized Python Minimal Reproduction Example
    ${params.triggeringExpression}
`;
  }
}
