/**
 * DebugForge Test Harness - Interface Contracts & Validation Schemas
 * Based on PROJECT.md and Explorer Survey specifications.
 */

const { z } = require('zod');

// 1. Error Ingestion Models
const StackFrameSchema = z.object({
  file: z.string().min(1),
  line: z.number().int().positive(),
  column: z.number().int().nonnegative().optional().default(0),
  functionName: z.string().default('<anonymous>'),
  isInternal: z.boolean().default(false),
  codeSnippet: z.object({
    before: z.array(z.string()).default([]),
    line: z.string().default(''),
    after: z.array(z.string()).default([]),
  }).optional(),
});

const FailingTestInfoSchema = z.object({
  suiteName: z.string().min(1),
  testName: z.string().min(1),
  expected: z.string().optional(),
  actual: z.string().optional(),
  errorMessage: z.string().min(1),
});

const ParsedErrorPayloadSchema = z.object({
  errorType: z.string().min(1),
  message: z.string().min(1),
  rawLog: z.string(),
  stackFrames: z.array(StackFrameSchema),
  failingTest: FailingTestInfoSchema.optional(),
  environment: z.object({
    nodeVersion: z.string(),
    platform: z.string(),
    cwd: z.string(),
  }),
});

// 2. Sandbox Execution Models
const SandboxExecutionResultSchema = z.object({
  sandboxId: z.string().min(1),
  sandboxType: z.enum(['daytona', 'local']),
  reproduced: z.boolean(),
  exitCode: z.number().int(),
  stdout: z.string(),
  stderr: z.string(),
  durationMs: z.number().nonnegative(),
  matchedSignature: z.boolean(),
  timestamp: z.string(),
});

// 3. Causal Tracing Models
const CausalNodeTypeEnum = z.enum(['INFECTION_ORIGIN', 'PROPAGATION_STEP', 'CRASH_SITE']);

const CausalNodeSchema = z.object({
  id: z.string().min(1),
  type: CausalNodeTypeEnum,
  file: z.string().min(1),
  line: z.number().int().positive(),
  column: z.number().int().nonnegative().optional(),
  symbolName: z.string().default(''),
  expression: z.string().default(''),
  description: z.string().default(''),
  stateSnapshot: z.record(z.unknown()).optional(),
});

const CausalTraceGraphSchema = z.object({
  rootCause: CausalNodeSchema,
  propagationPath: z.array(CausalNodeSchema),
  crashSite: CausalNodeSchema,
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1),
  graphAscii: z.string().min(1),
});

// 4. Patch Synthesis & Triple-Lock Models
const FilePatchSchema = z.object({
  filePath: z.string().min(1),
  originalContent: z.string(),
  patchedContent: z.string(),
  diff: z.string(),
});

const LockVerificationResultSchema = z.object({
  lockName: z.enum(['Lock 1 (Target Test)', 'Lock 2 (Full Suite)', 'Lock 3 (Stress Test)']),
  passed: z.boolean(),
  command: z.string(),
  exitCode: z.number().int(),
  durationMs: z.number().nonnegative(),
  outputSummary: z.string(),
});

const TripleLockResultSchema = z.object({
  lock1_targetTest: LockVerificationResultSchema,
  lock2_fullSuite: LockVerificationResultSchema,
  lock3_stressTest: LockVerificationResultSchema,
  allPassed: z.boolean(),
  score: z.number().min(0).max(100),
});

const PatchVerificationResultSchema = z.object({
  patchId: z.string().min(1),
  patches: z.array(FilePatchSchema),
  unifiedDiff: z.string(),
  tripleLock: TripleLockResultSchema,
  verifiedAt: z.string(),
});

// 5. HITL Models
const HITLDecisionTypeEnum = z.enum(['APPLY', 'EDIT', 'REJECT', 'EXPLAIN']);

const HITLRequestSchema = z.object({
  sessionId: z.string().min(1),
  patchVerification: PatchVerificationResultSchema,
  causalTrace: CausalTraceGraphSchema,
  autoApprove: z.boolean().optional().default(false),
});

const HITLResponseSchema = z.object({
  decision: HITLDecisionTypeEnum,
  feedback: z.string().optional(),
  modifiedDiff: z.string().optional(),
  operator: z.string().default('operator'),
  timestamp: z.string(),
});

// 6. ReAct Agent Engine Models
const AgentStepTypeEnum = z.enum(['THOUGHT', 'ACTION', 'OBSERVATION', 'SYNTHESIS']);

const ReActStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  type: AgentStepTypeEnum,
  thought: z.string().optional(),
  toolCall: z.object({
    toolName: z.string(),
    input: z.record(z.unknown()),
  }).optional(),
  toolResult: z.object({
    success: z.boolean(),
    output: z.unknown(),
  }).optional(),
  durationMs: z.number().nonnegative(),
  timestamp: z.string(),
});

const AgentStatusEnum = z.enum([
  'IDLE',
  'INGESTING',
  'REPRODUCING',
  'TRACING',
  'PATCHING',
  'VERIFYING',
  'HITL_WAITING',
  'APPLIED',
  'FAILED'
]);

const AgentSessionStateSchema = z.object({
  sessionId: z.string().min(1),
  targetPath: z.string(),
  testCommand: z.string(),
  status: AgentStatusEnum,
  currentStep: z.number().int().nonnegative(),
  steps: z.array(ReActStepSchema),
  parsedError: ParsedErrorPayloadSchema.optional(),
  sandboxResult: SandboxExecutionResultSchema.optional(),
  causalTrace: CausalTraceGraphSchema.optional(),
  patchResult: PatchVerificationResultSchema.optional(),
  hitlResponse: HITLResponseSchema.optional(),
  error: z.string().optional(),
});

// Validators
function validateContract(schema, data, contractName) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorDetails = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Contract validation failed for [${contractName}]: ${errorDetails}`);
  }
  return result.data;
}

module.exports = {
  // Schemas
  StackFrameSchema,
  FailingTestInfoSchema,
  ParsedErrorPayloadSchema,
  SandboxExecutionResultSchema,
  CausalNodeTypeEnum,
  CausalNodeSchema,
  CausalTraceGraphSchema,
  FilePatchSchema,
  LockVerificationResultSchema,
  TripleLockResultSchema,
  PatchVerificationResultSchema,
  HITLDecisionTypeEnum,
  HITLRequestSchema,
  HITLResponseSchema,
  AgentStepTypeEnum,
  ReActStepSchema,
  AgentStatusEnum,
  AgentSessionStateSchema,

  // Validator Functions
  validateStackFrame: (data) => validateContract(StackFrameSchema, data, 'StackFrame'),
  validateParsedError: (data) => validateContract(ParsedErrorPayloadSchema, data, 'ParsedErrorPayload'),
  validateSandboxResult: (data) => validateContract(SandboxExecutionResultSchema, data, 'SandboxExecutionResult'),
  validateCausalGraph: (data) => validateContract(CausalTraceGraphSchema, data, 'CausalTraceGraph'),
  validatePatchResult: (data) => validateContract(PatchVerificationResultSchema, data, 'PatchVerificationResult'),
  validateHITLResponse: (data) => validateContract(HITLResponseSchema, data, 'HITLResponse'),
  validateReActStep: (data) => validateContract(ReActStepSchema, data, 'ReActStep'),
  validateSessionState: (data) => validateContract(AgentSessionStateSchema, data, 'AgentSessionState'),
};
