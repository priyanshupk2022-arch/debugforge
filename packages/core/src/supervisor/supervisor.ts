import { TaskMemoryStore, taskMemory } from "../memory/task-memory.js";

export interface TrajectoryAnomaly {
  type: "REPEATED_FAILURE" | "OSCILLATING_EDITS" | "STAGNANT_PROGRESS" | "EXCESSIVE_RETRIES";
  severity: "HIGH" | "CRITICAL";
  details: string;
  recommendedAction: "STRATEGY_RESET" | "ROLLBACK_CHECKPOINT" | "EXPAND_SEARCH_RADIUS";
}

export interface SupervisorInterventionResult {
  intervened: boolean;
  anomaly?: TrajectoryAnomaly;
  directive?: string;
  resetInstructions?: string[];
}

export interface SupervisorConfig {
  maxRepeatedFailures: number; // default: 3
  maxTotalAttempts: number;    // default: 10
  stagnationStepBudget: number;// default: 4
}

export class AutonomousSupervisor {
  private memoryStore: TaskMemoryStore;
  private config: SupervisorConfig;

  constructor(memoryStore: TaskMemoryStore = taskMemory, config: Partial<SupervisorConfig> = {}) {
    this.memoryStore = memoryStore;
    this.config = {
      maxRepeatedFailures: config.maxRepeatedFailures ?? 3,
      maxTotalAttempts: config.maxTotalAttempts ?? 10,
      stagnationStepBudget: config.stagnationStepBudget ?? 4,
    };
  }

  /**
   * Evaluates the active agent debugging trajectory and detects loops, oscillation, or stagnation.
   */
  public evaluateTrajectory(taskId: string): SupervisorInterventionResult {
    const task = this.memoryStore.getOrCreateTask(taskId);
    const history = task.attemptHistory;

    if (history.length === 0) {
      return { intervened: false };
    }

    // 1. Check for repeated identical failure logs (>= maxRepeatedFailures)
    if (history.length >= this.config.maxRepeatedFailures) {
      const recent = history.slice(-this.config.maxRepeatedFailures);
      const allFailed = recent.every((a) => a.verificationResult === "FAIL");
      const firstFailureLog = recent[0].failureLogs;
      const identicalFailures = allFailed && recent.every((a) => a.failureLogs && a.failureLogs === firstFailureLog);

      if (identicalFailures) {
        const anomaly: TrajectoryAnomaly = {
          type: "REPEATED_FAILURE",
          severity: "HIGH",
          details: `The exact same failure signature occurred ${this.config.maxRepeatedFailures} times consecutively. Current hypothesis is invalid.`,
          recommendedAction: "STRATEGY_RESET",
        };

        return {
          intervened: true,
          anomaly,
          directive: "SUPERVISOR INTERVENTION: Current repair strategy is stuck in an invariant failure loop. Invalidate current hypothesis, rollback last edit, and investigate upstream call chain.",
          resetInstructions: [
            "Rollback recent patch to last clean checkpoint.",
            "Mark current hypothesis as REJECTED in TaskMemory.",
            "Re-examine stack frame at depth N-1 (upstream caller).",
          ],
        };
      }
    }

    // 2. Check for oscillating patch hashes
    if (history.length >= 4) {
      const lastFour = history.slice(-4);
      const isOscillating =
        lastFour[0].patchHash === lastFour[2].patchHash &&
        lastFour[1].patchHash === lastFour[3].patchHash &&
        lastFour[0].patchHash !== lastFour[1].patchHash;

      if (isOscillating) {
        const anomaly: TrajectoryAnomaly = {
          type: "OSCILLATING_EDITS",
          severity: "CRITICAL",
          details: "Agent is oscillating between two mutually incompatible patch variations.",
          recommendedAction: "ROLLBACK_CHECKPOINT",
        };

        return {
          intervened: true,
          anomaly,
          directive: "SUPERVISOR INTERVENTION: Oscillating edit pattern detected. Both current patch variations fail independent gates. Abort current branch.",
          resetInstructions: [
            "Purge both oscillating patch hashes from candidate pool.",
            "Re-synthesize Bug Reproduction Test (BRT) with broader domain invariant checks.",
          ],
        };
      }
    }

    // 3. Check for excessive retries exceeding budget
    if (history.length >= this.config.maxTotalAttempts) {
      const anomaly: TrajectoryAnomaly = {
        type: "EXCESSIVE_RETRIES",
        severity: "CRITICAL",
        details: `Task exceeded maximum retry budget of ${this.config.maxTotalAttempts} attempts without convergence.`,
        recommendedAction: "STRATEGY_RESET",
      };

      return {
        intervened: true,
        anomaly,
        directive: "SUPERVISOR INTERVENTION: Total attempt budget exhausted. Pause autonomous execution and request Human-in-the-Loop guidance.",
        resetInstructions: ["Halt automated loop.", "Emit structured diagnostic summary to operator."],
      };
    }

    return { intervened: false };
  }
}

export const autonomousSupervisor = new AutonomousSupervisor();
