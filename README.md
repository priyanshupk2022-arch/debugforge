# SENTINEL-CHAIN: Autonomous Cyber Threat Intelligence & Exposure Correlation Engine

<div align="center">

```
   _____ ______ _   _ _______ _____ _   _ ______ _      
  / ____|  ____| \ | |__   __|_   _| \ | |  ____| |     
 | (___ | |__  |  \| |  | |    | | |  \| | |__  | |     
  \___ \|  __| | . ` |  | |    | | | . ` |  __| | |     
  ____) | |____| |\  |  | |   _| |_| |\  | |____| |____ 
 |_____/|______|_| \_|  |_|  |_____|_| \_|______|______|
  AUTONOMOUS CYBER THREAT HARVESTER & EXPOSURE CORRELATION
```

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![Bright Data](https://img.shields.io/badge/Bright%20Data-Scraper%20Studio%20CLI-blue.svg)](https://brightdata.com/)
[![Gemini](https://img.shields.io/badge/AI%20Diagnoser-Gemini%20Flash-8E44AD.svg)](https://deepmind.google/technologies/gemini/)
[![Tests Passing](https://img.shields.io/badge/Tests-18%2F18%20Passed-brightgreen.svg)](https://github.com/)
[![Simulation Recovery](https://img.shields.io/badge/Simulation%20Recovery-100%25-brightgreen.svg)](https://github.com/)

**SENTINEL-CHAIN** is an **Autonomous Cyber Threat Intelligence Acquisition & Exposure Correlation Engine** built for the **Bright Data × WeMakeDevs "Into the Scrape-Verse" Hackathon 2026** and competing for the **Best Use of Bright Data (NVIDIA DGX Spark)** prize.

Instead of treating web scraping as a static data-collection script, Sentinel-Chain continuously correlates an enterprise's **internal software inventory/SBOM** with **fragmented public threat intelligence (Exploit-DB, vendor bulletins)** harvested via **Bright Data Scraper Studio**, while autonomously maintaining the acquisition layer when source structures change.

> **"The intelligence pipeline broke. The security signal didn't."**

</div>

---

## 🏛️ Core Product Architecture

```
┌────────────────────────────────────────────────────────┐
│ 1. INTERNAL ASSET CONTEXT (What do we have?)           │
│    • Monitored Asset Manifest / Software Inventory     │
│    • Assets: Apache HTTP Server 2.4.50, OpenSSL 3.0.7  │
└──────────────────────────┬─────────────────────────────┘
                           │ Triggers Targeted Queries
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. BRIGHT DATA SCRAPER STUDIO (What changed?)          │
│    • Collector ID: c_sentinel_cve_threats              │
│    • Harvests Exploit-DB advisories & zero-day PoCs    │
│    • Preserves exact source provenance & evidence      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. CORRELATION & EXPOSURE ENGINE (Does it matter?)     │
│    • Exact Component & Version Matching                │
│    • Priority Calculation: P0 / P1 / P2 / P3           │
│    • Outputs Actionable ExposureRecord                 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. RESILIENCE COCKPIT (Self-Healing Layer)             │
│    • Target layout changes -> Scraper fails            │
│    • Playwright AOM Harvest -> Gemini 3.7 Diagnosis    │
│    • Executes `bdata scraper heal` & `approve`         │
│    • Zero downtime intelligence flow restored          │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Architectural Innovations

### 1. 🔄 The Autonomous Self-Healing State Loop
```
   [1. RUN SCRAPER]
   (bdata scraper run c_sentinel_cve_threats)
          │
          ▼
   [2. INSPECT OUTPUT] ────▶ [HEALTHY: Correlate against Asset Manifest]
          │ (Empty / Error)
          ▼
   [3. FAILURE DETECTED]
          │
          ▼
   [4. EVIDENCE HARVESTING] ─── Playwright extracts Pruned DOM + AOM Tree + Screenshot
          │
          ▼
   [5. GEMINI AI DIAGNOSIS] ─── Gemini 3.7 Flash synthesizes root-cause & repair prompt
          │
          ▼
   [6. DETERMINISTIC GATE] ──── Strict confidence >= 0.8 & Shell Injection sanitizer
          │
          ▼
   [7. BRIGHT DATA HEAL] ────── Executes `bdata scraper heal <id> -- "<prompt>"`
          │
          ▼
   [8. AUTO-APPROVAL] ───────── Executes `bdata scraper approve <id>`
          │
          ▼
   [9. RE-RUN & VERIFY] ─────── Post-heal re-run extracts 100% records -> P0 Feed Restored!
```

### 2. 💥 Transparent Chaos Proxy (Zero-Faking Live Demonstration)
Sentinel-Chain includes a server-side **Controlled Failure Injection Mechanism** (`/api/proxy/target` & `/api/chaos/mutate`):
- **Clean Baseline**: Standard HTML table with `.cve-id` and `.cve-row` selectors.
- **Table-to-Cards Mutation**: Replaces HTML table layout with nested `<article class="exploit-card">` containers.
- **Controlled Demo**: Enables judges to watch the scraper break, diagnose, execute `bdata heal`, and recover without manual code edits.

### 3. 🛡️ Deterministic AI Safety & Sanitization
- **No Arbitrary Code Execution**: Gemini outputs strict Pydantic JSON schema (`RepairProposal`).
- **CLI Flag Delimiters**: Subprocess calls use `shell=False` with explicit `--` argument delimiters to prevent CLI flag injection.
- **Strict Provenance**: Missing CTI fields remain `unknown` rather than AI-hallucinated.

---

## 📊 Structured Output Evidence

### Evaluation & Golden Dataset Benchmarks
Benchmarked across our **100-case Golden Dataset** (`eval/golden_dataset.jsonl`) using the deterministic heuristic diagnoser:

| Test Suite | Total Cases | Simulation Success Rate | Defense Rate | Mean Latency (Local) |
| :--- | :---: | :---: | :---: | :---: |
| **Happy Path Tables** | 40 | **100.0%** (40/40) | N/A | ~1 ms |
| **Edge Case Redesigns** | 40 | **100.0%** (40/40) | N/A | ~1 ms |
| **Adversarial Injections** | 20 | N/A | **100.0%** (20/20 blocked) | <1 ms |
| **Overall Platform** | **100** | **100.0% (Simulated)** | **20/20 Blocked** | **<1 ms** |

### Downstream Structured Exposure Intelligence
Example structured output generated by our Bright Data Scraper Studio collector and correlated with internal SBOM assets is stored at [`data/example_structured_output.json`](data/example_structured_output.json):

```json
{
  "exposure_id": "exp-a9f8b2c1",
  "asset": {
    "asset_id": "srv-prod-web-01",
    "name": "Apache HTTP Server",
    "component": "httpd",
    "version": "2.4.50",
    "environment": "production",
    "criticality": "high"
  },
  "threat": {
    "cve_id": "CVE-2021-42013",
    "title": "Apache HTTP Server 2.4.50 Path Traversal & Remote Code Execution Exploit",
    "component": "httpd",
    "affected_versions": ["2.4.49", "2.4.50"],
    "severity": "critical",
    "exploit_status": "available",
    "source_name": "Exploit-DB"
  },
  "correlation_status": "AFFECTED",
  "match_type": "EXACT_VERSION",
  "priority": "P0",
  "why_affected": "Installed version '2.4.50' exactly matches affected versions in Exploit-DB (CVE-2021-42013).",
  "recommendation_action": "UPGRADE"
}
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+
- Bright Data CLI (`npx -p @brightdata/cli bdata`)

### 1. Clone & Configure Environment
```powershell
git clone https://github.com/priyanshupk2022-arch/SENTINEL-CHAIN.git
cd SENTINEL-CHAIN

# Copy environment variables
cp .env.example .env
```

### 2. Install Dependencies
```powershell
# Python environment (deps declared in backend/pyproject.toml)
python -m venv .venv
.venv\Scripts\activate
pip install fastapi "uvicorn[standard]" playwright httpx pydantic python-dotenv aiosqlite beautifulsoup4 requests pytest pytest-asyncio
playwright install chromium

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Launch Backend & Frontend Services
```powershell
# Terminal 1: Backend (FastAPI Server)
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend (Next.js Mission Control)
cd frontend
npm run dev
```

### 4. Open Mission Control in Browser
Navigate to **`http://localhost:3000`** to access the interactive Mission Control dashboard.

---

## 🧪 Running Automated Tests

```powershell
# Run backend test suite (18 test modules including correlation engine)
.venv\Scripts\python.exe -m pytest backend/tests -v

# Run 100-case Golden Dataset evaluation harness
.venv\Scripts\python.exe eval/evaluate.py
```

---

## 🤖 AI Assistant Disclosure (Hackathon Compliance)
In accordance with hackathon guidelines, AI tools used during development include:
- **Google Gemini 3.7 Flash**: Powers the real-time DOM diagnosis and repair synthesis engine.
- **Antigravity AI Agent**: Assisted with boilerplate generation, test suite scaffolding, and UI component styling.
All code architecture, correlation algorithms, and Bright Data CLI integrations were engineered, verified, and audited for zero hallucination.

---

## 🏛️ License & Hackathon Compliance
Built for the **WeMakeDevs × Bright Data "Into the Scrape-Verse" Hackathon 2026**. All integrations with Bright Data Scraper Studio CLI, Google Gemini AI, and Playwright comply with official hackathon terms and open-source standards.
