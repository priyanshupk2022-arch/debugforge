import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export type MutationType =
  | "insert"
  | "replace"
  | "delete"
  | "guard_insertion"
  | "refactor"
  | "rollback";

export interface CodeMutation {
  mutationId: string;
  type: MutationType;
  filePath: string;
  startLine: number;
  endLine: number;
  originalCode: string;
  replacementCode: string;
  beforeHash: string;
  afterHash: string;
  reason: string;
  hypothesisId?: string;
  rollbackMetadata?: {
    backupFilePath?: string;
    originalContent: string;
  };
}

export interface MutationApplicationResult {
  success: boolean;
  mutation: CodeMutation;
  appliedFilePath: string;
  error?: string;
}

/**
 * Computes a SHA-256 hash of a string.
 */
function hashString(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Unified Variation Operator executing surgical, AST/line-range code mutations with deterministic rollback metadata.
 */
export class VariationOperator {
  /**
   * Synthesizes and applies a surgical line-bounded code mutation.
   */
  public applyMutation(
    projectPath: string,
    params: {
      type: MutationType;
      filePath: string;
      startLine: number; // 1-indexed
      endLine: number;   // 1-indexed
      replacementCode: string;
      reason: string;
      hypothesisId?: string;
    }
  ): MutationApplicationResult {
    const fullPath = path.resolve(projectPath, params.filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`[VariationOperator] Target file does not exist: ${params.filePath}`);
    }

    const originalContent = fs.readFileSync(fullPath, "utf-8");
    const lines = originalContent.split(/\r?\n/);

    if (params.startLine < 1 || params.endLine > lines.length || params.startLine > params.endLine) {
      throw new Error(
        `[VariationOperator] Invalid line range [${params.startLine}, ${params.endLine}] for file with ${lines.length} lines.`
      );
    }

    const beforeHash = hashString(originalContent);
    const originalChunk = lines.slice(params.startLine - 1, params.endLine).join("\n");

    // Construct mutated content
    const prefix = lines.slice(0, params.startLine - 1);
    const suffix = lines.slice(params.endLine);

    const replacementLines = params.replacementCode === "" ? [] : params.replacementCode.split(/\r?\n/);
    const mutatedLines = [...prefix, ...replacementLines, ...suffix];
    const mutatedContent = mutatedLines.join("\n");
    const afterHash = hashString(mutatedContent);

    // Apply to disk
    fs.writeFileSync(fullPath, mutatedContent, "utf-8");

    const mutation: CodeMutation = {
      mutationId: `mut_${crypto.randomBytes(4).toString("hex")}`,
      type: params.type,
      filePath: params.filePath,
      startLine: params.startLine,
      endLine: params.endLine,
      originalCode: originalChunk,
      replacementCode: params.replacementCode,
      beforeHash,
      afterHash,
      reason: params.reason,
      hypothesisId: params.hypothesisId,
      rollbackMetadata: {
        originalContent,
      },
    };

    return {
      success: true,
      mutation,
      appliedFilePath: fullPath,
    };
  }

  /**
   * Safely rolls back an applied mutation to its exact pre-mutation state.
   */
  public rollbackMutation(projectPath: string, mutation: CodeMutation): boolean {
    if (!mutation.rollbackMetadata?.originalContent) {
      throw new Error(`[VariationOperator] No rollback metadata available for mutation ${mutation.mutationId}`);
    }

    const fullPath = path.resolve(projectPath, mutation.filePath);
    fs.writeFileSync(fullPath, mutation.rollbackMetadata.originalContent, "utf-8");
    return true;
  }
}

export const variationOperator = new VariationOperator();
