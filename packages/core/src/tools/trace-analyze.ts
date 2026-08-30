import * as fs from "fs";
import * as path from "path";
import {
  ErrorReport,
  RootCauseAnalysis,
  CausalStep,
  AlternativeHypothesis,
  OracleConfidenceState,
} from "../types.js";
import { causalProvenanceEngine } from "../causal/provenance.js";

export interface TraceOptions {
  errorReport: ErrorReport;
  projectPath: string;
}

/**
 * Dynamically derives culprit symbols and source expressions from code lines on disk.
 */
function extractSourceContext(
  projectPath: string,
  filePath: string,
  lineNumber: number
): { snippet: string; culpritSymbol: string; contextLine: string } {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectPath, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split(/\r?\n/);
      const targetLine = lines[lineNumber - 1] || "";
      const start = Math.max(0, lineNumber - 3);
      const end = Math.min(lines.length, lineNumber + 2);
      const snippet = lines.slice(start, end).join("\n");

      // Extract function, method, or variable identifier
      const fnMatch = targetLine.match(/(?:function|const|let|var|async)\s+([a-zA-Z0-9_$]+)/);
      const methodMatch = targetLine.match(/([a-zA-Z0-9_$]+)\s*\(/);
      const propMatch = targetLine.match(/([a-zA-Z0-9_$]+)\.[a-zA-Z0-9_$]+/);

      const culpritSymbol =
        fnMatch?.[1] || methodMatch?.[1] || propMatch?.[1] || "expression";

      return { snippet, culpritSymbol, contextLine: targetLine.trim() };
    }
  } catch {}
  return { snippet: "", culpritSymbol: "unknown", contextLine: "" };
}

/**
 * Dynamic Root Cause Analysis deriving backward causal provenance and alternative hypotheses without hardcoded fixture strings.
 */
