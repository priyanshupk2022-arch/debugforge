import * as fs from "fs";
import * as path from "path";
import { CausalProvenanceGraph } from "../causal/provenance.js";
import { TaskMemoryStore, taskMemory } from "../memory/task-memory.js";

export interface SelectiveContextPayload {
  focusedFiles: Array<{
    filePath: string;
    startLine: number;
    endLine: number;
    content: string;
    role: string;
  }>;
  runtimeFacts: string[];
  rejectedHypotheses: string[];
  estimatedTokens: number;
}

export class ContextSelector {
  private memoryStore: TaskMemoryStore;

  constructor(memoryStore: TaskMemoryStore = taskMemory) {
    this.memoryStore = memoryStore;
  }

  /**
   * Builds a tightly scoped context window containing only culprit slices and proven facts.
   */
  public selectContext(
    projectPath: string,
    taskId: string,
    causalGraph: CausalProvenanceGraph,
    windowRadius: number = 25
  ): SelectiveContextPayload {
    const focusedFiles: SelectiveContextPayload["focusedFiles"] = [];
    const filesToRead = new Set([
      causalGraph.crashSite.filePath,
      causalGraph.infectionOrigin.filePath,
    ]);

    for (const relPath of filesToRead) {
      const fullPath = path.resolve(projectPath, relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split(/\r?\n/);

        // Find relevant target line
        const targetLine =
          relPath === causalGraph.crashSite.filePath
            ? causalGraph.crashSite.lineNumber
            : causalGraph.infectionOrigin.lineNumber;

        const startLine = Math.max(1, targetLine - windowRadius);
        const endLine = Math.min(lines.length, targetLine + windowRadius);
        const snippet = lines.slice(startLine - 1, endLine).join("\n");

        focusedFiles.push({
          filePath: relPath,
          startLine,
          endLine,
          content: snippet,
          role: relPath === causalGraph.crashSite.filePath ? "CRASH_SITE" : "INFECTION_ORIGIN",
        });
      }
    }

    const task = this.memoryStore.getOrCreateTask(taskId);
    const runtimeFacts = [...task.verifiedFacts];
    const rejectedHypotheses = task.rejectedHypotheses.map(
      (h) => `[${h.targetFile}] ${h.description} (Reason: ${h.rejectedReason})`
    );

    // Approximate token count: ~4 chars per token
    const totalChars =
      focusedFiles.reduce((acc, f) => acc + f.content.length, 0) +
      runtimeFacts.join(" ").length +
      rejectedHypotheses.join(" ").length;

    return {
      focusedFiles,
      runtimeFacts,
      rejectedHypotheses,
      estimatedTokens: Math.ceil(totalChars / 4),
    };
  }
}

export const contextSelector = new ContextSelector();
