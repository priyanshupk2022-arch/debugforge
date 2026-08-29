import { z } from "zod";

// Error Ingestion & Diagnostic Types
export const StackFrameSchema = z.object({
  file: z.string(),
  line: z.number(),
  column: z.number().optional(),
  functionName: z.string().optional(),
  snippet: z.string().optional(),
});

export const ErrorReportSchema = z.object({
  id: z.string(),
  errorType: z.string(),
  errorMessage: z.string(),
  crashSite: z.object({
    file: z.string(),
    line: z.number(),
    column: z.number().optional(),
  }),
  stackFrames: z.array(StackFrameSchema),
  category: z.enum([
    "null_dereference",
    "race_condition",
    "memory_leak",
    "unhandled_promise",
    "type_mismatch",
    "timeout_deadlock",
    "environment_drift",
    "logic_flaw",
  ]),
  rawLog: z.string(),
  timestamp: z.number(),
});

export type StackFrame = z.infer<typeof StackFrameSchema>;
export type ErrorReport = z.infer<typeof ErrorReportSchema>;

// Sandbox Reproduction Types
export const SandboxExecResultSchema = z.object({
  workspaceId: z.string(),
  command: z.string(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  durationMs: z.number(),
  reproduced: z.boolean(),
  isolatedPath: z.string(),
});

export type SandboxExecResult = z.infer<typeof SandboxExecResultSchema>;

// Root Cause Analysis Types
export const CausalStepSchema = z.object({
  step: z.number(),
  location: z.string(),
  description: z.string(),
  stateMutation: z.string().optional(),
  isInfectionOrigin: z.boolean().default(false),
  isCrashSite: z.boolean().default(false),
});

export const RootCauseAnalysisSchema = z.object({
  errorId: z.string(),
  infectionOrigin: z.object({
    file: z.string(),
    line: z.number(),
    culpritSymbol: z.string().optional(),
    rootExplanation: z.string(),
  }),
  crashSite: z.object({
    file: z.string(),
    line: z.number(),
    symptomExplanation: z.string(),
  }),
  causalChain: z.array(CausalStepSchema),
  remediationStrategy: z.string(),
  confidence: z.number().min(0).max(1),
});

export type CausalStep = z.infer<typeof CausalStepSchema>;
export type RootCauseAnalysis = z.infer<typeof RootCauseAnalysisSchema>;

// Code Patch & Diff Types
export const FilePatchSchema = z.object({
  filePath: z.string(),
  originalCode: z.string(),
  patchedCode: z.string(),
  diffHunk: z.string(),
  purpose: z.string(),
});

export const PatchResultSchema = z.object({
  id: z.string(),
  errorId: z.string(),
  patches: z.array(FilePatchSchema),
  summary: z.string(),
  synthesizedAt: z.number(),
});

export type FilePatch = z.infer<typeof FilePatchSchema>;
export type PatchResult = z.infer<typeof PatchResultSchema>;

// Triple-Lock Verification Types
export const TripleLockResultSchema = z.object({
  errorId: z.string(),
  lock1_bugFixed: z.boolean(),
  lock2_noRegressions: z.boolean(),
  lock3_stressPassed: z.boolean(),
  allPassed: z.boolean(),
  executionTimeMs: z.number(),
  testSummary: z.object({
    passed: z.number(),
    failed: z.number(),
    total: z.number(),
  }),
  diagnostics: z.string(),
});

export type TripleLockResult = z.infer<typeof TripleLockResultSchema>;

// Human-In-The-Loop Approval Types
export const HITLApprovalSchema = z.object({
  patchId: z.string(),
  status: z.enum(["pending", "approved", "rejected", "edited"]),
  decisionBy: z.string().default("human_operator"),
  feedback: z.string().optional(),
  timestamp: z.number(),
});

export type HITLApproval = z.infer<typeof HITLApprovalSchema>;

// Agent Lifecycle Event Types
export type AgentEvent =
  | { type: "thought"; content: string; timestamp: number }
  | { type: "tool_call"; tool: string; args: Record<string, unknown>; timestamp: number }
  | { type: "tool_result"; tool: string; result: unknown; timestamp: number }
  | { type: "trace_discovered"; rca: RootCauseAnalysis; timestamp: number }
  | { type: "patch_generated"; patch: PatchResult; timestamp: number }
  | { type: "verification_complete"; verification: TripleLockResult; timestamp: number }
  | { type: "approval_requested"; patch: PatchResult; nonce: string; timestamp: number }
  | { type: "complete"; summary: string; success: boolean; timestamp: number };
