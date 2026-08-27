# Software Requirements Specification (SRS)
## Project Name: ZeroShield
### Autonomous Cyber Red-Team & Exploit Immunizer Engine
**Document Version:** 1.0.0  
**Standard:** IEEE 830 / Modern Agile SRS  
**Date:** 2026-08-27  

---

## 1. Functional Requirements

### FR-1: AST Vulnerability Hunter & Scanner
- **FR-1.1:** The system shall parse target source code into Abstract Syntax Trees (AST) using TypeScript Compiler API (`ts-morph` / `typescript`).
- **FR-1.2:** The system shall match dangerous sinks against predefined vulnerability pattern rules:
  - CWE-78: OS Command Injection (`child_process.exec`, `eval`, `Function`).
  - CWE-1321: Prototype Pollution (Unsafe recursive deep-merge, `Object.assign` with dynamic keys).
  - CWE-287 / CWE-639: Broken Authentication & IDOR (Unverified `jwt.decode`, unauthenticated ID lookups).
- **FR-1.3:** For each matched sink, the system shall emit a structured `VulnerabilityReport` containing file path, line number, sink identifier, and exploit payload template.

### FR-2: Red Agent Dynamic Exploit Arena (Daytona Sandboxing)
- **FR-2.1:** The system shall invoke `@daytonaio/sdk` to provision an isolated, ephemeral container workspace.
- **FR-2.2:** The system shall copy the target repository into the sandbox and launch the application process on an isolated localhost port.
- **FR-2.3:** The system shall execute targeted HTTP or CLI exploit payloads against the running instance.
- **FR-2.4:** The system shall parse process stdout and HTTP responses to assert the presence of proof signatures (e.g. `/etc/passwd` text fragments or polluted prototype properties), confirming exploit validity.

### FR-3: Blue Agent Surgical Immunizer (NVIDIA AVO Engine)
- **FR-3.1:** The system shall execute the 5-step closed AVO loop: `Inspect` $\to$ `Plan` $\to$ `Act` $\to$ `Evaluate` $\to$ `Repeat`.
- **FR-3.2:** The system shall replace dangerous sinks with safe equivalents:
  - Replacing `child_process.exec(cmd)` with `child_process.execFile(binary, [args])`.
  - Injecting runtime input validation schemas (`Zod`).
  - Replacing `jwt.decode` with cryptographic `jwt.verify(token, secret)`.
- **FR-3.3:** The system shall limit self-repair iterations to a maximum of $N = 3$.

### FR-4: Dual-Pass Immunization Verifier
- **FR-4.1:** The system shall execute Pass 1: re-fire the exact Red Agent exploit payload and verify it returns HTTP 400 (Bad Request) or HTTP 403 (Forbidden) without application crash.
- **FR-4.2:** The system shall execute Pass 2: execute `npm test` / `vitest` inside the sandbox and verify the exit code is strictly 0.

### FR-5: Cryptographic HITL Gateway
- **FR-5.1:** The system shall halt execution before any git push or remote branch creation.
- **FR-5.2:** The system shall generate a cryptographically signed session token (HMAC-SHA256) and display the Before/After CVSS Risk Score (9.8 $\to$ 0.0) and visual AST diff.
- **FR-5.3:** The system shall resume execution only when the user submits an approval signature.

### FR-6: Automated Qodo PR Dispatcher
- **FR-6.1:** Upon HITL approval, the system shall create a feature branch (`fix/security-immunize-<vuln-id>`), commit verified patch diffs, and open a GitHub Pull Request via GitHub MCP tool.
- **FR-6.2:** The system shall trigger Qodo automated code quality review on the opened PR.

---

## 2. Non-Functional Requirements

### NFR-1: Performance & Latency
- **NFR-1.1:** Static AST scan across a repository of $\le 500$ files shall complete in $< 3.0$ seconds.
- **NFR-1.2:** Daytona Sandbox container provisioning and baseline boot shall complete in $< 10.0$ seconds.
- **NFR-1.3:** Total end-to-end vulnerability detection, sandbox exploit, patch generation, and verification cycle shall complete in $< 60$ seconds for standard repositories.

### NFR-2: Security & Isolation
- **NFR-2.1:** Exploit payloads and target applications shall strictly execute within Daytona sandboxes with isolated network namespaces.
- **NFR-2.2:** No exploit payload shall ever execute directly on the host development machine.
- **NFR-2.3:** API tokens (GitHub, Daytona, Qodo) shall be loaded from environment variables and never logged in plain text.

### NFR-3: Reliability & Determinism
- **NFR-3.1:** All AST transformation rules shall be deterministic; applying the same rule to identical AST nodes shall produce byte-for-byte identical output.
- **NFR-3.2:** If the Daytona sandbox fails to connect or times out after 180s, the system shall cleanly terminate the container and emit a structured error diagnostic.

---

## 3. User Roles & Permissions

| Role | Permissions |
|---|---|
| **Security Analyst / Developer** | Initiate scans, inspect exploit logs, review AST diffs, approve HITL gates, trigger PR creation. |
| **System Daemon (Autonomous Agent)** | Provision sandboxes, execute exploit tests, apply AST patches, run regression tests. Blocked from pushing to `main` branch. |

---

## 4. Error Handling & Edge Cases
- **Edge Case 1: Sandbox Port Conflict:** System dynamically binds target applications to ephemeral random ports (`40000..50000`).
- **Edge Case 2: Broken Existing Test Suite:** If target repo has pre-existing failing tests before patching, the system logs a baseline snapshot and only asserts that the patch introduces zero *new* test failures.
- **Edge Case 3: Cyclic Repair Loop:** If Blue Agent generates oscillating fixes, `SupervisorModule` flags `CYCLIC_SYNTAX_LOOP` and forces a strategy pivot.
