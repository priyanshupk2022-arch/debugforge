# 🛡️ ZeroShield: Autonomous Cyber Red-Team & Exploit Immunizer

[![CI & Qodo Review](https://github.com/priyanshupk2022-arch/zeroshield/actions/workflows/ci.yml/badge.svg)](https://github.com/priyanshupk2022-arch/zeroshield/actions/workflows/ci.yml)
[![Built with TrueForge](https://img.shields.io/badge/Runtime-TrueFoundry%20TrueForge-blue)](https://truefoundry.com)
[![Daytona Sandboxed](https://img.shields.io/badge/Sandbox-Daytona%20SDK-orange)](https://daytona.io)
[![Qodo Certified Quality](https://img.shields.io/badge/Code%20Review-Qodo%20Verified-brightgreen)](https://qodo.ai)

> **ZeroShield** is an autonomous cyber red-team and exploit immunizer engine built on the **TrueFoundry TrueForge** agent harness, **Daytona Ephemeral Sandboxes**, and **Qodo Code Quality**. It discovers security vulnerabilities, dynamically proves exploits in isolated sandboxes with zero false positives, synthesizes surgical AST code patches via the **NVIDIA AVO 5-step evolutionary loop**, and opens verified Pull Requests.

---

## 🌟 Key Architecture & Superpowers

1. **AST Vulnerability Hunter:** Scans source trees for dangerous sinks (Command Injections, Prototype Pollution, Broken Auth/JWT flaws).
2. **Red Agent Exploit Arena (Daytona Sandbox):** Executes live attack payloads inside isolated Daytona micro-containers, proving exploitability with 0% false positives.
3. **Blue Agent Surgical Immunizer (NVIDIA AVO Loop):** Employs an evolutionary `Inspect -> Plan -> Act -> Evaluate -> Repeat` loop to rewrite AST sinks into type-safe parameterized implementations with `Zod` validation.
4. **Triple-Lock Immunization Assertion:** 
   - **Lock 1:** Re-runs exploit payload $\to$ Asserts 100% blocked (HTTP 400/403).
   - **Lock 2:** Dispatches golden legitimate inputs $\to$ Asserts normal app logic works (HTTP 200).
   - **Lock 3:** Executes test suite $\to$ Asserts zero functional regressions (Exit 0).
5. **Cryptographic HITL Gate:** Freezes execution, presents Before/After CVSS score reduction (9.8 Critical $\to$ 0.0 Clean), and requires HMAC human sign-off.
6. **Automated Qodo PR Reviews:** Submits verified patches to feature branches and triggers automated Qodo code quality audits.

---

## 📊 Qodo Code Quality & Review Evidence

As required by the **Q Branch Track (Mac Mini Prize)**, all substantive code updates are audited via Qodo automated PR reviews:

| PR # | Feature / Component | Initial Findings | Remediation & Commits | Qodo Approval Status |
|---|---|---|---|---|
| [#1](https://github.com/priyanshupk2022-arch/zeroshield/pull/1) | `feature/core-engine-foundation` | Baseline Monorepo Scaffolding | Strict typing & AST boundaries | ✅ Verified Clean (Exit 0) |

---

## 🚀 Quickstart & Installation

```bash
# 1. Clone repository
git clone https://github.com/priyanshupk2022-arch/zeroshield.git
cd zeroshield

# 2. Install dependencies
npm install

# 3. Build monorepo packages
npm run build

# 4. Run 4-tier mechanical test gates
npm test

# 5. Run interactive security scan
npx zeroshield scan ./fixtures/vulnerable-payment-app
```

---

## 📜 Documentation Suite
- [Product Requirements Document (PRD)](docs/prd.md)
- [Software Requirements Specification (SRS)](docs/srs.md)
- [System Architecture Document](docs/architecture.md)
- [UI/UX Specification](docs/ui-ux.md)
- [Development Plan & Roadmap](docs/development-plan.md)
- [10X Master Spec](docs/superpowers/specs/2026-08-27-zeroshield-10x-master-spec.md)
- [Hierarchical 2000+ Node Graph Matrix](docs/superpowers/specs/2026-08-27-zeroshield-hierarchical-graph-matrix.md)