export async function traceAndAnalyze(options: TraceOptions): Promise<RootCauseAnalysis> {
  const { errorReport, projectPath } = options;

  // 1. Dynamic Causal Provenance
  const provenance = causalProvenanceEngine.analyzeProvenance(errorReport);
  const infectionNode = provenance.infectionOrigin;
  const crashNode = provenance.crashSite;

  // 2. Introspect source code at infection and crash sites
  const infectionSource = extractSourceContext(projectPath, infectionNode.filePath, infectionNode.lineNumber);
  const crashSource = extractSourceContext(projectPath, crashNode.filePath, crashNode.lineNumber);

  const culpritSymbol =
    infectionNode.functionName !== "anonymous"
      ? infectionNode.functionName
      : infectionSource.culpritSymbol;

  // 3. Dynamic Remediation and Root Explanation Synthesis
  let rootExplanation = "";
  let symptomExplanation = errorReport.errorMessage || "Runtime exception occurred.";
  let remediationStrategy = "";
  let oracleState: OracleConfidenceState = "INFERRED";

  switch (errorReport.category) {
    case "null_dereference":
      rootExplanation = `Unchecked null or undefined value generated in ${infectionNode.filePath}:${infectionNode.lineNumber} (${culpritSymbol}) propagates to caller without guard.`;
      symptomExplanation = `Dereference of undefined/null reference at ${crashNode.filePath}:${crashNode.lineNumber} violates runtime invariants.`;
      remediationStrategy = `Add safe guard condition / fallback default at ${infectionNode.filePath} and input validation before dereferencing at ${crashNode.filePath}.`;
      oracleState = "PROVEN";
      break;

    case "race_condition":
      rootExplanation = `Asynchronous mutation of shared state in ${infectionNode.filePath}:${infectionNode.lineNumber} (${culpritSymbol}) lacks synchronization or atomic locking.`;
      symptomExplanation = `Concurrent task interleaving produces non-deterministic state corruption at ${crashNode.filePath}:${crashNode.lineNumber}.`;
      remediationStrategy = `Wrap shared state updates in an async mutex lock or atomic increment helper.`;
      oracleState = "PROVEN";
      break;

    case "memory_leak":
      rootExplanation = `Data accumulation in ${infectionNode.filePath}:${infectionNode.lineNumber} (${culpritSymbol}) retains references without eviction, LRU limits, or cleanup.`;
      symptomExplanation = `Continuous heap expansion under load eventually exhausts Node.js memory quota.`;
      remediationStrategy = `Introduce bounded cache / ring buffer with explicit TTL or size cap in ${infectionNode.filePath}.`;
      oracleState = "PROVEN";
      break;

    case "unhandled_promise":
      rootExplanation = `Promise rejection in ${infectionNode.filePath}:${infectionNode.lineNumber} (${culpritSymbol}) is unhandled or missing a catch handler.`;
      symptomExplanation = `Uncaught promise rejection terminates or destabilizes runtime process.`;
      remediationStrategy = `Add structured try/catch or .catch() handler around async operation.`;
      oracleState = "PROVEN";
      break;

    case "type_mismatch":
      rootExplanation = `Type contract violation in ${infectionNode.filePath}:${infectionNode.lineNumber} (${culpritSymbol}); received unexpected argument or return type.`;
      symptomExplanation = `Method invocation on incompatible data type at ${crashNode.filePath}:${crashNode.lineNumber}.`;
      remediationStrategy = `Introduce runtime type assertions / Zod parsing before processing data.`;
      oracleState = "INFERRED";
      break;

    case "timeout_deadlock":
      rootExplanation = `Asynchronous resource acquisition or unresolved promise in ${infectionNode.filePath}:${infectionNode.lineNumber} hangs indefinitely.`;
      symptomExplanation = `Test or request execution exceeds configured timeout window.`;
      remediationStrategy = `Add explicit timeout boundary and promise cancellation / release mechanism.`;
      oracleState = "INFERRED";
      break;

    default:
      rootExplanation = `Logic defect or unhandled edge case in ${infectionNode.filePath}:${infectionNode.lineNumber} (${culpritSymbol}).`;
      symptomExplanation = errorReport.errorMessage;
      remediationStrategy = `Verify function invariants and boundary conditions in ${infectionNode.filePath}.`;
      oracleState = errorReport.stackFrames.length > 0 ? "INFERRED" : "AMBIGUOUS";
      break;
  }

  // 4. Construct Causal Step Chain from Provenance
  const causalChain: CausalStep[] = [];

  // Step 1: Infection Origin
  causalChain.push({
    step: 1,
    location: `${infectionNode.filePath}:${infectionNode.lineNumber}`,
    description: `State infection originates at ${infectionNode.functionName || culpritSymbol || "entrypoint"}: ${rootExplanation}`,
    stateMutation: infectionSource.contextLine || "invalid state produced",
    isInfectionOrigin: true,
    isCrashSite: false,
  });

  // Steps 2..N: Propagation frames
  let stepCounter = 2;
  for (const propNode of provenance.propagationPath) {
    if (
      propNode.filePath !== infectionNode.filePath ||
      propNode.lineNumber !== infectionNode.lineNumber
    ) {
      causalChain.push({
        step: stepCounter++,
        location: `${propNode.filePath}:${propNode.lineNumber}`,
        description: `Corrupted state propagates through frame: ${propNode.functionName || "caller"}`,
        stateMutation: propNode.stateCorruptionDescription,
        isInfectionOrigin: false,
        isCrashSite: propNode.role === "CRASH_SITE",
      });
    }
  }

  // Ensure Crash Site is explicitly marked at the end
  if (!causalChain.some((c) => c.isCrashSite)) {
    causalChain.push({
      step: stepCounter,
      location: `${crashNode.filePath}:${crashNode.lineNumber}`,
      description: `Crash observed: ${symptomExplanation}`,
      stateMutation: "CRASH",
      isInfectionOrigin: false,
      isCrashSite: true,
    });
  }

  // 5. Formulate Alternative Hypotheses for Disambiguation
  const alternativeHypotheses: AlternativeHypothesis[] = [
    {
      id: "hyp_primary_origin",
      description: `Infection origin at ${infectionNode.filePath}:${infectionNode.lineNumber}`,
      culpritFile: infectionNode.filePath,
      culpritLine: infectionNode.lineNumber,
      likelihood: provenance.overallConfidence,
      reasoning: `Deepest non-internal application frame on stack trace with observable state mutation.`,
    },
    {
      id: "hyp_proximate_guard",
      description: `Missing defensive guard at crash site ${crashNode.filePath}:${crashNode.lineNumber}`,
      culpritFile: crashNode.filePath,
      culpritLine: crashNode.lineNumber,
      likelihood: Math.max(0.2, 1.0 - provenance.overallConfidence),
      reasoning: `Caller site lacks defensive validation to handle unexpected inputs gracefully.`,
    },
  ];

  return {
    errorId: errorReport.id,
    infectionOrigin: {
      file: infectionNode.filePath,
      line: infectionNode.lineNumber,
      culpritSymbol,
      rootExplanation,
    },
    crashSite: {
      file: errorReport.crashSite.file,
      line: errorReport.crashSite.line,
      symptomExplanation,
    },
    causalChain,
    remediationStrategy,
    confidence: provenance.overallConfidence,
    oracleState,
    alternativeHypotheses,
    evidenceSummary: provenance.evidenceSummary,
  };
}
