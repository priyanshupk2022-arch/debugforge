# MORPHIX — Technical & Product Design Specification
## Autonomous Universal Code Migration & Self-Repair Engine
**Built on TrueFoundry TrueForge & Daytona Sandboxes · The Agent Harness Hackathon (WeMakeDevs × TrueFoundry × Qodo)**
**Date:** 2026-08-27  
**Status:** Approved

---

## 1. Executive Summary

### 1.1 Problem Statement
Upgrading major frameworks, programming language runtimes, and core libraries (e.g. React 18 $\to$ 19, Next.js Pages $\to$ App Router, Pydantic v1 $\to$ v2, Node 18 $\to$ 22) is one of the most tedious, high-friction, and error-prone challenges in software engineering. 
- Traditional regex or search-and-replace scripts break code syntax.
- Standalone LLMs hallucinate non-existent APIs, introduce subtle type regressions, and fail to verify changes in real test environments.
- Human engineering teams spend hundreds of hours manually fixing breaking changes, updating deprecated signatures, and repairing test suites.

### 1.2 The Solution: MORPHIX
**MORPHIX** is an autonomous universal code migration and self-repair engine powered by the **TrueForge** agent harness. It integrates:
1. **Deterministic AST Codemod Engine:** Performs zero-hallucination syntactic transformations directly on the Abstract Syntax Tree.
2. **Daytona Ephemeral Sandbox:** Safely provisions isolated micro-containers to build, typecheck, and execute full test suites without host side-effects.
3. **NVIDIA AVO Self-Repair Loop:** Automatically inspects compiler/test error traces, generates surgical patches, and iterates until tests exit with Code 0.
4. **Out-of-Band Supervisor Module:** Monitors execution trajectories to detect cyclic debugging loops or plateaus and forces intelligent backtracking.
5. **Cryptographic HITL Gate & Qodo Review:** Renders a clean visual AST diff for human sign-off before opening a verified GitHub Pull Request audited by Qodo.

---

## 2. System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          1. INGESTION LAYER                            │
│  • Target Repository (Local path or GitHub URL)                       │
│  • Migration Rule Pack (e.g. `react-18-to-19.json` or custom markdown) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   2. DETERMINISTIC AST CODEMOD                         │
│  • AST Parser & Matcher (TypeScript Compiler API)                      │
│  • Transforms: Imports, Hook signatures, Props, Config structures      │
│  • Emits: Transformed AST Candidates & Baseline Code Diff              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             3. DAYTONA EPHEMERAL SANDBOX EXECUTION                     │
│  • Provisions isolated container (`@daytonaio/sdk`)                   │
│  • Executes `tsc --noEmit` / `mypy` and `vitest` / `pytest`           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
           ▼ (If Tests PASS: Exit 0)                         ▼ (If Tests FAIL: Exit 1)
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│      4A. HITL & QODO PR CREATION    │   │      4B. NVIDIA AVO SELF-REPAIR     │
│ • Visual AST Diff & Proof Viewer    │   │ • 5-Step Loop: Inspect -> Plan ->   │
│ • Cryptographic HITL Approval Gate  │   │   Act -> Evaluate in Daytona Sandbox│
│ • Automated PR with Qodo Review     │   │ • Supervisor Stagnation Detector    │
└─────────────────────────────────────┘   └──────────────────┬──────────────────┘
                                                             │
                                                             └──► (Iterates max 3x until Exit 0)
```

---

## 3. Core Data Structures & Interfaces

```typescript
// Migration Rule Pack Schema
export interface MigrationRulePack {
  id: string;                         // e.g. "react-18-to-19", "pydantic-v1-to-v2"
  title: string;                      // "React 18 to React 19 Modernizer"
  sourceFramework: string;            // "react@18.x"
  targetFramework: string;            // "react@19.x"
  rules: ASTTransformRule[];          // Exact syntactic transformations
  validationCommands: string[];       // ["npm run build", "npm test"]
  customGuidance?: string;            // Markdown notes / breaking change excerpts
}

