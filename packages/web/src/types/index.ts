export interface PipelineStage {
  id: string;
  stepNumber: number;
  name: string;
  shortName: string;
  toolName: string;
  description: string;
  badge: string;
  inputs: string[];
  outputs: string[];
  exampleInput: Record<string, unknown>;
  exampleOutput: Record<string, unknown>;
  technicalDetails: string;
  verificationMethod: string;
  iconName: 'ingest' | 'sandbox' | 'trace' | 'patch' | 'hitl';
}

export interface DiffLine {
  type: 'context' | 'add' | 'delete';
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface TerminalDiff {
  file: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

export interface TerminalLog {
  id: string;
  stepIndex: number;
  timestamp: string;
  phase: 'INFO' | 'THINK' | 'ACT' | 'OBSERVE' | 'DIFF' | 'LOCK' | 'HITL' | 'SUCCESS';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  diff?: TerminalDiff;
  hitlAction?: boolean;
}

export interface TripleLockItem {
  name: string;
  target: string;
  description: string;
  status: 'passed' | 'pending' | 'executing';
  duration: string;
}

export interface Scenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  fixturePath: string;
  crashSite: string;
  rootCause: string;
  logs: TerminalLog[];
  tripleLock: {
    lock1: TripleLockItem;
    lock2: TripleLockItem;
    lock3: TripleLockItem;
  };
  prSummary: {
    prNumber: number;
    title: string;
    qodoReview: string;
    qodoScore: number;
    timeToHeal: string;
    branch: string;
  };
}

export interface ComparisonRow {
  feature: string;
  category: 'Autonomous Sandboxing' | 'Root Cause Diagnosis' | 'Verification & Code Quality' | 'Developer Experience';
  debugforge: string | boolean;
  cursor: string | boolean;
  sentry: string | boolean;
  sweagent: string | boolean;
  highlight?: boolean;
  tooltip: string;
}

export interface Incident {
  id: string;
  service: string;
  errorType: string;
  message: string;
  timestamp: string;
  status: 'HEALED' | 'DIAGNOSING' | 'REPRODUCING' | 'HITL_REVIEW';
  mttr: string;
  locksPassed: number;
  sandboxId: string;
  causalTrace: Array<{
    node: string;
    file: string;
    line: number;
    role: 'origin' | 'propagation' | 'crash';
    desc: string;
  }>;
}

export interface InstallTab {
  id: 'curl' | 'powershell' | 'npm' | 'npx';
  label: string;
  osBadge: string;
  command: string;
  description: string;
}
