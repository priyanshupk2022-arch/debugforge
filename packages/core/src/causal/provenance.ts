import { ErrorReport, StackFrame } from "../types.js";

export interface CausalNode {
  nodeId: string;
  filePath: string;
  lineNumber: number;
  functionName?: string;
  role: "CRASH_SITE" | "PROXIMATE_CAUSE" | "INFECTION_ORIGIN" | "PROPAGATION_STEP";
  variableObserved?: string;
  stateCorruptionDescription: string;
  confidence: number;
}

export interface CausalProvenanceGraph {
  rootDefectCategory: string;
  crashSite: CausalNode;
  proximateCause: CausalNode;
  infectionOrigin: CausalNode;
  propagationPath: CausalNode[];
  overallConfidence: number;
  evidenceSummary: string;
}

/**
 * Dynamic Causal Provenance Engine constructing structured dependency paths from crash evidence.
 */
export class CausalProvenanceEngine {
  /**
   * Synthesizes a causal provenance graph from an ingested ErrorReport.
   */
  public analyzeProvenance(errorReport: ErrorReport): CausalProvenanceGraph {
    const frames: StackFrame[] = errorReport.stackFrames || [];
    const crashFrame: StackFrame = frames[0] || {
      file: "unknown.js",
      line: 1,
      column: 1,
      functionName: "anonymous",
    };

    const crashSite: CausalNode = {
      nodeId: "node_crash",
      filePath: crashFrame.file,
      lineNumber: crashFrame.line,
      functionName: crashFrame.functionName || "anonymous",
      role: "CRASH_SITE",
      stateCorruptionDescription: `Immediate unhandled exception: ${errorReport.errorMessage}`,
      confidence: 1.0,
    };

    // Proximate cause is the immediate caller or dereference location
    const proximateCause: CausalNode = {
      nodeId: "node_proximate",
      filePath: crashFrame.file,
      lineNumber: crashFrame.line,
      functionName: crashFrame.functionName || "anonymous",
      role: "PROXIMATE_CAUSE",
      stateCorruptionDescription: "Undefined property dereference or failed assertion at invocation point.",
      confidence: 0.95,
    };

    // Find the deepest application frame (not node_modules or runtime internals) for Infection Origin
    const appFrames = frames.filter((f: StackFrame) => !f.file.includes("node_modules") && !f.file.startsWith("node:"));
    const originFrame: StackFrame = appFrames.length > 1 ? appFrames[appFrames.length - 1] : crashFrame;

    const infectionOrigin: CausalNode = {
      nodeId: "node_origin",
      filePath: originFrame.file,
      lineNumber: originFrame.line,
      functionName: originFrame.functionName || "anonymous",
      role: "INFECTION_ORIGIN",
      stateCorruptionDescription: "Initial source of invalid state, swallowed exception, or race condition.",
      confidence: appFrames.length > 1 ? 0.88 : 0.75,
    };

    const propagationPath: CausalNode[] = frames.slice(0, 4).map((f: StackFrame, idx: number) => ({
      nodeId: `node_prop_${idx}`,
      filePath: f.file,
      lineNumber: f.line,
      functionName: f.functionName || "anonymous",
      role: "PROPAGATION_STEP",
      stateCorruptionDescription: `Call frame ${idx}: ${f.functionName || "anonymous"} in ${f.file}`,
      confidence: Math.max(0.6, 1.0 - idx * 0.1),
    }));

    return {
      rootDefectCategory: errorReport.category,
      crashSite,
      proximateCause,
      infectionOrigin,
      propagationPath,
      overallConfidence: infectionOrigin.confidence,
      evidenceSummary: `Causal chain traced from infection origin (${originFrame.file}:${originFrame.line}) to crash site (${crashFrame.file}:${crashFrame.line}) across ${frames.length} stack frames.`,
    };
  }
}

export const causalProvenanceEngine = new CausalProvenanceEngine();
