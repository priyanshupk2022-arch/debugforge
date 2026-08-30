import * as crypto from "crypto";

export interface TaskMemoryEntry {
  taskId: string;
  runId: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  verifiedFacts: string[];
  rejectedHypotheses: Array<{
    hypothesisId: string;
    description: string;
    targetFile: string;
    rejectedReason: string;
    timestamp: string;
  }>;
  attemptHistory: Array<{
    attemptNumber: number;
    mutationSummary: string;
    patchHash: string;
    verificationResult: "PASS" | "FAIL";
    failureLogs?: string;
    timestamp: string;
  }>;
  activeContext: {
    targetFiles: string[];
    currentHypothesis?: string;
    unresolvedQuestions: string[];
  };
  metrics: {
    totalToolCalls: number;
    totalTokensEstimated: number;
    durationMs: number;
    rollbackCount: number;
  };
}

/**
 * In-memory task state store isolating verified facts, rejected hypotheses, and attempt history.
 */
export class TaskMemoryStore {
  private tasks: Map<string, TaskMemoryEntry> = new Map();

  /**
   * Initializes or retrieves an existing task memory entry.
   */
  public getOrCreateTask(taskId: string, sessionId?: string): TaskMemoryEntry {
    let entry = this.tasks.get(taskId);
    if (!entry) {
      entry = {
        taskId,
        runId: `run_${crypto.randomBytes(4).toString("hex")}`,
        sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verifiedFacts: [],
        rejectedHypotheses: [],
        attemptHistory: [],
        activeContext: {
          targetFiles: [],
          unresolvedQuestions: [],
        },
        metrics: {
          totalToolCalls: 0,
          totalTokensEstimated: 0,
          durationMs: 0,
          rollbackCount: 0,
        },
      };
      this.tasks.set(taskId, entry);
    }
    return entry;
  }

  /**
   * Adds a verified fact to the task memory.
   */
  public addVerifiedFact(taskId: string, fact: string): void {
    const task = this.getOrCreateTask(taskId);
    if (!task.verifiedFacts.includes(fact)) {
      task.verifiedFacts.push(fact);
      task.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Records a rejected hypothesis to prevent the agent from repeating failed theories.
   */
  public recordRejectedHypothesis(
    taskId: string,
    description: string,
    targetFile: string,
    rejectedReason: string
  ): void {
    const task = this.getOrCreateTask(taskId);
    const hypothesisId = `hyp_${crypto.randomBytes(4).toString("hex")}`;
    task.rejectedHypotheses.push({
      hypothesisId,
      description,
      targetFile,
      rejectedReason,
      timestamp: new Date().toISOString(),
    });
    task.updatedAt = new Date().toISOString();
  }

  /**
   * Records an attempt in the history log.
   */
  public recordAttempt(
    taskId: string,
    mutationSummary: string,
    patchHash: string,
    verificationResult: "PASS" | "FAIL",
    failureLogs?: string
  ): void {
    const task = this.getOrCreateTask(taskId);
    const attemptNumber = task.attemptHistory.length + 1;
    task.attemptHistory.push({
      attemptNumber,
      mutationSummary,
      patchHash,
      verificationResult,
      failureLogs,
      timestamp: new Date().toISOString(),
    });
    task.metrics.totalToolCalls += 1;
    task.updatedAt = new Date().toISOString();
  }

  /**
   * Records a rollback event.
   */
  public recordRollback(taskId: string): void {
    const task = this.getOrCreateTask(taskId);
    task.metrics.rollbackCount += 1;
    task.updatedAt = new Date().toISOString();
  }

  /**
   * Returns a sanitized context summary for prompt injection without bloating tokens.
   */
  public buildPromptContextSummary(taskId: string): string {
    const task = this.getOrCreateTask(taskId);
    const sections: string[] = [];

    if (task.verifiedFacts.length > 0) {
      sections.push("### Verified Runtime Facts:\n" + task.verifiedFacts.map((f) => `- ${f}`).join("\n"));
    }

    if (task.rejectedHypotheses.length > 0) {
      sections.push(
        "### Known Rejected Hypotheses (DO NOT REPEAT):\n" +
          task.rejectedHypotheses.map((h) => `- [${h.targetFile}] ${h.description} (Failed: ${h.rejectedReason})`).join("\n")
      );
    }

    if (task.attemptHistory.length > 0) {
      const recentAttempts = task.attemptHistory.slice(-3);
      sections.push(
        "### Recent Attempt Outcomes:\n" +
          recentAttempts
            .map((a) => `- Attempt #${a.attemptNumber}: ${a.mutationSummary} -> ${a.verificationResult}`)
            .join("\n")
      );
    }

    return sections.join("\n\n");
  }

  /**
   * Clears memory for a specific task or all tasks to prevent state leakage.
   */
  public clearTask(taskId: string): void {
    this.tasks.delete(taskId);
  }

  public clearAll(): void {
    this.tasks.clear();
  }
}

export const taskMemory = new TaskMemoryStore();
