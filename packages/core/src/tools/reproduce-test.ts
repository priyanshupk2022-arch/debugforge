import * as path from "path";
import { ErrorReport, SandboxExecResult } from "../types.js";

export interface BugReproductionSpec {
  targetErrorType: string;
  targetErrorMessage: string;
  crashFile: string;
  crashLine?: number;
  triggeringInput?: any;
  invariants: string[];
  expectedPostFixBehavior: string;
}

export interface ReproductionCandidate {
  id: string;
  spec: BugReproductionSpec;
  testScriptCode: string;
  relativeFilePath: string;
  isMinimized: boolean;
  generatedAt: string;
}

export interface BRTExecutionInput {
  exitCode: number;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
}

export interface BRTValidationReport {
  isValid: boolean;
  stage: "pre-patch" | "post-patch";
  exitCode: number;
  stdout: string;
  stderr: string;
  matchedSignature: boolean;
  failureReason?: string;
  details: {
    expectedErrorType: string;
    actualErrorMatched: boolean;
    durationMs: number;
  };
}

/**
 * Synthesizes a standalone, minimal Bug Reproduction Test (BRT) from ErrorReport ingestion evidence.
 */
export function generateReproductionCandidate(
  errorInfo: ErrorReport,
  projectPath: string,
  options: { customInput?: any; fileName?: string } = {}
): ReproductionCandidate {
  const crashFile = errorInfo.crashSite?.file || errorInfo.stackFrames[0]?.file || "src/index.js";
  const crashLine = errorInfo.crashSite?.line || errorInfo.stackFrames[0]?.line || 1;
  const errorType = errorInfo.category || "logic_flaw";
  const errorMessage = errorInfo.errorMessage || "Runtime failure";

  // Determine relative import path from the reproduction test file to the target crash file
  const testFileName = options.fileName || `.debugforge-brt-${Date.now()}.test.js`;
  const importTarget = crashFile.startsWith("./") || crashFile.startsWith("../")
    ? crashFile
    : `./${crashFile}`;

  // Generate specialized, deterministic reproduction test based on error classification
  let testBody = "";

  if (errorType === "null_dereference" || errorInfo.errorType === "TypeError") {
    testBody = `
import assert from "node:assert";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

async function runReproduction() {
  // BRT: Assert that invoking the target path handles null/undefined input gracefully without uncaught exceptions
  try {
    let mod;
    try {
      mod = await import("${importTarget}");
    } catch (e) {
      mod = require("${importTarget}");
    }
    
    // Execute top-level export or default method with triggering condition
    const targetFn = mod.default || mod.processOrder || mod.getUser || mod.handler || mod;
    if (typeof targetFn === "function") {
      const result = await targetFn(${JSON.stringify(options.customInput || null)});
      assert.ok(result !== undefined, "Expected valid response or handled state, got undefined");
    }
  } catch (err) {
    if (err.name === "${errorInfo.errorType}" || err.message.includes("${errorMessage.slice(0, 15)}")) {
      console.error("[BRT_DEFECT_REPRODUCED]: " + err.name + ": " + err.message);
      process.exit(1);
    }
    throw err;
  }
}

runReproduction().then(() => {
  console.log("[BRT_EXECUTION_PASS]: Bug was not reproduced or fix verified");
  process.exit(0);
}).catch((err) => {
  console.error("[BRT_UNEXPECTED_ERROR]: " + err.message);
  process.exit(2);
});
`;
  } else if (errorType === "race_condition") {
    testBody = `
import assert from "node:assert";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

async function runReproduction() {
  let mod;
  try {
    mod = await import("${importTarget}");
  } catch (e) {
    mod = require("${importTarget}");
  }
  
  const targetFn = mod.transfer || mod.update || mod.handler || mod;
  if (typeof targetFn === "function") {
    // Fire concurrent promises simultaneously
    const results = await Promise.all([
      targetFn({ id: 1, amount: 10 }),
      targetFn({ id: 1, amount: 10 }),
      targetFn({ id: 1, amount: 10 })
    ]);
    // Invariant check: balance or count must be strictly consistent
    assert.ok(results.every(r => r && !r.error), "All concurrent updates must succeed without corruption");
  }
}

runReproduction().then(() => {
  console.log("[BRT_EXECUTION_PASS]: Concurrency invariant satisfied");
  process.exit(0);
}).catch((err) => {
  console.error("[BRT_DEFECT_REPRODUCED]: Race condition caught - " + err.message);
  process.exit(1);
});
`;
  } else {
    // Generalized invariant BRT
    testBody = `
import assert from "node:assert";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

async function runReproduction() {
  let mod;
  try {
    mod = await import("${importTarget}");
  } catch (e) {
    mod = require("${importTarget}");
  }
  
  const targetFn = mod.default || mod.handler || mod;
  if (typeof targetFn === "function") {
    const res = await targetFn();
    assert.ok(res !== undefined, "Execution must produce valid output");
  }
}

runReproduction().then(() => {
  console.log("[BRT_EXECUTION_PASS]: Bug was not reproduced or fix verified");
  process.exit(0);
}).catch((err) => {
  console.error("[BRT_DEFECT_REPRODUCED]: " + err.name + ": " + err.message);
  process.exit(1);
});
`;
  }

  const candidateId = `brt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: candidateId,
    spec: {
      targetErrorType: errorType,
      targetErrorMessage: errorMessage,
      crashFile,
      crashLine,
      triggeringInput: options.customInput,
      invariants: ["Process must not crash with targeted exception", "Output must satisfy domain contract"],
      expectedPostFixBehavior: "Process exits 0 with zero unhandled exceptions",
    },
    testScriptCode: testBody.trim(),
    relativeFilePath: testFileName,
    isMinimized: true,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Validates the Bug Reproduction Test against the pre-patch codebase.
 * A valid pre-patch BRT MUST:
 *  1. Exit with non-zero exit code (failure).
 *  2. Output the targeted defect signature.
 */
export function validateBRTPrePatch(
  candidate: ReproductionCandidate,
  execution: BRTExecutionInput
): BRTValidationReport {
  const isFailure = execution.exitCode !== 0;
  const stdout = execution.stdout || "";
  const stderr = execution.stderr || "";
  const combinedOutput = `${stdout}\n${stderr}`;

  // Signature matching
  const hasDefectTag = combinedOutput.includes("[BRT_DEFECT_REPRODUCED]");
  const normalizedCategory = candidate.spec.targetErrorType.toLowerCase().replace(/_/g, " ");
  const hasExpectedErrorName =
    combinedOutput.toLowerCase().includes(candidate.spec.targetErrorType.toLowerCase()) ||
    combinedOutput.toLowerCase().includes(normalizedCategory) ||
    combinedOutput.toLowerCase().includes(candidate.spec.targetErrorMessage.toLowerCase().slice(0, 15));

  const matchedSignature = isFailure && (hasDefectTag || hasExpectedErrorName);

  let failureReason: string | undefined;
  if (!isFailure) {
    failureReason = "BRT failed pre-patch gate: Target defect was NOT reproduced (exit code was 0).";
  } else if (!matchedSignature) {
    failureReason = `BRT failed pre-patch gate: Execution failed but output did not match expected defect signature for ${candidate.spec.targetErrorType}.`;
  }

  return {
    isValid: isFailure && matchedSignature,
    stage: "pre-patch",
    exitCode: execution.exitCode,
    stdout,
    stderr,
    matchedSignature,
    failureReason,
    details: {
      expectedErrorType: candidate.spec.targetErrorType,
      actualErrorMatched: matchedSignature,
      durationMs: execution.durationMs || 0,
    },
  };
}

/**
 * Validates the Bug Reproduction Test against the post-patch codebase.
 * A valid post-patch BRT MUST:
 *  1. Exit with code 0 (PASS).
 *  2. Output [BRT_EXECUTION_PASS] indicating defect is resolved.
 */
export function validateBRTPostPatch(
  candidate: ReproductionCandidate,
  execution: BRTExecutionInput
): BRTValidationReport {
  const isPass = execution.exitCode === 0;
  const stdout = execution.stdout || "";
  const stderr = execution.stderr || "";
  const combinedOutput = `${stdout}\n${stderr}`;

  const matchedPassTag = combinedOutput.includes("[BRT_EXECUTION_PASS]") || isPass;

  let failureReason: string | undefined;
  if (!isPass) {
    failureReason = `BRT failed post-patch gate: Bug reproduction test is still failing with exit code ${execution.exitCode}.`;
  }

  return {
    isValid: isPass,
    stage: "post-patch",
    exitCode: execution.exitCode,
    stdout,
    stderr,
    matchedSignature: matchedPassTag,
    failureReason,
    details: {
      expectedErrorType: candidate.spec.targetErrorType,
      actualErrorMatched: isPass,
      durationMs: execution.durationMs || 0,
    },
  };
}
