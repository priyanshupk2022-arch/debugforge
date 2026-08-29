import { ErrorReport, StackFrame } from "../types.js";
import crypto from "node:crypto";

export function ingestError(rawLog: string): ErrorReport {
  const lines = rawLog.split(/\r?\n/);
  let errorType = "UnknownError";
  let errorMessage = "An unhandled runtime error occurred";
  const stackFrames: StackFrame[] = [];
  let category: ErrorReport["category"] = "logic_flaw";

  // Check for common error types
  const errorMatch = rawLog.match(/([A-Z][a-zA-Z0-9_]*Error|TypeError|ReferenceError|RangeError|SyntaxError):\s*(.*)/);
  if (errorMatch) {
    errorType = errorMatch[1];
    errorMessage = errorMatch[2]?.trim() || errorMessage;
  }

  // Determine error category based on patterns
  const lowerLog = rawLog.toLowerCase();
  if (lowerLog.includes("cannot read property") || lowerLog.includes("cannot read properties of undefined") || lowerLog.includes("is undefined") || lowerLog.includes("null pointer")) {
    category = "null_dereference";
  } else if (lowerLog.includes("race condition") || lowerLog.includes("concurrency") || lowerLog.includes("lock") || lowerLog.includes("corrupted state")) {
    category = "race_condition";
  } else if (lowerLog.includes("memory leak") || lowerLog.includes("heap out of memory") || lowerLog.includes("maxlisteners exceeded")) {
    category = "memory_leak";
  } else if (lowerLog.includes("unhandledpromiserejection") || lowerLog.includes("unhandled rejection")) {
    category = "unhandled_promise";
  } else if (lowerLog.includes("timed out") || lowerLog.includes("timeout of") || lowerLog.includes("deadlock")) {
    category = "timeout_deadlock";
  }

  // Parse stack trace frames
  for (const line of lines) {
    const frameMatch = line.match(/at\s+(?:(.+?)\s+\()?(?:file:\/\/\/)?([a-zA-Z]:[\\/][^:]+|\/[^:]+|[a-zA-Z0-9_./\\-]+):(\d+):(\d+)\)?/);
    if (frameMatch) {
      const functionName = frameMatch[1] || "<anonymous>";
      const file = frameMatch[2];
      const lineNum = parseInt(frameMatch[3], 10);
      const column = parseInt(frameMatch[4], 10);

      // Filter out internal node modules
      if (!file.includes("node:internal") && !file.includes("node_modules")) {
        stackFrames.push({
          file: file.replace(/\\/g, "/"),
          line: lineNum,
          column,
          functionName,
        });
      }
    }
  }

  const primaryFrame = stackFrames[0] || {
    file: "src/index.ts",
    line: 1,
    column: 1,
  };

  return {
    id: `err_${crypto.randomBytes(6).toString("hex")}`,
    errorType,
    errorMessage,
    crashSite: {
      file: primaryFrame.file,
      line: primaryFrame.line,
      column: primaryFrame.column,
    },
    stackFrames,
    category,
    rawLog,
    timestamp: Date.now(),
  };
}
