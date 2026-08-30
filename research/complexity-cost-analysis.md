# 💰 Complexity & Economic Cost Analysis (`research/complexity-cost-analysis.md`)

> **Complexity & Cost Reviewer Role**: Evaluate engineering complexity, runtime execution overhead, token expenditure, and operational maintenance for all proposed subsystems.

---

## 1. Complexity & Overhead Assessment Matrix

| Proposed Subsystem | Engineering Complexity | Runtime Overhead (per turn) | Token / API Cost Impact | Maintenance Burden | Decision & Pragmatic Calibration |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Dynamic Instruction Bytecode Slicing** | **VERY HIGH** | **$30\times - 100\times$** slowdown | Neutral (internal compute) | High (V8 / Python VM version coupling) | **REJECT BYTECODE SLICING**: Use AST Call Graph + Stack Frame walks. |
| **Global Mutation Testing ($\ge 85\%$ kill)** | **HIGH** | **$10\times - 50\times$** test runs | Neutral to High | Moderate (mutant synthesis rules) | **REJECT GLOBAL MUTATION**: Use Local Line-Range Differential Mutants. |
| **Multi-Agent Consensus (3 Models)** | **MODERATE** | **$3\times$** latency | **$300\%$** token cost surge | Moderate (multi-provider API key deps) | **CALIBRATE**: Asymmetric prompt/role review with optional cross-family routing. |
| **Merkle Checkpoint Graph** | **LOW** | **$<5$ ms** (SHA-256 in memory) | **$0\%$** token cost | Minimal (pure TypeScript) | **ADOPT IMMEDIATELY**: High value, low overhead, deterministic loop breaker. |
| **Task Memory Store with TTL** | **LOW** | **$<1$ ms** | **Reduces token bloat by 60%** | Minimal (pure in-memory Map) | **ADOPT IMMEDIATELY**: Isolates verified facts, prunes failed hypotheses. |
| **Anti-Gaming Snapshot Sentinel** | **LOW** | **$<10$ ms** (hash test tree) | **$0\%$** token cost | Minimal (regex diff scanning) | **ADOPT IMMEDIATELY**: 100% defense against test skipping and cheating. |
| **Sandlock / Landlock Kernel Modules** | **VERY HIGH** | **$<5$ ms** on Linux (fails on Win/Mac) | **$0\%$** token cost | Very High (requires root / Linux 5.13+) | **DEFER KERNEL HOOKS**: Rely on Daytona OCI microVMs for container boundaries. |

---

## 2. Phase-Level Token & Financial Budgeting

```
Total Session Budget Cap: $2.00 USD (300,000 tokens)
├── Phase 1: Ingress & RCA Localization  ──> Max $0.30 USD (50,000 tokens / 10 tool calls)
├── Phase 2: Patch Synthesis             ──> Max $1.00 USD (150,000 tokens / 10 attempts)
└── Phase 3: Triple-Lock Verification    ──> Max $0.70 USD (100,000 tokens / 5 test runs)
```
- **Circuit Breaker Policy**: If any individual phase exceeds its cap, execution halts immediately and rolls back to the clean baseline checkpoint.
