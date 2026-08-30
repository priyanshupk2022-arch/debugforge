# 📋 DEBUGFORGE — LIVE DEMO OPERATOR RUNBOOK & JUDGE CHECKLIST

**Target Version:** DebugForge v1.0.0  
**Target Repository:** [https://github.com/priyanshupk2022-arch/debugforge](https://github.com/priyanshupk2022-arch/debugforge)  
**Status:** READY FOR LIVE DEMO & EVALUATION (GREEN ✅)  

---

## 1. Operator Prerequisites

Ensure your presentation machine has the following baseline tools installed:
- **Node.js:** v20.0.0+ (Tested on v20.x, v22.x, v24.x)
- **npm:** v10.0.0+
- **Git:** Git 2.30+
- **Supported Platforms:** Windows PowerShell, Linux Bash, macOS Zsh, or WSL2

---

## 2. 8-Step Operator Execution Script

### Step 1: Clean Clone & Workspace Build (45 seconds)
```bash
# 1. Clone repository
git clone https://github.com/priyanshupk2022-arch/debugforge.git
cd debugforge

# 2. Install workspace dependencies
npm install

# 3. Build all workspace packages (core, cli, web)
npm run build:all
```

---

### Step 2: Configure Model Provider (Optional, 15 seconds)

Operators can select their preferred LLM provider or rely on the built-in local deterministic mode:

#### Option A: Google Gemini
```bash
export DEBUGFORGE_MODEL_PROVIDER=google
export DEBUGFORGE_MODEL=gemini-2.0-flash
export GEMINI_API_KEY="your-gemini-key"
```

#### Option B: Anthropic Claude
```bash
export DEBUGFORGE_MODEL_PROVIDER=anthropic
export DEBUGFORGE_MODEL=claude-3-5-sonnet-latest
export ANTHROPIC_API_KEY="your-anthropic-key"
```

#### Option C: OpenAI
```bash
export DEBUGFORGE_MODEL_PROVIDER=openai
export DEBUGFORGE_MODEL=gpt-4o
export OPENAI_API_KEY="your-openai-key"
```

#### Option D: DeepSeek / Custom
```bash
export DEBUGFORGE_MODEL_PROVIDER=deepseek
export DEBUGFORGE_MODEL=deepseek-chat
export DEEPSEEK_API_KEY="your-deepseek-key"
```

*(Note: If no API keys are provided, DebugForge runs in high-assurance local deterministic evaluation mode automatically.)*

---

### Step 3: Run Demo Scenario 1 — Null Propagation API (60 seconds)
```bash
npm run demo:null
```
- **What to Observe:**
  1. **Sandbox Reproduction:** Daytona sandbox captures crash in `pricing-service.ts:18`.
  2. **Backward Causal Graph:** Isolates root infection origin at `order-controller.ts:39` from proximate crash site.
  3. **BRT Synthesis:** Synthesizes Bug Reproduction Test and confirms pre-patch failure.
  4. **Unified Diff:** Shows surgical invariant guard patch.
  5. **Triple-Lock Verification:** Locks 1, 2, and 3 pass with 100% test score.
  6. **Interactive HITL Gate:** Prompts operator with single-use cryptographic nonce. Type `y` to apply.

---

### Step 4: Run Demo Scenario 2 — Async Race Condition App (45 seconds)
```bash
npm run demo:race
```
- **What to Observe:**
  1. Identifies concurrent shared mutable state corruption across parallel transactions.
  2. Synthesizes an async transaction mutex queue (`withLock`).
  3. Verifies 10/10 concurrent stress test operations pass without balance corruption.

---

### Step 5: Run Demo Scenario 3 — Memory Leak Server (45 seconds)
```bash
npm run demo:memory
```
- **What to Observe:**
  1. Detects unbounded global cache accumulation under high request traffic.
  2. Refactors data structure into a bounded FIFO Ring Buffer (Capacity 50) with automated eviction.
  3. Verifies memory stabilization across 1,000 continuous requests.

---

### Step 6: Launch Web Landing Simulator & Telemetry HUD (30 seconds)
```bash
npm run dev
```
- Open browser to **`http://localhost:5173`**.
- **Key Features to Showcase:**
  - **Interactive Terminal Simulator:** Switch between Null Cascade, Race Condition, and Memory Leak tracks.
  - **Playback Controls:** Use `Play/Pause`, `Step Forward`, and `Speed Multipliers` (1x/2x/4x).
  - **Live HITL Buttons:** Click `Approve (y)` to observe the live patch deployment animation.
  - **Telemetry HUD:** Showcase Daytona Sandboxes active metric, MTTR reduction, and Qodo Review Gate score (99/100).

---

### Step 7: Verify Live TrueForge SSE Stream & Benchmark (45 seconds)
```bash
# 1. Live TrueForge Server SSE Turn Stream & MCP Tool Verification
npm run test:live

# 2. DebugForge-Bench 5-Task Benchmark Suite
npm run bench
```
- **Expected Benchmark Output:**
  ```json
  {
    "totalTasks": 5,
    "passedTasks": 5,
    "failedTasks": 0,
    "verifiedResolutionRate": 1,
    "executionMode": "BENCH_LOCAL"
  }
  ```

---

### Step 8: Demo Cleanup & Reset (5 seconds)
```bash
# Reset fixture files back to initial broken state
git checkout -- fixtures/
```

---

## 3. Live Operator Emergency Cheat Sheet & Fallbacks

| Situation / Symptom | Root Cause | Immediate Action |
| :--- | :--- | :--- |
| **"No reproducible crash detected"** | Fixture already patched in previous run | Run `git checkout -- fixtures/` and re-run command. |
| **No Internet / Missing API Keys** | Running in offline conference venue | Leave env vars unset; DebugForge executes local deterministic adapter. |
| **Port 5173 Already in Use** | Another web dev server active | Vite automatically assigns next port (e.g. `5174`), or pass `--port 3000`. |
| **Non-Interactive CI Automation** | Script running in CI/headless terminal | Add `--no-auto-approve` or pass `-y` to skip interactive prompt. |
| **Model Provider Error** | Invalid provider name configured | Check `DEBUGFORGE_MODEL_PROVIDER`. Supported: `openai`, `anthropic`, `google`, `deepseek`. |

---

## 4. Final Operator Sign-Off

| Checkpoint | Requirement | Status |
| :--- | :--- | :---: |
| **Build** | `npm run build:all` executes with exit code 0 | **PASS ✅** |
| **CLI TUI** | Colored streaming thoughts, causal tree, diff preview, HITL nonce | **PASS ✅** |
| **Web UI** | Vite dev server runs smoothly at `http://localhost:5173` | **PASS ✅** |
| **Fixtures** | Scenarios 1, 2, and 3 reproduce and auto-heal cleanly | **PASS ✅** |
| **Triple-Lock** | 3 independent verification gates enforced on every patch | **PASS ✅** |
| **Fail-Closed** | Invalid credentials/unroutable daemons halt safely | **PASS ✅** |
| **Benchmark** | `npm run bench` completes 5/5 tasks with 100% resolution rate | **PASS ✅** |

**Operator Rehearsal Result: VERIFIED & READY FOR HACKATHON EVALUATION 🚀**
