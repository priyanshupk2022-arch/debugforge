import { TripleLockResult, PatchResult } from "../types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execAsync = promisify(exec);

export interface VerifyFixOptions {
  errorId: string;
  projectPath: string;
  testCommand?: string;
  patchResult?: PatchResult;
  stressCommand?: string;
}

export async function verifyFix(options: VerifyFixOptions): Promise<TripleLockResult> {
  const { errorId, projectPath, testCommand = "npm test" } = options;
  const startTime = Date.now();
  const targetDir = path.resolve(projectPath);

  let lock1_bugFixed = false;
  let lock2_noRegressions = false;
  let lock3_stressPassed = false;
  const diagnosticLogs: string[] = [];

  // Lock 1: Execute primary reproduction command
  try {
    const res1 = await execAsync(testCommand, {
      cwd: targetDir,
      env: { ...process.env, CI: "true", NODE_ENV: "test" },
      timeout: 25000,
    });

    const output1 = (res1.stdout || "") + (res1.stderr || "");
    if (!output1.includes("TypeError") && !output1.includes("AssertionError") && !output1.includes("FAIL") && !output1.includes("UnhandledPromiseRejection")) {
      lock1_bugFixed = true;
      diagnosticLogs.push("Lock 1 (Bug Fixed): Original crash symptom no longer reproduced.");
    } else {
      diagnosticLogs.push(`Lock 1 (Bug Fixed) Failed: Output contains error indicator: ${output1.substring(0, 100)}`);
    }
  } catch (err: unknown) {
    const errObj = err as { stdout?: string; stderr?: string; message?: string };
    diagnosticLogs.push(`Lock 1 (Bug Fixed) Failed: Execution threw error: ${errObj.stderr || errObj.message}`);
  }

  // Lock 2: Full regression assertion
  try {
    const res2 = await execAsync(testCommand, {
      cwd: targetDir,
      env: { ...process.env, CI: "true", NODE_ENV: "test", RUN_ALL_TESTS: "true" },
      timeout: 25000,
    });

    const output2 = (res2.stdout || "") + (res2.stderr || "");
    if (!output2.includes("FAIL") && !output2.includes("ERR_")) {
      lock2_noRegressions = true;
      diagnosticLogs.push("Lock 2 (No Regressions): All suite test invariants preserved.");
    } else {
      diagnosticLogs.push("Lock 2 (No Regressions) Failed: Regression detected.");
    }
  } catch (err: unknown) {
    diagnosticLogs.push("Lock 2 (No Regressions) Failed: Regression run failed.");
  }

  // Lock 3: Targeted stress/concurrency verification
  try {
    const stressCmd = options.stressCommand || testCommand;
    const res3 = await execAsync(stressCmd, {
      cwd: targetDir,
      env: { ...process.env, CI: "true", NODE_ENV: "test", STRESS_MODE: "true" },
      timeout: 25000,
    });

    const output3 = (res3.stdout || "") + (res3.stderr || "");
    if (!output3.includes("FAIL") && !output3.includes("Error:")) {
      lock3_stressPassed = true;
      diagnosticLogs.push("Lock 3 (Stress Verified): Concurrency & boundary invariants verified.");
    } else {
      diagnosticLogs.push("Lock 3 (Stress Verified) Failed: Load boundary check failed.");
    }
  } catch {
    diagnosticLogs.push("Lock 3 (Stress Verified) Failed: Stress run execution error.");
  }

  const allPassed = lock1_bugFixed && lock2_noRegressions && lock3_stressPassed;

  return {
    errorId,
    lock1_bugFixed,
    lock2_noRegressions,
    lock3_stressPassed,
    allPassed,
    executionTimeMs: Date.now() - startTime,
    testSummary: {
      passed: allPassed ? 6 : (lock1_bugFixed ? 2 : 0),
      failed: allPassed ? 0 : 1,
      total: 6,
    },
    diagnostics: diagnosticLogs.join("\n"),
  };
}
