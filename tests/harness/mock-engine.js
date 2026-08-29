/**
 * DebugForge Test Harness - High-Fidelity Reference Oracle & Mock Engine
 * Implements the normative behavior of @debugforge/core for opaque-box testing.
 */

const path = require('path');
const { MockSandboxRunner } = require('./sandbox-mock');
const {
  validateParsedError,
  validateSandboxResult,
  validateCausalGraph,
  validatePatchResult,
  validateHITLResponse,
  validateReActStep,
} = require('./contracts');

class MockDebugForgeEngine {
  constructor(options = {}) {
    this.options = {
      maxIterations: 8,
      sandboxMode: 'local',
      workspaceRoot: process.cwd(),
      ...options,
    };
    this.sandboxRunner = options.sandboxRunner || new MockSandboxRunner();
    this.steps = [];
    this.status = 'IDLE';
  }

  /**
   * Tool 1: ingest_error
   */
  async ingest_error(rawLog, errorType = 'RuntimeError', failingTest) {
    this.status = 'INGESTING';
    const lines = (rawLog || '').split('\n');
    const stackFrames = [];

    // Parse V8 stack frames
    const frameRegex = /at (?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/;
    for (const line of lines) {
      const match = line.match(frameRegex);
      if (match) {
        const fnName = match[1] || '<anonymous>';
        const file = match[2];
        const lineNum = parseInt(match[3], 10);
        const colNum = parseInt(match[4], 10);
        const isInternal = file.includes('node_modules') || file.startsWith('node:');

        stackFrames.push({
          file,
          line: lineNum,
          column: colNum,
          functionName: fnName,
          isInternal,
          codeSnippet: {
            before: ['// context before'],
            line: `const target = source[${lineNum}];`,
            after: ['// context after'],
          },
        });
      }
    }

    // Default fallback frame if no stack found
    if (stackFrames.length === 0) {
      stackFrames.push({
        file: 'unknown.ts',
        line: 1,
        column: 1,
        functionName: '<root>',
        isInternal: false,
      });
    }

    const payload = {
      errorType: errorType || 'Error',
      message: lines[0] || 'Unknown error occurred',
      rawLog: rawLog || '',
      stackFrames,
      failingTest: failingTest || (rawLog.includes('fail') ? {
        suiteName: 'TestSuite',
        testName: 'FailingTestCase',
        errorMessage: lines[0] || 'Assertion failed',
      } : undefined),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: this.options.workspaceRoot,
      },
    };

    return validateParsedError(payload);
  }

  /**
   * Tool 2: reproduce_in_sandbox
   */
  async reproduce_in_sandbox(workspacePath, testCommand = 'npm test') {
    this.status = 'REPRODUCING';
    const wsId = await this.sandboxRunner.createWorkspace(workspacePath);
    const result = await this.sandboxRunner.executeCommand(wsId, testCommand);
    
    // Store workspace ID for subsequent operations
    this.activeWorkspaceId = wsId;
    return validateSandboxResult(result);
  }

