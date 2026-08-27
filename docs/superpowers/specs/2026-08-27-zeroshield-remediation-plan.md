# ZeroShield: P0/P1/P2 Remediation & Productionization Plan

## 1. Deep Audit Findings Inventory

### P0 Issues (Critical Fake Security / Dangerous Shortcuts)
1. **P0-1: Mock Test Suite Passing in Verifier** (`packages/core/src/verifier/assert.ts:32`)
   - `mockTestSuitePass ?? true` allows bypassing real test suite execution.
   - Fix: Execute the actual package manager test command (`npm test`, `pnpm test`, `yarn test`, `bun test`) inside the sandbox and capture actual exit codes, stdout, and stderr.
2. **P0-2: Fake / Hardcoded Exploit Confirmation in Red Team** (`packages/core/src/redteam/exploit.ts`)
   - Uses hardcoded localhost port fallback and synthetic `daytona_sandbox_${Date.now()}` ID without real container/process isolation.
   - Fix: Integrate real isolated sandbox lifecycle with Daytona SDK / local isolated container / strict sandboxed child process with resource limits, cgroups/timeouts, and process teardown.
3. **P0-3: Fragile String / Regex Code Patching in Blue Team** (`packages/core/src/blueteam/patcher.ts`)
   - Uses `.replace(...)` regex on source code strings instead of AST transformation via TypeScript Compiler API / ts-morph.
   - Injects default hardcoded JWT secrets (`process.env.JWT_SECRET || 'default-secret-key'`).
   - Fix: Implement true AST-based code transformations using TypeScript Compiler API with syntax validation and strict compile verification. Reject default secrets.
4. **P0-4: Toy / Insecure Cryptographic Signatures in HITL & Web** (`packages/web/src/components/HitlApprovalModal.tsx:31-41`)
   - Uses bitshift arithmetic (`(hash << 5) - hash`) for "cryptographic signature" and hardcoded PR numbers `#42`.
   - `packages/core/src/hitl/gatekeeper.ts` uses fallback default secret `'zeroshield-default-crypto-secret'`.
   - Fix: Implement real HMAC-SHA256 / Ed25519 cryptographic token binding human approval to the exact patch digest, commit hash, timestamp, and operator identity. Mandatory secret requirement.
5. **P0-5: Static Mock Scenarios & Synthetic Timers in Web UI** (`packages/web/src/App.tsx`, `packages/web/src/data/mockSecurityScenarios.ts`)
   - UI runs on `setTimeout` fake stage transitions and hardcoded scenarios.
   - Fix: Connect Web UI to a real backend REST / SSE / MCP server that reports live scan, exploit, AVO patch, and verifier state.
6. **P0-6: Unverified Static Sink Matching in Hunter** (`packages/core/src/hunter/scanner.ts`)
   - Hardcodes exploit specifications (`/api/report`, `/api/user/profile`, `/api/config/update`) regardless of actual scanned routes.
   - Fix: Implement real route-aware AST source-to-sink analysis, parameter extraction, and framework-aware exploit specification generation.

---

### P1 Issues (High Importance Architecture & Integration Gaps)
1. **P1-1: Real GitHub Integration Missing**
   - No direct GitHub API client for branch creation, patch commit, push, and PR opening with actual PR URLs and Qodo review trigger.
   - Fix: Implement `@zeroshield/core/src/github/client.ts` with Octokit / native REST for real GitHub PR creation with security audit bodies.
2. **P1-2: CLI Command Suite Incompleteness** (`packages/cli/src/index.ts`)
   - Only has `scan` with simulated output logs. Missing `exploit`, `immunize`, `verify`, `approve`, `pr`, `audit` subcommands and proper exit codes (0, 1, 2, 3, 4).
   - Fix: Implement full modular CLI command suite calling actual engine methods with structured output.
3. **P1-3: MCP Server Workspace Boundary & Path Traversal Security** (`packages/core/src/mcp/server.ts`)
   - Allows arbitrary `targetDir` without path canonicalization, workspace allowlists, or traversal protection.
   - Fix: Add strict path validation, sandbox containment, and traversal defenses.
4. **P1-4: CI/CD Security Hardening & Pinned Action SHAs** (`.github/workflows/ci.yml`)
   - Uses unpinned `@v4`, `@main` references. Missing secret scanning, dependency audit (`npm audit`), and SAST.
   - Fix: Pin GitHub Actions to commit SHAs, add `verify:anti-cheat`, `npm audit`, and strict CI gates.

---

### P2 Issues (Production Hygiene, Observability & Deployment)
1. **P2-1: Production Backend Server Missing**
   - Web UI needs a backend API server (`packages/server` or `@zeroshield/core` HTTP daemon) to execute live scans.
   - Fix: Create lightweight production HTTP/SSE server in `@zeroshield/core` or `packages/cli serve`.
2. **P2-2: Production Deployment Artifacts Missing**
   - Missing Dockerfile, docker-compose, health/readiness endpoints.
   - Fix: Add production multi-stage Dockerfile and healthcheck endpoints.
3. **P2-3: Structured Logging & Metrics**
   - Console logs lack correlation IDs (scanId, executionId, auditId).
   - Fix: Implement structured JSON telemetry logger.

---

## 2. Systematic Execution Plan

- **Step 1: Core Engine Hardening (`packages/core`)**
  - Fix `types/index.ts` (strict non-optional contracts, real AST types).
  - Implement `hunter/scanner.ts` with real TypeScript AST source-to-sink route extraction.
  - Implement `redteam/sandbox.ts` & `redteam/exploit.ts` with real Daytona / local isolated container execution with timeout, memory limit, and cleanup.
  - Implement `blueteam/patcher.ts` with real TypeScript AST compiler API transformations (no regex hacks, no default secrets).
  - Implement `verifier/assert.ts` with real process test suite execution (Lock 1, Lock 2, Lock 3).
  - Implement `hitl/gatekeeper.ts` with strict HMAC-SHA256 digest binding without fallback secrets.
  - Implement `github/client.ts` with real GitHub branch/commit/PR integration.
  - Implement `mcp/server.ts` with workspace allowlists, path canonicalization, and strict validation.
  - Implement `telemetry/logger.ts` for structured audit logs.
- **Step 2: CLI Modernization (`packages/cli`)**
  - Implement full command suite (`scan`, `exploit`, `immunize`, `verify`, `approve`, `pr`, `serve`) with exit codes 0-4.
- **Step 3: Web Dashboard Backend & Real API Integration (`packages/web`)**
  - Remove all mock scenarios and fake setTimeout loops.
  - Wire real API endpoints (`/api/scan`, `/api/exploit`, `/api/patch`, `/api/verify`, `/api/approve`, `/api/pr`).
- **Step 4: Real E2E and Adversarial Security Tests (`tests/`)**
  - Write real end-to-end integration tests on all 3 vulnerable fixtures.
  - Write adversarial attack tests against ZeroShield itself (path traversal, malicious unicode, injection, replay attacks).
- **Step 5: Docker & CI/CD Hardening**
  - Add Dockerfile, pin GitHub Action SHAs, add dependency auditing and secret scanning.
