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
| **Operator Approvals** | Trusted | Nonce-backed HMAC-SHA256 tokens with replay prevention and expiration TTL. |

---

## 3. Human-in-the-Loop (HITL) Gatekeeper

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Verified Patch  │ ───►  │ HITL Gatekeeper │ ───►  │ Operator Nonce  │
│   (Sandboxed)   │       │ (HMAC-SHA256)   │       │ (Single-Use TTL)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Replay Protection**: Nonces are stored in memory and marked as `used: true` upon evaluation. Any replayed attempt is rejected with `[HITL Security Replay Attack]`.
- **Expiration TTL**: Nonces expire after 10 minutes (600,000ms). Expired tokens are automatically purged and cannot be evaluated.
- **Fail-Closed Default**: In production mode (`autoApprove: false`), patches are never applied to the host filesystem without explicit operator approval.

---

## 4. Daytona Sandbox Isolation

- Ephemeral container creation guarantees clean environments without cross-contamination.
- Command execution is wrapped in strict timeout boundaries (default 30s) to prevent infinite loops or Denial-of-Service (DoS).
- Local deterministic sandbox adapter runs with isolated process boundaries and stripped privilege sets.

---

## 5. Secret Management

- Secrets (such as `OPENAI_API_KEY`, `DAYTONA_API_KEY`, `HITL_SECRET_KEY`) are read strictly from environment variables.
- No sensitive credentials or tokens are logged or written to disk.
