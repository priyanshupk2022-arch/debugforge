import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export type ProbeType = "log_variable" | "state_snapshot" | "timing_checkpoint" | "invariant_assert";

export interface RuntimeProbe {
  probeId: string;
  type: ProbeType;
  filePath: string;
  line: number;
  expressionToObserve: string;
  injectedCode: string;
  originalFileContent: string;
  active: boolean;
}

export class RuntimeProbeManager {
  private activeProbes: Map<string, RuntimeProbe> = new Map();

  /**
   * Injects a temporary non-invasive observation probe into a target file.
   */
  public injectProbe(
    projectPath: string,
    params: {
      type: ProbeType;
      filePath: string;
      line: number; // 1-indexed insertion point
      expressionToObserve: string;
    }
  ): RuntimeProbe {
    const fullPath = path.resolve(projectPath, params.filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`[RuntimeProbe] Target file does not exist: ${params.filePath}`);
    }

    const originalContent = fs.readFileSync(fullPath, "utf-8");
    const lines = originalContent.split(/\r?\n/);

    const probeId = `probe_${crypto.randomBytes(4).toString("hex")}`;
    let injectedStatement = "";

    switch (params.type) {
      case "log_variable":
        injectedStatement = `/* DEBUGFORGE_PROBE:${probeId} */ console.error("[DEBUGFORGE_OBSERVATION:${params.expressionToObserve}]", JSON.stringify(${params.expressionToObserve}));`;
        break;
      case "state_snapshot":
        injectedStatement = `/* DEBUGFORGE_PROBE:${probeId} */ console.error("[DEBUGFORGE_SNAPSHOT:${params.expressionToObserve}]", JSON.stringify({ timestamp: Date.now(), state: ${params.expressionToObserve} }));`;
        break;
      case "timing_checkpoint":
        injectedStatement = `/* DEBUGFORGE_PROBE:${probeId} */ console.error("[DEBUGFORGE_TIMING:${params.expressionToObserve}]", performance.now());`;
        break;
      case "invariant_assert":
        injectedStatement = `/* DEBUGFORGE_PROBE:${probeId} */ if (!(${params.expressionToObserve})) { console.error("[DEBUGFORGE_INVARIANT_VIOLATION]", "${params.expressionToObserve}"); }`;
        break;
    }

    // Insert probe line before target line
    const insertIdx = Math.max(0, Math.min(lines.length, params.line - 1));
    lines.splice(insertIdx, 0, injectedStatement);
    const mutatedContent = lines.join("\n");

    fs.writeFileSync(fullPath, mutatedContent, "utf-8");

    const probe: RuntimeProbe = {
      probeId,
      type: params.type,
      filePath: params.filePath,
      line: params.line,
      expressionToObserve: params.expressionToObserve,
      injectedCode: injectedStatement,
      originalFileContent: originalContent,
      active: true,
    };

    this.activeProbes.set(probeId, probe);
    return probe;
  }

  /**
   * Cleans up and removes a specific injected probe, restoring the original source file.
   */
  public removeProbe(projectPath: string, probeId: string): boolean {
    const probe = this.activeProbes.get(probeId);
    if (!probe) return false;

    const fullPath = path.resolve(projectPath, probe.filePath);
    if (fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, probe.originalFileContent, "utf-8");
    }

    this.activeProbes.delete(probeId);
    return true;
  }

  /**
   * Reverts all active runtime probes across the entire workspace.
   */
  public cleanupAllProbes(projectPath: string): number {
    let count = 0;
    for (const [probeId] of this.activeProbes) {
      if (this.removeProbe(projectPath, probeId)) {
        count++;
      }
    }
    return count;
  }
}

export const runtimeProbeManager = new RuntimeProbeManager();