export interface ASTTransformRule {
  id: string;
  name: string;                       // e.g. "replace-use-form-state"
  matcher: {
    importSource?: string;            // e.g. "react-dom"
    identifier?: string;              // e.g. "useFormState"
    kind: 'import' | 'function_call' | 'type_reference' | 'config_property';
  };
  replacement: {
    targetImport?: string;            // e.g. "react"
    targetIdentifier?: string;        // e.g. "useActionState"
  };
  explanation: string;
}

// Lineage Tree DAG
export interface MigrationNode {
  id: string;
  parentId: string | null;
  timestamp: number;
  filePath: string;
  appliedRuleId?: string;
  hypothesis?: string;                // "Wrap callback in startTransition to resolve concurrent error"
  diff: string;                       // Unified patch diff
  testResult: {
    exitCode: number;
    passedCount: number;
    failedCount: number;
    stderr?: string;
  };
  status: 'PENDING' | 'VERIFIED_PASS' | 'DEAD_END' | 'SUPERSEDED';
}

// Supervisor Stagnation & Loop Detector Alert
export interface SupervisorAlert {
  alertId: string;
  type: 'CYCLIC_SYNTAX_LOOP' | 'TEST_PLATEAU' | 'UNRESOLVED_TYPE_ERROR';
  detectedPattern: string;
  triggerCount: number;
  recommendedBacktrackNodeId: string;
  strategyOverride: string;          // e.g. "Switch from in-place edit to complete signature refactor"
}
```

---

## 4. Component Modules

### 4.1 `ASTCodemodEngine` (`src/codemod/engine.ts`)
- Parses source code into concrete ASTs using the TypeScript Compiler API.
- Evaluates matcher predicates and executes surgical AST transformations without mangling comments, indentation, or surrounding logic.

### 4.2 `DaytonaSandboxRunner` (`src/sandbox/daytona.ts`)
- Connects to `@daytonaio/sdk` via TrueForge runtime.
- Pre-warms isolated execution workspaces, updates dependency manifests (`package.json` / `pyproject.toml`), runs build targets, and streams test output.

### 4.3 `AVOSelfRepairLoop` (`src/avo/loop.ts`)
- Implements the 5-step iterative evolutionary loop:
  - **Inspect:** Ingests failing compiler/test traces and AST nodes.
  - **Plan:** Formulates an explicit mutation hypothesis.
  - **Act:** Applies targeted code patches in the Daytona sandbox.
  - **Evaluate:** Re-executes the test suite and captures exit codes.
  - **Repeat:** Commits progress on `exitCode === 0` or marks `DEAD_END` and iterates.

### 4.4 `SupervisorModule` (`src/supervisor/detector.ts`)
- Analyzes recent `MigrationNode` trajectories using Levenshtein distance and test score variance.
- Detects cyclic loops or plateaus and enforces backtrack redirects to prevent token thrashing.

### 4.5 `HITLGatekeeper` (`src/hitl/gate.ts`)
- Halts execution state before remote git operations.
- Presents a side-by-side visual AST diff and test verification certificate, requiring cryptographically-signed human approval.

---

## 5. User Interfaces

### 5.1 Interactive CLI TUI (`packages/cli`)
- Fast, accessible terminal interface displaying live progress spinners, active rule applications, streaming Daytona test logs, and interactive approval keys.

### 5.2 Clean Web Dashboard (`packages/web`)
- Minimalist React dashboard powered by `@truefoundry/trueforge-ui`.
- Features repository file trees, rule pack selectors, visual AST diff comparison, and 1-click PR creation.

---

## 6. Testing & Quality Verification

### 6.1 Automated Test Suites
- **`ast.test.ts`:** Verifies deterministic rule matching and syntax tree transformations.
- **`avo.test.ts`:** Mocks compiler errors and tests convergence $\le 3$ iterations.
- **`supervisor.test.ts`:** Asserts detection of cyclic loops and correct backtrack emission.
- **`hitl.test.ts`:** Verifies invariant that zero writes occur without approval tokens.

### 6.2 Hackathon Track Deliverables
- **Double-O Track ($5,000 NVIDIA DGX Spark):** Deep integration of Daytona Sandboxes, TrueForge MCP tools, Subagents, and HITL state gates.
- **Q Branch Track (Mac Mini via Qodo):** Strict feature branch PR workflow, automated Qodo code review, and documented remediation evidence in `README.md`.
