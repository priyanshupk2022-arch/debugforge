export type VulnerabilityCategory =
  | 'COMMAND_INJECTION'
  | 'PROTOTYPE_POLLUTION'
  | 'BROKEN_AUTH_IDOR';

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

export interface DiffLine {
  type: 'unchanged' | 'deleted' | 'inserted' | 'ast-note';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  explanation?: string;
}

export interface SecurityScenario {
  id: string;
  title: string;
  repository: string;
  category: VulnerabilityCategory;
  cwe: string;
  initialCvss: number;
  immunizedCvss: number;
  cvssVector: string;
  vulnerableFilePath: string;
  sinkIdentifier: string;
  redAgentDetails: {
    targetEndpoint: string;
    method: 'GET' | 'POST';
    payload: string;
    requestHeaders: Record<string, string>;
    requestBody?: string;
    exploitResponseCode: number;
    exploitProofOutput: string;
    exploitExecutionTimeMs: number;
    terminalLogs: string[];
  };
  blueAgentDetails: {
    sandboxId: string;
    containerStatus: 'PROVISIONED' | 'ACTIVE' | 'IMMUNIZED';
    patchStrategy: string;
    synthesizedSchema: string;
    compileLogs: string[];
    unitTestPassed: boolean;
    testsTotal: number;
    testsPassed: number;
    retestBlockedCode: number;
    retestProofOutput: string;
    daytonaExecutionTimeMs: number;
  };
  diffLines: DiffLine[];
  qodoCertification: {
    overallScore: number;
    securityGateStatus: 'PASSED' | 'FAILED';
    testIntegrityScore: number;
    codeSmellCount: number;
    regressionRiskPercent: number;
    badgeIssuedAt: string;
    cryptographicCertificateHash: string;
    verdict: string;
  };
  hitlSummary: {
    operatorId: string;
    riskReductionSummary: string;
    suggestedCommitMessage: string;
    targetBranch: string;
  };
}

export type PipelineStage = 'IDLE' | 'SCANNING' | 'RED_EXPLOITING' | 'BLUE_SYNTHESIZING' | 'AVO_TESTING' | 'IMMUNIZED';
