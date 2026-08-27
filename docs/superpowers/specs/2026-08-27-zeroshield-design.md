# ZEROSHIELD — Technical & Product Design Specification
## Autonomous Cyber Red-Team & Exploit Immunizer Engine
**Built on TrueFoundry TrueForge & Daytona Sandboxes · The Agent Harness Hackathon (WeMakeDevs × TrueFoundry × Qodo)**
**Date:** 2026-08-27  
**Status:** Approved

---

## 1. Executive Summary

### 1.1 Problem Statement
Modern software systems suffer from critical security vulnerabilities (such as OWASP Top 10 Command Injections, Prototype Pollution, and Broken Object-Level Authorization). 
- Static analysis tools (SAST) produce overwhelming noise and high false-positive rates because they cannot prove whether a bug is dynamically exploitable.
- Dynamic penetration testing requires human security experts to manually craft exploit payloads, evaluate impact, write surgical code patches, and verify zero regressions.
- Developers often break legitimate application logic when attempting manual security fixes under pressure.

### 1.2 The Solution: ZeroShield
**ZeroShield** is an autonomous cyber red-team and exploit immunizer engine powered by the **TrueForge** agent harness and **Daytona Ephemeral Sandboxes**. It integrates:
1. **AST Vulnerability Hunter:** Scans source code trees to locate dangerous sinks (e.g. `child_process.exec`, unsafe recursive merges, unverified JWT decodes).
2. **Red Agent Exploit Arena (Daytona Sandbox):** Spawns an isolated ephemeral container, launches the target app, and dynamically executes targeted exploit payloads to confirm genuine exploitability with zero false positives.
3. **Blue Agent Surgical Immunizer (NVIDIA AVO Loop):** Generates type-safe AST patches (e.g. replacing `exec` with `execFile`, injecting Zod validation schemas) and verifies them inside the sandbox.
4. **Dual-Pass Immunization Verifier:** Re-runs the Red Agent exploit to assert 100% blockage (400/403) AND re-runs the application test suite to assert zero functional regressions (Exit 0).
5. **Cryptographic HITL Gate & Qodo PR Creator:** Presents a verified CVSS score reduction report (e.g. 9.8 Critical $\to$ 0.0 Clean) and unified AST diff for human approval, then opens a GitHub Pull Request audited by Qodo.

---

## 2. System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. INGESTION & SAST SCAN                        │
│  • Target Repository (Local path or GitHub URL)                       │
│  • AST Vulnerability Hunter: Identifies Dangerous Sinks (OWASP Top 10) │
│    - Command Injection (e.g. `exec(req.body.cmd)`)                     │
│    - Prototype Pollution (e.g. recursive unsafe `merge`)               │
│    - Broken Object Level Auth / IDOR (e.g. unverified `jwt.decode`)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│           2. RED AGENT: DYNAMIC EXPLOIT PROOF IN DAYTONA               │
│  • Spins up isolated Daytona Ephemeral Sandbox Container               │
│  • Boots target application server on localhost                        │
│  • Crafts & executes dynamic exploit payload (e.g. exfiltrate `/etc`)  │
│  • Emits: Confirmed Vulnerability PoC Trace (Zero False Positives!)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│           3. BLUE AGENT: NVIDIA AVO SURGICAL PATCH ENGINE              │
│  • 5-Step Loop: Inspect Sink -> Formulate Safe Patch -> Apply Diff     │
│  • Replaces dangerous sinks with safe APIs & input validation schemas  │
│    (e.g. `execFile` + Zod schemas + Cryptographic JWT Verification)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│           4. DUAL-PASS IMMUNIZATION ASSERTION ENGINE                   │
│  • Pass A: Re-runs Red Agent Exploit -> Asserts 100% BLOCKED (403/Safe)│
│  • Pass B: Runs Application Test Suite -> Asserts ZERO REGRESSIONS (0) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                5. CRYPTOGRAPHIC HITL GATE & QODO PR                    │
│  • Displays Before/After CVSS Score Drop (9.8 Critical -> 0.0 Clean)  │
│  • Pauses at HITL Approval Checkpoint for human sign-off               │
│  • Pushes feature branch & opens GitHub PR with Qodo Review Badge      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Data Structures & Interfaces

