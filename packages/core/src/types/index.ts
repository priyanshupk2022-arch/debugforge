import { z } from 'zod';

export type VulnerabilityCategory =
  | 'COMMAND_INJECTION'
  | 'PROTOTYPE_POLLUTION'
  | 'BROKEN_AUTH_IDOR';

export const VulnerabilityCategorySchema = z.enum([
  'COMMAND_INJECTION',
  'PROTOTYPE_POLLUTION',
  'BROKEN_AUTH_IDOR',
]);

export interface ExploitPayloadSpec {
  protocol: 'HTTP_GET' | 'HTTP_POST';
  endpoint: string;
  bodyPayload?: Record<string, unknown>;
  queryPayload?: Record<string, string>;
  headers?: Record<string, string>;
  expectedProofSignature: string;
}

export interface GoldenValidInput {
  description: string;
  protocol: 'HTTP_GET' | 'HTTP_POST';
  endpoint: string;
  bodyPayload?: Record<string, unknown>;
  queryPayload?: Record<string, string>;
  headers?: Record<string, string>;
  expectedStatusCode: number;
  expectedResponseSubstring: string;
}

export interface VulnerabilityReport {
  id: string;
  category: VulnerabilityCategory;
  cwe: string;
  cvssBaseScore: number;
  vulnerableFilePath: string;
  vulnerableLineNumber: number;
  sinkIdentifier: string;
  codeSnippet: string;
  exploitPayloadSpec: ExploitPayloadSpec;
  goldenValidInputs: GoldenValidInput[];
  status: 'SUSPECTED' | 'EXPLOIT_CONFIRMED' | 'PATCH_VERIFIED_IMMUNE';
}

export interface SecurityPatchNode {
  id: string;
  parentId: string | null;
  vulnerabilityId: string;
  timestamp: number;
  filePath: string;
  originalCodeSnippet: string;
  patchedCodeSnippet: string;
  patchDiff: string;
  sanitizationSchema?: string;
  immunizationResults: {
    exploitBlocked: boolean;
    goldenInputsPreserved: boolean;
    unitTestsPassed: boolean;
    testSuiteExitCode: number;
  };
  resultingCvssScore: number;
  status: 'CANDIDATE' | 'IMMUNIZED' | 'DEAD_END';
}

export interface SecuritySupervisorAlert {
  alertId: string;
  type: 'CYCLIC_SYNTAX_LOOP' | 'GOLDEN_CONTRACT_BREAK' | 'STAGNATION_LOOP';
  explanation: string;
  recommendedPivot: string;
}

export interface ZeroShieldState {
  sessionId: string;
  targetRepoPath: string;
  startTime: number;
  discoveredSinks: VulnerabilityReport[];
  activeVulnerabilityIndex: number;
  daytonaSandboxId?: string;
  sandboxPort?: number;
  sandboxReady: boolean;
  currentPatchIteration: number;
  maxIterations: number;
  candidatePatches: SecurityPatchNode[];
  hitlApprovalToken?: string;
  hitlStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  generatedPullRequestUrl?: string;
}