  /**
   * Tool 3: trace_and_analyze
   */
  async trace_and_analyze(parsedError, sourceRoot) {
    this.status = 'TRACING';
    const topFrame = (parsedError.stackFrames && parsedError.stackFrames[0]) || {
      file: 'orders.ts',
      line: 42,
      functionName: 'processOrder',
    };

    // Derive causal chain
    let rootCauseFile = 'db/pool.ts';
    let rootCauseLine = 24;
    let rootSymbol = 'acquireConnection';
    let explanation = 'Database connection pool timeout returns null connection without throwing';

    if (parsedError.errorType.includes('Assertion') || parsedError.message.includes('balance')) {
      rootCauseFile = 'wallet/account.ts';
      rootCauseLine = 18;
      rootSymbol = 'transfer';
      explanation = 'Non-atomic read-modify-write state mutation across asynchronous ticks';
    } else if (parsedError.errorType.includes('Memory') || parsedError.message.includes('listener')) {
      rootCauseFile = 'server/session.ts';
      rootCauseLine = 22;
      rootSymbol = 'createSession';
      explanation = 'Event listener retained on global emitter without lifecycle unsubscription';
    }

    const crashSite = {
      id: 'node_crash_site',
      type: 'CRASH_SITE',
      file: topFrame.file,
      line: topFrame.line,
      column: topFrame.column || 1,
      symbolName: topFrame.functionName,
      expression: 'order.pricing.total.toFixed(2)',
      description: `Crash site where ${parsedError.message} materialized`,
    };

    const rootCause = {
      id: 'node_infection_origin',
      type: 'INFECTION_ORIGIN',
      file: rootCauseFile,
      line: rootCauseLine,
      column: 1,
      symbolName: rootSymbol,
      expression: 'return null;',
      description: explanation,
    };

    const propagationPath = [
      {
        id: 'node_prop_1',
        type: 'PROPAGATION_STEP',
        file: 'services/inventory.ts',
        line: 15,
        column: 1,
        symbolName: 'checkStock',
        expression: 'inventory.status = null',
        description: 'Silent null propagation from pool to inventory service',
      },
      {
        id: 'node_prop_2',
        type: 'PROPAGATION_STEP',
        file: 'services/pricing.ts',
        line: 30,
        column: 1,
        symbolName: 'calculatePrice',
        expression: 'pricing.total = undefined',
        description: 'Pricing service fails to validate item properties',
      },
    ];

    const graphAscii = [
      `[Infection Origin] ${rootCause.file}:${rootCause.line} (${rootCause.symbolName})`,
      `       │`,
      `       ▼`,
      `[Propagation] ${propagationPath[0].file}:${propagationPath[0].line}`,
      `       │`,
      `       ▼`,
      `[Propagation] ${propagationPath[1].file}:${propagationPath[1].line}`,
      `       │`,
      `       ▼`,
      `[Crash Site] ${crashSite.file}:${crashSite.line} (${crashSite.symbolName})`,
    ].join('\n');

    const graph = {
      rootCause,
      propagationPath,
      crashSite,
      confidence: 0.96,
      explanation,
      graphAscii,
    };

    return validateCausalGraph(graph);
  }

  /**
   * Tool 4: auto_patch_and_verify
   */
  async auto_patch_and_verify(causalGraph, workspacePath) {
    this.status = 'PATCHING';
    const targetFile = causalGraph.rootCause.file;

    const originalContent = `// ${targetFile}\nexport async function ${causalGraph.rootCause.symbolName}() {\n  return null;\n}\n`;
    const patchedContent = `// ${targetFile}\nexport async function ${causalGraph.rootCause.symbolName}() {\n  // Auto-healed by DebugForge AST Synthesizer\n  const conn = await retryAcquire();\n  if (!conn) throw new Error("PoolTimeoutException: Retries exhausted");\n  return conn;\n}\n`;

    const diff = [
      `--- a/${targetFile}`,
      `+++ b/${targetFile}`,
      `@@ -1,3 +1,6 @@`,
      ` // ${targetFile}`,
      ` export async function ${causalGraph.rootCause.symbolName}() {`,
      `-  return null;`,
      `+  // Auto-healed by DebugForge AST Synthesizer`,
      `+  const conn = await retryAcquire();`,
      `+  if (!conn) throw new Error("PoolTimeoutException: Retries exhausted");`,
      `+  return conn;`,
      ` }`,
    ].join('\n');

    const patches = [
      {
        filePath: targetFile,
        originalContent,
        patchedContent,
        diff,
      },
    ];

    this.status = 'VERIFYING';
    const tripleLock = {
      lock1_targetTest: {
        lockName: 'Lock 1 (Target Test)',
        passed: true,
        command: 'npm test -- --grep "target"',
        exitCode: 0,
        durationMs: 140,
        outputSummary: '1 test passed, 0 failed',
      },
      lock2_fullSuite: {
        lockName: 'Lock 2 (Full Suite)',
        passed: true,
        command: 'npm test',
        exitCode: 0,
        durationMs: 620,
        outputSummary: '18 tests passed, 0 failed, 0 regressions',
      },
      lock3_stressTest: {
        lockName: 'Lock 3 (Stress Test)',
        passed: true,
        command: 'npm test -- --stress',
        exitCode: 0,
        durationMs: 1100,
        outputSummary: '100 concurrent requests resolved, 0 race conditions, 0 leaks',
      },
      allPassed: true,
      score: 100,
    };

    const result = {
      patchId: `patch_${Date.now()}`,
      patches,
      unifiedDiff: diff,
      tripleLock,
      verifiedAt: new Date().toISOString(),
    };

    return validatePatchResult(result);
  }

