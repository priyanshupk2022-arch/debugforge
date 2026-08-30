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

export const OracleConfidenceStateSchema = z.enum(["PROVEN", "INFERRED", "AMBIGUOUS"]);
export type OracleConfidenceState = z.infer<typeof OracleConfidenceStateSchema>;

export const AlternativeHypothesisSchema = z.object({
  id: z.string(),
  description: z.string(),
  culpritFile: z.string(),
  culpritLine: z.number().optional(),
  likelihood: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type AlternativeHypothesis = z.infer<typeof AlternativeHypothesisSchema>;

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
  oracleState: OracleConfidenceStateSchema.optional().default("INFERRED"),
  alternativeHypotheses: z.array(AlternativeHypothesisSchema).optional(),
  evidenceSummary: z.string().optional(),
});

export type CausalStep = z.infer<typeof CausalStepSchema>;
export type RootCauseAnalysis = z.infer<typeof RootCauseAnalysisSchema>;

// Blast Radius Types
export const BlastRadiusResultSchema = z.object({
  targetFile: z.string(),
  changedSymbols: z.array(z.string()),
  directCallerFiles: z.array(z.string()),
  dependentTestFiles: z.array(z.string()),
  exportedSymbols: z.array(z.string()),
  widenVerificationRequired: z.boolean(),
  recommendedTestScope: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});
export type BlastRadiusResult = z.infer<typeof BlastRadiusResultSchema>;

// Mutation Verification Types
export const MutantResultSchema = z.object({
  mutantId: z.string(),
  filePath: z.string(),
  lineNumber: z.number(),
  mutationType: z.string(),
  originalCode: z.string(),
  mutatedCode: z.string(),
  status: z.enum(["KILLED", "SURVIVED", "ERROR"]),
  executionDetails: z.string().optional(),
});
export type MutantResult = z.infer<typeof MutantResultSchema>;

export const MutationVerificationResultSchema = z.object({
  totalMutants: z.number(),
  killedMutants: z.number(),
  survivedMutants: z.number(),
  mutationScore: z.number().min(0).max(1),
  passed: z.boolean(),
  mutants: z.array(MutantResultSchema),
  diagnostics: z.string(),
});
export type MutationVerificationResult = z.infer<typeof MutationVerificationResultSchema>;

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
  blastRadius: BlastRadiusResultSchema.optional(),
  mutationReport: MutationVerificationResultSchema.optional(),
});

export type FilePatch = z.infer<typeof FilePatchSchema>;
export type PatchResult = z.infer<typeof PatchResultSchema>;

// Triple-Lock Verification Types
export const TripleLockResultSchema = z.object({
  errorId: z.string(),
  lock1_bugFixed: z.boolean(),
  lock2_noRegressions: z.boolean(),
  lock3_stressPassed: z.boolean(),
  mutationScore: z.number().min(0).max(1).optional(),
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
  | { type: "supervisor_intervention"; anomaly: unknown; directive: string; timestamp: number }
  | { type: "approval_requested"; patch: PatchResult; nonce: string; timestamp: number }
  | { type: "complete"; summary: string; success: boolean; timestamp: number };

export interface AgentOptions {
  prompt?: string;
  rawError?: string;
  projectPath?: string;
  testCommand?: string;
  autoApprove?: boolean;
  maxAttempts?: number;
}


