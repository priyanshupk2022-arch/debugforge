import { ComparisonRow } from '../types';

export const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: 'Autonomous Sandbox Reproduction',
    category: 'Autonomous Sandboxing',
    debugforge: 'Daytona Ephemeral Micro-Containers',
    cursor: 'None (Manual IDE execution)',
    sentry: 'Production Stack-Trace Only',
    sweagent: 'Local Docker Only',
    highlight: true,
    tooltip: 'DebugForge spins up hermetic Daytona cloud containers to deterministically reproduce failures before touching any code.'
  },
  {
    feature: 'Backward Causal Tracing (Origin vs Crash)',
    category: 'Root Cause Diagnosis',
    debugforge: 'Dynamic AST Data-Flow Blame Graph',
    cursor: 'Prompt Guessing (LLM Context)',
    sentry: 'Stack-trace Frames Only',
    sweagent: 'LLM File Search Heuristics',
    highlight: true,
    tooltip: 'Decouples the downstream symptom (crash site) from the upstream infection origin (e.g. unhandled pool timeout 4 hops away).'
  },
  {
    feature: 'Triple-Lock Differential Verification',
    category: 'Verification & Code Quality',
    debugforge: 'Lock 1 (Repro) + Lock 2 (Suite) + Lock 3 (Stress)',
    cursor: 'None (Developer must test)',
    sentry: 'None',
    sweagent: 'Single Test Pass Check',
    highlight: true,
    tooltip: 'Guarantees zero regressions and verified stress/concurrency safety before presenting code to human.'
  },
  {
    feature: 'Surgical AST Patch Synthesis',
    category: 'Verification & Code Quality',
    debugforge: 'Zero-hallucination AST-level transformations',
    cursor: 'Raw LLM Diff / Whole-line edits',
    sentry: 'None',
    sweagent: 'Raw LLM Search-Replace blocks',
    highlight: true,
    tooltip: 'Synthesizes type-safe, minimal edits preserving existing coding conventions and public API contracts.'
  },
  {
    feature: 'True Human-in-the-Loop (HITL) Gate',
    category: 'Developer Experience',
    debugforge: 'Interactive Decision Prompt ([Approve] [Edit] [Reject])',
    cursor: 'Inline Accept / Reject only',
    sentry: 'None',
    sweagent: 'None (Fully autonomous loop)',
    highlight: true,
    tooltip: 'Maintains developer agency and control with a cryptographic approval gate before opening pull requests.'
  },
  {
    feature: 'Automated Qodo PR-Agent Review',
    category: 'Verification & Code Quality',
    debugforge: 'Integrated Automated PR Code Review Gate',
    cursor: 'None',
    sentry: 'None',
    sweagent: 'None',
    tooltip: 'Runs automated AI code reviews on generated pull requests to verify security, performance, and style.'
  },
  {
    feature: 'Interactive Terminal UI (React Ink)',
    category: 'Developer Experience',
    debugforge: 'Live streaming thought feed & HUD in terminal',
    cursor: 'Chat Panel in GUI only',
    sentry: 'Web SaaS Dashboard only',
    sweagent: 'Standard CLI raw stdout',
    tooltip: 'Rich terminal UI powered by React Ink with unified diff viewer, causal graphs, and interactive prompts.'
  },
  {
    feature: 'Continuous Background Watch Mode',
    category: 'Developer Experience',
    debugforge: 'Auto-triggers ReAct loop on local test failure',
    cursor: 'Manual trigger on save',
    sentry: 'Production telemetry ingest',
    sweagent: 'Batch job processing only',
    tooltip: 'Background daemon watching test runs and automatically initiating sandbox reproduction on failure.'
  },
  {
    feature: 'Mean Time to Resolution (MTTR)',
    category: 'Developer Experience',
    debugforge: '< 2 Minutes (Autonomous)',
    cursor: '15 - 45 Minutes (Human-driven)',
    sentry: 'Hours / Days (Post-incident)',
    sweagent: '10 - 30 Minutes',
    highlight: true,
    tooltip: 'End-to-end time from ingesting error to verified PR ready for merge.'
  }
];
