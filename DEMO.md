# 🎬 DebugForge Live Demo & Evaluation Guide

> **"DebugForge is model-provider agnostic and uses the provider/model configured by the operator through the TrueForge runtime."**

---

## 1. Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/priyanshupk2022-arch/zeroshield.git
cd zeroshield

# 2. Install dependencies
npm install

# 3. Build all workspace packages
npm run build:all
```

---

## 2. Choosing Your Model Provider (OpenAI, Anthropic, Google Gemini, Custom)

Operators can run the demo with their preferred LLM provider:

### Option A: Google Gemini
```bash
export DEBUGFORGE_MODEL_PROVIDER=google
export DEBUGFORGE_MODEL=gemini-2.0-flash
export GEMINI_API_KEY="AIzaSy..."
```

### Option B: Anthropic Claude
```bash
export DEBUGFORGE_MODEL_PROVIDER=anthropic
export DEBUGFORGE_MODEL=claude-3-5-sonnet-latest
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Option C: OpenAI
```bash
export DEBUGFORGE_MODEL_PROVIDER=openai
export DEBUGFORGE_MODEL=gpt-4o
export OPENAI_API_KEY="sk-proj-..."
```

### Option D: DeepSeek / Custom
```bash
export DEBUGFORGE_MODEL_PROVIDER=deepseek
export DEBUGFORGE_MODEL=deepseek-chat
export DEEPSEEK_API_KEY="sk-..."
```

### Provider Normalization & Strict Validation Rules
- **Omitted Provider**: Defaults cleanly to `openai`.
- **Valid Aliases**: Case-insensitive and trimmed (e.g. `"claude"` ➔ `anthropic`, `"gemini"` ➔ `google-gemini`, `"qwen"` ➔ `alibaba`, `"deepseek"` ➔ `custom`).
- **Invalid Providers Fail Closed**: Explicitly supplying an unrecognized provider (e.g. `foobar`, `random-vendor`) throws `[TrueForge Provider Blocker]` immediately. Unsupported providers are **never** silently converted to OpenAI.

---

## 3. Demo Scenarios

### Demo 1: Autonomous Auto-Healing on Silent Null Propagation
```bash
npm run demo:null
```
- **What to observe**: The agent ingests the runtime crash, isolates the root infection origin in `user-service.js:8` from the crash site in `order-service.js:14`, synthesizes a surgical patch, runs Triple-Lock verification, and prompts for Human-in-the-Loop approval.

### Demo 2: Autonomous Auto-Healing on Async Race Condition
```bash
npm run demo:race
```
- **What to observe**: The agent traces concurrent state corruption across simultaneous transfers, synthesizes an async transaction mutex queue, and verifies that 10/10 concurrency stress tests pass.

### Demo 3: Autonomous Auto-Healing on Memory Leak
```bash
npm run demo:memory
```
- **What to observe**: The agent detects unbounded global cache growth, refactors the data structure into an LRU bounded ring buffer, and verifies memory stabilization across 1,000 requests.

### Demo 4: Interactive Web UI Simulator
```bash
npm run dev
# Open http://localhost:5173
```

---

## 4. Human-in-the-Loop Approval & Verification

During CLI diagnosis (`debugforge diagnose`), the execution pauses at Stage 5:
- **`AWAITING_APPROVAL`**: Displays cryptographic single-use nonce, files affected, and diff view.
- **Press `y` (Approve)**: Verifies nonce and HMAC-SHA256 signature, validates patch hash, writes changes to workspace disk, and reports success.
- **Press `n` (Reject)**: Cancels operation and guarantees workspace remains untouched.