  /**
   * Tool 5: hitl_approval
   */
  async hitl_approval(patchVerification, causalTrace, decision = 'APPLY', feedback = '') {
    this.status = 'HITL_WAITING';
    
    let resolvedDecision = decision;
    if (this.options.hitlHandler) {
      const customDecision = await this.options.hitlHandler({
        patchId: patchVerification.patchId,
        targetFile: patchVerification.patches[0].filePath,
        diff: patchVerification.unifiedDiff,
        explanation: causalTrace.explanation,
        tripleLockStatus: {
          lock1OriginalPass: patchVerification.tripleLock.lock1_targetTest.passed,
          lock2RegressionPass: patchVerification.tripleLock.lock2_fullSuite.passed,
          lock3StressPass: patchVerification.tripleLock.lock3_stressTest.passed,
        },
      });
      if (customDecision) resolvedDecision = customDecision;
    }

    const response = {
      decision: resolvedDecision,
      feedback: feedback || (resolvedDecision === 'APPLY' ? 'Patch verified and approved' : 'Rejected by user'),
      operator: 'developer',
      timestamp: new Date().toISOString(),
    };

    this.status = resolvedDecision === 'APPLY' ? 'APPLIED' : 'FAILED';
    return validateHITLResponse(response);
  }

  /**
   * Executes single-shot diagnose ReAct loop
   */
  async diagnose({ errorInput, testCommand = 'npm test', workspacePath, autoApprove = false }) {
    const wsPath = workspacePath || this.options.workspaceRoot;
    this.steps = [];

    // Step 1: Ingest
    this._recordStep('THOUGHT', 'Ingesting error and parsing stack trace...', 1);
    const parsed = await this.ingest_error(errorInput || 'TypeError: Cannot read properties of undefined');
    this._recordStep('ACTION', 'ingest_error executed', 2, { toolName: 'ingest_error', input: { errorInput } }, { success: true, output: parsed });

    // Step 2: Reproduce
    this._recordStep('THOUGHT', `Reproducing failure in sandbox with ${testCommand}...`, 3);
    const sandboxRes = await this.reproduce_in_sandbox(wsPath, testCommand);
    this._recordStep('OBSERVATION', 'Reproduction confirmed in sandbox', 4, { toolName: 'reproduce_in_sandbox', input: { wsPath, testCommand } }, { success: true, output: sandboxRes });

    // Step 3: Trace
    this._recordStep('THOUGHT', 'Traversing AST backwards from crash site to infection origin...', 5);
    const trace = await this.trace_and_analyze(parsed, wsPath);
    this._recordStep('ACTION', 'Dynamic causal trace graph generated', 6, { toolName: 'trace_and_analyze', input: {} }, { success: true, output: trace });

    // Step 4: Patch & Verify
    this._recordStep('THOUGHT', 'Synthesizing AST patch and executing Triple-Lock verification...', 7);
    const patch = await this.auto_patch_and_verify(trace, wsPath);
    this._recordStep('OBSERVATION', 'Triple-Lock verification passed (Lock 1, 2, 3)', 8, { toolName: 'auto_patch_and_verify', input: {} }, { success: true, output: patch });

    // Step 5: HITL Gate
    this._recordStep('THOUGHT', 'Awaiting Human-in-the-Loop decision...', 9);
    const hitl = await this.hitl_approval(patch, trace, autoApprove ? 'APPLY' : 'APPLY');
    this._recordStep('SYNTHESIS', `HITL Gate resolved: ${hitl.decision}`, 10, { toolName: 'hitl_approval', input: { decision: hitl.decision } }, { success: true, output: hitl });

    return {
      sessionId: `sess_${Date.now()}`,
      status: this.status,
      parsedError: parsed,
      sandboxResult: sandboxRes,
      causalTrace: trace,
      patchResult: patch,
      hitlResponse: hitl,
      steps: this.steps,
      resolved: hitl.decision === 'APPLY',
    };
  }

  /**
   * Watch mode daemon simulation
   */
  async *watch(watchPath, testCommand = 'npm test') {
    yield await this.diagnose({ workspacePath: watchPath, testCommand, autoApprove: true });
  }

  /**
   * Conversational agent loop
   */
  async runAgentLoop(prompt) {
    this._recordStep('THOUGHT', `Processing conversational debug prompt: "${prompt}"`, 1);
    return await this.diagnose({ errorInput: prompt, autoApprove: true });
  }

  _recordStep(type, thought, index, toolCall, toolResult) {
    const step = {
      stepIndex: index || this.steps.length + 1,
      type,
      thought,
      toolCall,
      toolResult,
      durationMs: 50,
      timestamp: new Date().toISOString(),
    };
    validateReActStep(step);
    this.steps.push(step);
    if (this.options.onStepStream) {
      this.options.onStepStream(step);
    }
  }
}

module.exports = {
  MockDebugForgeEngine,
};
