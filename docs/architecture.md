# System Architecture Document (SAD)
## Project Name: ZeroShield
### Autonomous Cyber Red-Team & Exploit Immunizer Engine
**Document Version:** 1.0.0  
**Date:** 2026-08-27  

---

## 1. Recommended Tech Stack
- **Language & Runtime:** TypeScript (ES2022 / NodeNext), Node.js v22+
- **Agent Orchestration Harness:** `@truefoundry/trueforge-core`, `@truefoundry/trueforge-sdk`
- **Sandbox Container Provider:** Daytona SDK (`@daytonaio/sdk`) for ephemeral isolated micro-VMs
- **AST Parsing & Transformation:** TypeScript Compiler API (`typescript`), `ts-morph`
- **Schema Validation & Typing:** `zod`
- **Terminal CLI Interface:** `commander`, `chalk`, `ora`, `cli-table3`, `diff`
- **Web Dashboard:** React 19, Tailwind CSS, `@truefoundry/trueforge-ui`, Lucide Icons
- **Code Quality & Review:** Qodo GitHub App (`/agentic_review`), `qodo-pr-resolver`

---

## 2. High-Level System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             ZEROSHIELD CLIENT LAYER                             │
│      ┌───────────────────────────────┐     ┌───────────────────────────────┐   │
│      │ Interactive Hacker-Grade CLI  │     │ Web Security Command Center   │   │
│      │ (`packages/cli`)              │     │ (`packages/web`)              │   │
│      └───────────────┬───────────────┘     └───────────────┬───────────────┘   │
└──────────────────────┼─────────────────────────────────────┼───────────────────┘
                       │                                     │
                       ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ZEROSHIELD CORE ENGINE                                │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  ┌────────────────┐ │
│  │ AST VulnerabilityHunter │  │ RedAgentArena (Exploit)  │  │ BlueAgentAVO   │ │
│  │ (`src/hunter`)          │  │ (`src/redteam`)          │  │ (`src/blueteam`)│ │
│  └───────────┬─────────────┘  └────────────┬─────────────┘  └───────┬────────┘ │
│              │                             │                        │          │
│  ┌───────────▼─────────────┐  ┌────────────▼─────────────┐  ┌───────▼────────┐ │
│  │ ImmunizationVerifier    │  │ SupervisorModule         │  │ Cryptographic  │ │
│  │ (`src/verifier`)        │  │ (`src/supervisor`)       │  │ HITLGatekeeper │ │
│  └─────────────────────────┘  └──────────────────────────┘  └────────────────┘ │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   TRUEFOUNDRY TRUEFORGE RUNTIME HARNESS                         │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐ │
│  │ Daytona Sandbox SDK   │  │ MCP Protocol Suite    │  │ SQLite Session Store │ │
│  │ (Ephemeral Container) │  │ (GitHub, Git, SARIF)  │  │ (Audit Trail & DAG)  │ │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────────┘ │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES & VERIFICATION                           │
│  ┌────────────────────────┐  ┌───────────────────────────┐  ┌─────────────────┐ │
│  │ GitHub API (PR Engine) │  │ Qodo Code Review Action   │  │ CVE Databases   │ │
│  └────────────────────────┘  └───────────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Deep-Dive & Data Flow

### 3.1 Ingestion & AST Scanning (`src/hunter/scanner.ts`)
1. User provides target repo path or GitHub URL.
2. `VulnerabilityHunter` traverses the AST, matching function calls, property accesses, and variable assignments against known vulnerability sink signatures.
3. Emits `VulnerabilityReport` containing file paths, line numbers, and exploit payload specifications.

### 3.2 Dynamic Exploit Generation in Daytona (`src/redteam/exploit.ts`)
1. `RedAgentArena` triggers `daytona.create()` to boot an ephemeral Linux container.
2. Clones the target codebase, installs dependencies, and launches the app process.
3. Dispatches the HTTP or CLI exploit payload against the sandbox localhost.
4. Reads response stdout/body and validates the presence of the proof signature.
5. If signature matches $\to$ sets status to `EXPLOIT_CONFIRMED` and logs proof artifact.

### 3.3 Surgical Patch Synthesis & AVO Loop (`src/blueteam/patcher.ts`)
1. `BlueAgentAVO` reads the confirmed vulnerability report and AST sink node.
2. Generates candidate patch:
   - For Command Injection: replaces `exec` with `execFile`, parses parameters into an array, and injects `z.string().regex()` schema.
   - For Prototype Pollution: injects key validation blocking `__proto__`, `constructor`, and `prototype`.
   - For Broken Auth: replaces insecure decode with `jwt.verify(token, secret, { algorithms: ['HS256'] })`.
3. Applies the patch diff inside the Daytona sandbox.

### 3.4 Dual-Pass Immunization Verification (`src/verifier/assert.ts`)
1. **Pass A (Exploit Blockage):** Re-fires the Red Agent's exploit payload. Asserts that the response is HTTP 400 or HTTP 403 and that no sensitive signature leaks.
2. **Pass B (Regression Verification):** Executes `npm test` / `vitest` in the sandbox. Asserts all unit tests pass with Exit 0.
3. If Pass A or Pass B fails, the AVO loop invokes `SupervisorModule` and iterates up to 3 times.

### 3.5 Cryptographic HITL Gate & Qodo PR Creation (`src/hitl/gatekeeper.ts`)
1. Displays the verified CVSS score drop (9.8 $\to$ 0.0) and visual AST code diff to the user.
2. Generates an HMAC session token.
3. Upon user approval, commits the patch to a new git branch, pushes to remote via GitHub MCP connector, and opens a GitHub Pull Request with the automated Qodo review trigger.

---

## 4. Security & Storage Architecture
- **Sandbox Isolation:** All exploit scripts and unverified code run strictly in Daytona Docker containers with non-root user permissions and isolated bridge networking.
- **Audit Persistence:** Execution traces, Lineage Tree DAG nodes, and patch diffs are stored locally in SQLite (`PRAGMA journal_mode = WAL;`) for full post-incident auditability.
- **Keyring Secret Store:** GitHub and Daytona API tokens are read securely from system environment variables or OS keyring stores.
