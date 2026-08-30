export interface PerturbationConfig {
  minDelayMs: number;
  maxDelayMs: number;
  injectionProbability: number;
}

/**
 * Concurrency Schedule Perturbation engine introducing microsecond async jitter to expose race conditions.
 */
export class ConcurrencyPerturbationEngine {
  private config: PerturbationConfig;

  constructor(config: Partial<PerturbationConfig> = {}) {
    this.config = {
      minDelayMs: config.minDelayMs ?? 1,
      maxDelayMs: config.maxDelayMs ?? 20,
      injectionProbability: config.injectionProbability ?? 0.8,
    };
  }

  /**
   * Generates a code snippet to inject microsecond async delay jitter around suspect promise boundaries.
   */
  public generatePerturbationWrapper(targetFunctionName: string): string {
    return `// DEBUGFORGE_PERTURBATION: Injected async scheduling jitter
const __original_${targetFunctionName} = ${targetFunctionName};
${targetFunctionName} = async function(...args) {
  if (Math.random() < ${this.config.injectionProbability}) {
    const jitter = Math.floor(Math.random() * (${this.config.maxDelayMs} - ${this.config.minDelayMs} + 1)) + ${this.config.minDelayMs};
    await new Promise((resolve) => setTimeout(resolve, jitter));
  }
  return __original_${targetFunctionName}.apply(this, args);
};`;
  }

  /**
   * Evaluates if a concurrent workload exhibits race condition flakes across perturbed runs.
   */
  public async executePerturbedStress(
    workloadFn: () => Promise<boolean>,
    iterations: number = 10
  ): Promise<{
    totalIterations: number;
    passedIterations: number;
    failedIterations: number;
    isDeterministic: boolean;
  }> {
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await workloadFn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return {
      totalIterations: iterations,
      passedIterations: passed,
      failedIterations: failed,
      isDeterministic: failed === 0 || passed === 0,
    };
  }
}

export const concurrencyPerturbationEngine = new ConcurrencyPerturbationEngine();
