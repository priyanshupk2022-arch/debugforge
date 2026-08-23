# SENTINEL-CHAIN: Autonomous Cyber Threat Intelligence & Self-Healing Architecture
**Date**: 2026-08-21  
**Project**: SENTINEL-CHAIN (Into the Scrape-Verse Hackathon)  
**Author**: Engineering Collective  

---

## 1. Executive Summary & Problem Framing
Traditional web scraping scripts break whenever upstream Document Object Models (DOM) undergo redesigns or class renaming. In critical domains like **Cyber Threat Intelligence (Exploit-DB / CVE Advisories)**, feeds lack unified public APIs, and manual scraper maintenance is unsustainable.

**SENTINEL-CHAIN** solves this by coupling **Bright Data Scraper Studio CLI (`@brightdata/cli`)** with an autonomous self-healing intelligence loop powered by **Gemini 3.7 Flash** and wrapped in a **Modern Floating Card Bento UI**.

---

## 2. Core Architectural Components

### 2.1 Bright Data Scraper Studio Integration
- **Collector ID**: `c_sentinel_cve_threats` (pre-configured for 5 critical fields: `cve_id`, `advisory_title`, `severity`, `affected_software`, `published_date`).
- **Execution CLI**: `npx -p @brightdata/cli bdata scraper run c_sentinel_cve_threats --json`.
- **Healing CLI**: `npx -p @brightdata/cli bdata scraper heal c_sentinel_cve_threats -- "<repair_prompt>"` followed by `bdata scraper approve c_sentinel_cve_threats`.

### 2.2 Backend Orchestrator (FastAPI + SQLite WAL)
- **Routes**:
  - `GET /api/health`: System status and environment health.
  - `GET /api/proxy/target`: Dual-target Chaos simulation target.
  - `POST /api/chaos/mutate`: 1-click mutation trigger (Table -> Cards).
  - `GET /api/threats`: Ingested CVE records from SQLite WAL.
  - `POST /api/scraper/trigger`: Executes CLI scraper cycle with autonomous recovery.

### 2.3 Deterministic Self-Healing Pipeline
1. **Trigger**: Scraper runs against mutated target and returns 0 records.
2. **Evidence Collection**: Playwright harvests pruned DOM and AOM tree.
3. **AI Diagnosis**: Gemini 3.7 Flash inspects DOM and crafts natural language repair instruction.
4. **Safety Gate**: Deterministic regex validation blocks shell injection risks.
5. **Execution**: Backend fires `bdata scraper heal` and `bdata scraper approve` in-place.
6. **Recovery**: Scraper re-runs and restores 100% data extraction.

### 2.4 Modern Floating Card Bento Frontend (Next.js 15)
- **Floating Dark Pill Sidebar**: Logo `F.`, Navigation icons (`Home`, `Terminal`, `Heal`, `Settings`).
- **Main Bento Card**:
  - **Greeting Header**: *"Hello Commander! Bright Data Scraper Studio is Online."* with hand-drawn vector art.
  - **Active Feed Status Pill**: *Exploit-DB Security Advisories* | `83%` Health | *Run Scraper*.
  - **Live Threat Feed Cards**: 5 clean horizontal cards with vendor icons (Apache, Linux, Cisco, Microsoft, OpenSSL), CVSS severity stars, timestamps, and *View Advisory* buttons.
  - **Right Column Analytics**: `11` Feeds completed, `4` Active collectors, Bezier curve weekly scraping chart, and *1-Click Self-Healing Cockpit* banner.
  - **Interactive Modals**: Real-time streaming CLI Terminal and before/after selector diff inspector.

---

## 3. Verification & Success Criteria
- [x] Backend FastAPI endpoints pass automated tests with `200 OK`.
- [x] Next.js 15 compiles with `0 errors`.
- [x] Live 1-click break & heal loop restores 100% data extraction.
- [x] UI matches the user's Figma reference pixel-for-pixel with authentic Cyber Threat Intelligence data.
