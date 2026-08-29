import { PipelineStage } from '../types';

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'ingest_error',
    stepNumber: 1,
    name: 'Ingest Error & Context',
    shortName: 'Ingest',
    toolName: 'ingest_error',
    badge: 'Step 1: Parsing',
    description: 'Parses raw stack traces, error outputs, logs, and failing test assertion outputs into a structured diagnostic context with call frames, error classes, and failed assertions.',
    iconName: 'ingest',
    inputs: [
      'Raw error logs or stderr stream',
      'Failing test command output (e.g. npm test)',
      'Stack trace with source file references',
      'Runtime environment metadata (Node.js version, OS, framework)'
    ],
    outputs: [
      'Structured DiagnosticContext object',
      'Normalized call frames with absolute file mappings',
      'Error categorization (TypeError, RaceCondition, ResourceExhaustion)',
      'Tokenized failure assertion expectation vs received value'
    ],
    exampleInput: {
      rawStderr: "TypeError: Cannot read properties of undefined (reading 'toFixed')\n    at formatInvoice (src/services/order.ts:42:35)\n    at processOrder (src/services/order.ts:18:12)",
      testCommand: "npm test",
      cwd: "/workspace/fixtures/null-propagation-api"
    },
    exampleOutput: {
      errorType: "TypeError",
      message: "Cannot read properties of undefined (reading 'toFixed')",
      crashSite: {
        file: "src/services/order.ts",
        line: 42,
        column: 35,
        function: "formatInvoice"
      },
      propagationDepth: 4,
      severity: "CRITICAL"
    },
    technicalDetails: 'TrueForge MCP tool `ingest_error` matches language-specific stack frame regexes, inspects AST sourcemaps, and normalizes disparate test runner syntaxes (Node test runner, Jest, Vitest, Mocha) into an isomorphic AST triage schema.',
    verificationMethod: 'Zod schema validation against `DiagnosticContextSchema` with 100% field type assurance.'
  },
  {
    id: 'reproduce_in_sandbox',
    stepNumber: 2,
    name: 'Daytona Sandbox Reproduction',
    shortName: 'Sandbox',
    toolName: 'reproduce_in_sandbox',
    badge: 'Step 2: Isolation',
    description: 'Spins up an ephemeral, isolated Daytona micro-container sandbox, clones workspace state, and deterministically reproduces the exact failure with exit-code capture.',
    iconName: 'sandbox',
    inputs: [
      'Workspace root directory',
      'Target reproduction test command (e.g. npm test -- order.test.ts)',
      'Environment variables and fixture state'
    ],
    outputs: [
      'Daytona Sandbox Container ID',
      'Deterministic Reproduction Exit Code (non-zero)',
      'Isolated Stdout / Stderr execution telemetry',
      'System metrics (heap diff, memory pressure, active handles)'
    ],
    exampleInput: {
      sandboxProvider: "daytona",
      workspaceRoot: "/workspace/fixtures/null-propagation-api",
      reproCommand: "npm test -- test/order.test.ts",
      timeoutMs: 15000
    },
    exampleOutput: {
      sandboxId: "daytona-ws-901b-c72",
      status: "REPRODUCED_CONFIRMED",
      exitCode: 1,
      executionTimeMs: 842,
      capturedFailure: "AssertionError [ERR_ASSERTION]: Expected status 200 but received 500 (Unhandled TypeError)"
    },
    technicalDetails: 'Leverages `@daytona/sdk` workspace lifecycle management with automated isolated local fallback runner (`LocalProcessSandboxRunner`) for hermetic offline execution with zero local state pollution.',
    verificationMethod: 'Assert non-zero exit code on initial run, guaranteeing genuine failure reproduction before any patch synthesis begins.'
  },
  {
    id: 'trace_and_analyze',
    stepNumber: 3,
    name: 'Dynamic Backward Causal Tracing',
    shortName: 'Causal Trace',
    toolName: 'trace_and_analyze',
    badge: 'Step 3: Root Cause',
    description: 'Performs backward causal dependency traversal through TypeScript AST data-flow graphs to decouple the downstream Crash Site from the true Infection Origin.',
    iconName: 'trace',
    inputs: [
      'Crash site node (file, line, variable)',
      'Source code AST for all workspace modules',
      'Execution data-flow trace from sandbox'
    ],
    outputs: [
      'Causal Blame Graph (Origin -> Propagation -> Crash)',
      'Root Cause Infection Node (e.g. unhandled pool timeout returning null)',
      'Classification of Bug Pattern (Null Cascade, Race Condition, Event Leak)',
      'Recommended surgical AST transformation targets'
    ],
    exampleInput: {
      crashNode: {
        file: "src/services/order.ts",
        line: 42,
        identifier: "order.pricing.total"
      },
      searchDepth: 10
    },
    exampleOutput: {
      infectionOrigin: {
        file: "src/db/pool.ts",
        line: 24,
        construct: "acquireConnection()",
        flaw: "Returns { connection: null } on timeout instead of throwing or retrying"
      },
      propagationPath: [
        { file: "src/db/pool.ts", line: 24, role: "ORIGIN", detail: "Pool timeout returns null" },
        { file: "src/services/inventory.ts", line: 16, role: "PROPAGATION", detail: "Null connection causes item to be null" },
        { file: "src/services/pricing.ts", line: 28, role: "PROPAGATION", detail: "Null item yields { total: undefined }" },
        { file: "src/services/order.ts", line: 42, role: "CRASH_SITE", detail: "Calling .toFixed(2) on undefined throws TypeError" }
      ],
      confidence: 0.994
    },
    technicalDetails: 'Builds a Directed Acyclic Graph (DAG) of variable assignments, promise chains, and object property accesses backwards from the crash point to pinpoint where illegal state was initially injected.',
    verificationMethod: 'Mathematical reachability analysis on AST data flow guaranteeing single-point blame attribution.'
  },
  {
    id: 'auto_patch_and_verify',
    stepNumber: 4,
    name: 'Triple-Lock Differential Verification',
    shortName: 'Triple-Lock',
    toolName: 'auto_patch_and_verify',
    badge: 'Step 4: Auto-Heal',
    description: 'Synthesizes minimal AST-level patches and subjects the code to Triple-Lock differential verification: Lock 1 (failing test passes), Lock 2 (full suite passes), Lock 3 (stress test passes).',
    iconName: 'patch',
    inputs: [
      'Causal blame node & AST context',
      'Candidate patch synthesis strategy',
      'Full workspace test suite + generated stress harnesses'
    ],
    outputs: [
      'Minimal unified diff with line annotations',
      'Lock 1 Result: Target reproduction test PASS (0 exit code)',
      'Lock 2 Result: Entire regression test suite PASS (0 regressions)',
      'Lock 3 Result: 100x concurrency / memory stress test PASS',
      'Triple-Lock Attestation Token'
    ],
    exampleInput: {
      targetFile: "src/db/pool.ts",
      patchType: "AST_RESILIENT_POOL_ACQUISITION",
      sandboxId: "daytona-ws-901b-c72"
    },
    exampleOutput: {
      patchStatus: "TRIPLE_LOCK_PASSED",
      diff: "@@ -24,3 +24,6 @@\n-  if (!conn) return { connection: null };\n+  if (!conn) throw new DatabaseConnectionTimeoutError('Connection pool timed out after 5000ms');\n+  return { connection: conn };",
      locks: {
        lock1_reproduction: { passed: true, durationMs: 240 },
        lock2_regressionSuite: { passed: true, testsRan: 48, durationMs: 1120 },
        lock3_stressTest: { passed: true, concurrency: 50, durationMs: 2100 }
      },
      verifiedZeroRegressions: true
    },
    technicalDetails: 'Surgical AST transformers generate TypeScript-safe patches (safe coalescing, async mutex wrapping, disposal hooks) and execute all three verification locks inside the Daytona container before presenting to human.',
    verificationMethod: 'Deterministic execution of all 3 test tiers inside the sandbox with exit code 0.'
  },
  {
    id: 'hitl_approval',
    stepNumber: 5,
    name: 'Human-in-the-Loop & Qodo PR',
    shortName: 'HITL & Qodo',
    toolName: 'hitl_approval',
    badge: 'Step 5: Governance',
    description: 'Presents verified diff and diagnostic proof to the developer via interactive CLI/Web HITL prompt, then opens a Pull Request with automated Qodo PR-Agent code review.',
    iconName: 'hitl',
    inputs: [
      'Triple-Lock verified patch proposal',
      'Syntax-highlighted diff with explanation',
      'Developer decision ([Approve & Open PR], [Edit AST Patch], [Reject])'
    ],
    outputs: [
      'Cryptographic HITL Decision Record',
      'Git Branch & GitHub Pull Request created',
      'Qodo PR-Agent automated review score & suggestions',
      'Instant production-ready mergeability state'
    ],
    exampleInput: {
      proposalId: "prop-882-lock3-passed",
      targetBranch: "fix/null-propagation-db-pool",
      action: "APPROVE_AND_PR"
    },
    exampleOutput: {
      decision: "APPROVED",
      prNumber: 42,
      prUrl: "https://github.com/debugforge/workspace/pull/42",
      qodoReview: {
        status: "APPROVED",
        qualityScore: 98,
        summary: "Surgical fix prevents null propagation at connection pool acquisition layer without altering downstream public API signatures."
      },
      mttrSeconds: 102
    },
    technicalDetails: 'Integrates with GitHub REST API and Qodo PR-Agent automated review actions to maintain strict human agency and auditability while automating 99% of the manual debugging toil.',
    verificationMethod: 'Cryptographic HMAC signature of developer approval state and Qodo PR quality check exit 0.'
  }
];
