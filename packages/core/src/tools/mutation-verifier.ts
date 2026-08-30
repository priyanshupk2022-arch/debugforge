import * as fs from "fs";
import * as path from "path";
import { MutationVerificationResult, MutantResult } from "../types.js";
import { daytonaSandbox } from "../daytona/sandbox.js";

export interface MutationVerificationOptions {
  projectPath: string;
  filePath: string;
  startLine: number;
  endLine: number;
  testCommand?: string;
  maxMutants?: number;
}

/**
 * Targeted Local Mutation Verifier executing targeted mutations against patched lines to verify test suite sensitivity.
 */
export class TargetedMutationVerifier {
  /**
   * Generates targeted mutant code strings for a line of code.
   */
  public generateMutantsForLines(originalLines: string[]): Array<{
    type: string;
    mutatedLines: string[];
    lineOffset: number;
  }> {
    const mutants: Array<{ type: string; mutatedLines: string[]; lineOffset: number }> = [];

    for (let i = 0; i < originalLines.length; i++) {
      const line = originalLines[i];
      if (!line || line.trim().startsWith("//") || line.trim().length === 0) continue;

      // 1. Condition Inversion
      if (line.includes("===")) {
        const mutated = [...originalLines];
        mutated[i] = line.replace("===", "!==");
        mutants.push({ type: "invert_equality", mutatedLines: mutated, lineOffset: i });
      } else if (line.includes("!==")) {
        const mutated = [...originalLines];
        mutated[i] = line.replace("!==", "===");
        mutants.push({ type: "invert_inequality", mutatedLines: mutated, lineOffset: i });
      }

      if (line.includes(" && ")) {
        const mutated = [...originalLines];
        mutated[i] = line.replace(" && ", " || ");
        mutants.push({ type: "swap_logical_and", mutatedLines: mutated, lineOffset: i });
      }

      if (line.includes("if (!") || line.includes("if(!")) {
        const mutated = [...originalLines];
        mutated[i] = line.replace(/if\s*\(!/, "if (");
        mutants.push({ type: "invert_null_guard", mutatedLines: mutated, lineOffset: i });
      }

      // 2. Boolean Literal Inversion
      if (line.includes("true") && !line.includes("return true;")) {
        const mutated = [...originalLines];
        mutated[i] = line.replace(/\btrue\b/, "false");
        mutants.push({ type: "invert_boolean_literal", mutatedLines: mutated, lineOffset: i });
      } else if (line.includes("false")) {
        const mutated = [...originalLines];
        mutated[i] = line.replace(/\bfalse\b/, "true");
        mutants.push({ type: "invert_boolean_literal", mutatedLines: mutated, lineOffset: i });
      }

      // 3. Return value mutation
      if (line.trim().startsWith("return ") && !line.includes("return null") && !line.includes("return undefined")) {
        const mutated = [...originalLines];
        mutated[i] = "return null;";
        mutants.push({ type: "nullify_return", mutatedLines: mutated, lineOffset: i });
      }
    }

    return mutants;
  }

  /**
   * Evaluates mutant sensitivity by applying mutants and running the verification command.
   */
  public async verifyCandidateMutations(
    options: MutationVerificationOptions
  ): Promise<MutationVerificationResult> {
    const {
      projectPath,
      filePath,
      startLine,
      endLine,
      testCommand = "npm test",
      maxMutants = 4,
    } = options;

    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(projectPath, filePath);

    if (!fs.existsSync(fullPath)) {
      return {
        totalMutants: 0,
        killedMutants: 0,
        survivedMutants: 0,
        mutationScore: 1.0,
        passed: true,
        mutants: [],
        diagnostics: "Target file does not exist on disk for mutation verification.",
      };
    }

    const originalContent = fs.readFileSync(fullPath, "utf-8");
    const allLines = originalContent.split(/\r?\n/);

    const targetStart = Math.max(1, startLine);
    const targetEnd = Math.min(allLines.length, endLine || allLines.length);
    const chunkLines = allLines.slice(targetStart - 1, targetEnd);

    const generatedMutants = this.generateMutantsForLines(chunkLines).slice(0, maxMutants);

    if (generatedMutants.length === 0) {
      return {
        totalMutants: 0,
        killedMutants: 0,
        survivedMutants: 0,
        mutationScore: 1.0,
        passed: true,
        mutants: [],
        diagnostics: "No viable AST mutation sites identified in patched lines.",
      };
    }

    const mutantResults: MutantResult[] = [];
    const workspace = await daytonaSandbox.createWorkspace(projectPath);

    try {
      for (let i = 0; i < generatedMutants.length; i++) {
        const m = generatedMutants[i];
        const mutantId = `mutant_${i + 1}_${m.type}`;

        // Construct mutated file
        const mutatedFileLines = [...allLines];
        mutatedFileLines.splice(targetStart - 1, chunkLines.length, ...m.mutatedLines);
        const mutatedContent = mutatedFileLines.join("\n");

        // Write mutant to disk
        fs.writeFileSync(fullPath, mutatedContent, "utf-8");

        // Execute verification command in workspace
        const execResult = await daytonaSandbox.executeInWorkspace(
          workspace.workspaceId,
          testCommand,
          { timeoutMs: 15000 }
        );

        // In mutation testing:
        // Test FAILS (exitCode !== 0) -> Mutant was KILLED (Desirable / Test is sensitive)
        // Test PASSES (exitCode === 0) -> Mutant SURVIVED (Test weakness / Test failed to catch defect)
        const isKilled = execResult.exitCode !== 0;

        mutantResults.push({
          mutantId,
          filePath,
          lineNumber: targetStart + m.lineOffset,
          mutationType: m.type,
          originalCode: chunkLines[m.lineOffset] || "",
          mutatedCode: m.mutatedLines[m.lineOffset] || "",
          status: isKilled ? "KILLED" : "SURVIVED",
          executionDetails: isKilled
            ? `Mutant correctly killed (exit code: ${execResult.exitCode})`
            : `Mutant survived test suite (exit code 0: test suite failed to catch mutant)`,
        });
      }
    } finally {
      // Guaranteed teardown: restore original content on disk and destroy workspace
      fs.writeFileSync(fullPath, originalContent, "utf-8");
      await daytonaSandbox.destroyWorkspace(workspace.workspaceId);
    }

    const killedMutants = mutantResults.filter((m) => m.status === "KILLED").length;
    const survivedMutants = mutantResults.filter((m) => m.status === "SURVIVED").length;
    const mutationScore =
      mutantResults.length > 0 ? killedMutants / mutantResults.length : 1.0;

    return {
      totalMutants: mutantResults.length,
      killedMutants,
      survivedMutants,
      mutationScore,
      passed: mutationScore >= 0.5,
      mutants: mutantResults,
      diagnostics: `Targeted Mutation Testing: ${killedMutants}/${mutantResults.length} mutants killed (${(
        mutationScore * 100
      ).toFixed(1)}% mutation score).`,
    };
  }
}

export const targetedMutationVerifier = new TargetedMutationVerifier();
