# 🔒 DebugForge Security & Threat Model

## 1. Security Architecture & Threat Model

DebugForge is designed with a **Fail-Closed** security architecture to safely analyze, reproduce, and patch untrusted software repositories.

---

## 2. Trust Boundaries

| Boundary | Trust Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **User Input / Stack Traces** | Untrusted | Sanitized and validated via Zod schemas. Path traversal patterns (`../`) stripped. |
| **Sandbox Execution** | Untrusted Code | Executed inside isolated **Daytona Workspaces** with network & memory limits. |
| **Patch Application** | Semi-trusted | Confined strictly to sandbox until explicitly approved via cryptographic HITL. |
| **Operator Approvals** | Trusted | Nonce-backed HMAC-SHA256 tokens with replay prevention and patch integrity hash. |
| **Model Provider Secrets** | Highly Sensitive | Kept strictly in process environment variables; zero dummy credentials in production. |

---

## 3. Human-in-the-Loop (HITL) Gatekeeper & Apply Path

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Verified Patch  │ ───►  │ HITL Gatekeeper │ ───►  │ Operator Nonce  │
│   (Sandboxed)   │       │ (HMAC-SHA256)   │       │ (Single-Use TTL)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Replay Protection**: Nonces are stored in memory and marked as `used: true` upon evaluation. Any replayed attempt is rejected with `[HITL Security Replay Attack]`.
- **Patch Integrity & Tamper Detection**: Computes SHA-256 hash of unified diffs. Modifying patch content after approval request generation immediately fails evaluation.
- **Constant-Time Verification**: `crypto.timingSafeEqual` prevents timing side-channel attacks on HMAC-SHA256 signatures.
- **Expiration TTL**: Nonces expire after 10 minutes (600,000ms). Expired tokens are automatically purged and cannot be evaluated.
- **Fail-Closed Default**: In production mode (`autoApprove: false`), patches are never applied to host workspace files without explicit operator approval.
- **Actual Disk Mutation**: Upon valid operator approval, `applyPatch()` safely writes surgical changes to target files. Upon rejection, files remain untouched.

---

## 4. Daytona Sandbox Isolation

- Ephemeral container creation guarantees clean environments without cross-contamination.
- Command execution is wrapped in strict timeout boundaries (default 30s) to prevent infinite loops or Denial-of-Service (DoS).
- Local deterministic sandbox adapter runs with isolated process boundaries and stripped privilege sets.

---

## 5. Secret Management & Zero Dummy Credentials Policy

- **Zero Production Dummy Keys**: No fake keys (e.g. `sk-dummy-key`) are permitted in production or live execution paths.
- **Fail-Closed Validation**: If a required provider key (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`) is missing when running against a live server, execution blocks immediately (`[Model Provider Blocker]`).
- **No Disk Leaks**: API tokens and cryptographic secrets are never written to logs, artifacts, or disk.

---

## 6. Supported Versions

| Version | Supported          |
| :---    | :---               |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 7. Reporting a Vulnerability

We take the security of DebugForge and its automated execution environment seriously. If you believe you have found a security vulnerability in DebugForge, please report it to us responsibly:

1. **Do NOT open a public GitHub issue** for undisclosed security vulnerabilities.
2. Please report security issues via **GitHub Security Advisories** (preferred) or email the core maintainers at `security@debugforge.dev` with:
   - Type of issue (e.g. sandbox breakout, command injection, path traversal, replay attack)
   - Step-by-step instructions to reproduce the issue
   - Proof of Concept (PoC) code or command snippet if available
   - Impact assessment
3. **Response Timeline**:
   - Initial acknowledgement: within **24 hours**
   - Severity assessment and triage: within **48 hours**
   - Patch release and disclosure coordination: within **7 business days** for critical issues.

