# 📋 LIVE DEMO CHECKLIST & OPERATOR RUNBOOK

**Target Version:** DebugForge v1.0.0  
**Target Repository:** [https://github.com/priyanshupk2022-arch/debugforge](https://github.com/priyanshupk2022-arch/debugforge)  

---

## 1. Operator Prerequisites

- **Node.js:** v20.0.0+ (Tested on v22.x / v24.x)
- **Git:** Git 2.30+
- **Terminal:** Windows PowerShell, Linux Bash, macOS Zsh, or WSL2

---

## 2. Step-by-Step Demo Execution Script

### Step 1: Clean Clone and Setup (30 seconds)
```bash
# Clone the repository
git clone https://github.com/priyanshupk2022-arch/debugforge.git
cd debugforge

# Install and build all packages
npm install
npm run build:all
npm link --prefix packages/cli
```

### Step 2: Configure Model Provider (Optional)
```bash
# Set your preferred provider (Anthropic, Google, OpenAI, DeepSeek, or Custom)
export DEBUGFORGE_MODEL_PROVIDER=anthropic
export ANTHROPIC_API_KEY="your-api-key"
# (If omitted, DebugForge operates in local deterministic demo mode automatically)
```

### Step 3: Run Interactive Diagnosis on Failing Fixture (60 seconds)
```bash
debugforge diagnose --target fixtures/null-propagation-api
```
* **Expected Output:**
  - Ingestion of crash site (`pricing-service.ts:18`)
  - Backward causal graph identifying root cause in `order-controller.ts:39`
  - Synthesis of Bug Reproduction Test (BRT)
  - Unified AST Diff with Blast Radius analysis
  - Triple-Lock Verification (Lock 1, Lock 2, Lock 3 passing)
  - Interactive Human-in-the-Loop approval prompt with single-use nonce

### Step 4: Interactive Operator Approval
* Type `y` and press Enter.
* **Result:** Patch is safely applied to the workspace.

### Step 5: Verify Live TrueForge Integration & Benchmark (30 seconds)
```bash
# Run Live TrueForge SSE Turn Stream
npm run test:live

# Run DebugForge-Bench
npm run bench
```

---

## 3. Demo Cleanup & Reset
```bash
git checkout -- fixtures/
```
