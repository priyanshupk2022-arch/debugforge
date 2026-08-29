# 🎬 DebugForge Live Demo & Evaluation Guide

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

## 2. Environment Variables (Optional)

```bash
# OpenAI API key (for live model routing)
export OPENAI_API_KEY="your-api-key"

# Daytona Cloud Sandbox (optional - falls back to deterministic local adapter if unset)
export DAYTONA_API_KEY="your-daytona-key"
export DAYTONA_SERVER_URL="https://app.daytona.io/api"
```

---

## 3. Demo Commands

### Demo 1: Autonomous Auto-Healing on Silent Null Propagation
```bash
npm run demo:null
```
- **What to observe**: The agent ingests the error, locates the true infection origin at `user-service.js:8`, synthesizes a 2-file patch, and proves the fix with Triple-Lock verification.

### Demo 2: Autonomous Auto-Healing on Async Race Condition
```bash
npm run demo:race
```
- **What to observe**: The agent traces the concurrent state corruption, injects an async mutex queue, and asserts the 10/10 concurrency invariant.

### Demo 3: Autonomous Auto-Healing on Memory Leak
```bash
npm run demo:memory
```
- **What to observe**: The agent identifies the unbounded cache array, transforms it into a bounded LRU ring buffer, and proves memory stability.

### Demo 4: Interactive Web Landing Page & Simulator
```bash
npm run dev
# Open http://localhost:5173 in browser
```