```typescript
export type VulnerabilityCategory = 
  | 'COMMAND_INJECTION' 
  | 'PROTOTYPE_POLLUTION' 
  | 'BROKEN_AUTH_IDOR' 
  | 'SSRF' 
  | 'SQL_INJECTION';

export interface VulnerabilityReport {
  id: string;
  category: VulnerabilityCategory;
  cwe: string;                        // e.g. "CWE-78: OS Command Injection"
  cvssBaseScore: number;              // e.g. 9.8 (Critical)
  vulnerableFilePath: string;
  vulnerableLineNumber: number;
  sinkIdentifier: string;             // e.g. "child_process.exec"
  exploitPayloadSpec: {
    protocol: 'HTTP_GET' | 'HTTP_POST' | 'CLI_ARG';
    endpoint?: string;
    bodyPayload?: Record<string, unknown>;
    expectedProofSignature: string;   // e.g. "root:x:0:0" or "POLLUTED_ADMIN_FLAG"
  };
  status: 'SUSPECTED' | 'EXPLOIT_CONFIRMED' | 'PATCH_VERIFIED_IMMUNE';
}

export interface SecurityPatchNode {
  id: string;
  parentId: string | null;
  vulnerabilityId: string;
  timestamp: number;
  patchDiff: string;                  // Unified code diff
  sanitizationSchema?: string;        // e.g. Zod schema applied
  immunizationResults: {
    exploitBlocked: boolean;          // true => exploit failed (Safe)
    exploitResponseCode: number;      // e.g. 400 Bad Request / 403 Forbidden
    unitTestsPassed: boolean;         // true => zero regressions
    testSuiteExitCode: number;        // 0 => all existing tests passed
  };
  resultingCvssScore: number;         // 0.0 (Clean)
  status: 'CANDIDATE' | 'IMMUNIZED' | 'DEAD_END';
}

export interface SecuritySupervisorAlert {
  alertId: string;
  type: 'PATCH_INCOMPLETE' | 'REGRESSION_BREAK' | 'STAGNATION_LOOP';
  explanation: string;
  recommendedPivot: string;
}
```

---

## 4. Component Modules

### 4.1 `VulnerabilityHunter` (`src/hunter/scanner.ts`)
- Traverses source code ASTs to identify known insecure patterns and dangerous sink calls.
- Maps syntax locations directly to CWE definitions and generates targeted exploit payload templates.

### 4.2 `RedAgentArena` (`src/redteam/exploit.ts`)
- Spawns an isolated Daytona Ephemeral Sandbox container via `@daytonaio/sdk`.
- Launches target application instances, executes HTTP/socket attack payloads, and asserts signature exfiltration to confirm vulnerability reality.

### 4.3 `BlueAgentImmunizer` (`src/blueteam/patcher.ts`)
- Applies the NVIDIA AVO 5-step loop to rewrite vulnerable AST nodes into secure, schema-validated equivalents.
- Injects parameter arrays, type-safe sanitizers, and cryptographic validation logic.

### 4.4 `ImmunizationVerifier` (`src/verifier/assert.ts`)
- Executes dual-pass verification in Daytona:
  - **Pass 1:** Re-fires the Red Agent exploit to prove it is mathematically blocked.
  - **Pass 2:** Re-runs the repository test suite to guarantee zero regression breaks.

### 4.5 `SecurityHITLGate` (`src/hitl/gatekeeper.ts`)
- Freezes execution before remote git writes.
- Renders the CVSS score drop and verified AST diff, requiring HMAC-signed human approval.

---

## 5. User Interfaces

### 5.1 Interactive Hacker-Grade CLI (`packages/cli`)
- Terminal TUI featuring ASCII vulnerability radars, streaming sandbox exploit logs, unified diff visualizers, and interactive approval keys.

### 5.2 Clean Web Security Command Center (`packages/web`)
- Minimalist React dashboard powered by `@truefoundry/trueforge-ui`.
- Features real-time CVSS risk gauges, Exploit vs. Patch split-screen terminals, and 1-click Qodo PR creation.

---

## 6. Testing & Quality Verification

### 6.1 Automated Test Suites
- **`scanner.test.ts`:** Verifies AST sink detection across Command Injection, Prototype Pollution, and Broken Auth.
- **`redteam.test.ts`:** Tests exploit payload construction and proof capture against mock servers.
- **`blueteam.test.ts`:** Verifies that generated patches replace unsafe sinks with type-safe schemas.
- **`immunization.test.ts`:** Tests dual-pass assertion logic (blocked exploit + passed tests).
- **`hitl.test.ts`:** Verifies approval gate cryptographic invariants.

### 6.2 Hackathon Track Alignment
- **Grand Prize: Double-O Track ($5,000 NVIDIA DGX Spark):** Deep exploitation of Daytona Sandboxes (safe malware execution), TrueForge MCP tools, and Cryptographic HITL state gates.
- **Q Branch Track (Mac Mini via Qodo):** Clean modular monorepo, automated Qodo code reviews on all PRs, and documented remediation evidence in `README.md`.
