# SENTINEL-CHAIN: 11-Frame Cinematic Storyboard Specification

**Narrative Thesis:** The Web Breaks. The Threat Signal Doesn't.  
**Director:** Sentinel Creative Team & Motion Specialist  

---

```
[FRAME 01: SIGNAL] ────────► [FRAME 02: INTELLIGENCE] ────────► [FRAME 03: ASSETS]
       │                                                                │
       ▼                                                                ▼
[FRAME 04: EXPOSURE] ◄──────────────────────────────────────────────────┘
       │
       ▼
[FRAME 05: MUTATION] ──────► [FRAME 06: FAILURE] ────────► [FRAME 07: EVIDENCE]
                                                                │
                                                                ▼
[FRAME 11: RESTORED] ◄────── [FRAME 10: VERIFY] ◄──────── [FRAME 08: DIAGNOSIS & 09: HEAL]
```

---

## The 11-Frame Narrative Sequence

### 🎬 FRAME 01 — SIGNAL (Ambient Threat Space)
- **Atmosphere:** Deep obsidian background (`#07090E`) with subtle vector node lines.
- **Visual:** Unstructured public signals float into the field (CVE identifiers, Exploit-DB PoC references, zero-day advisories).
- **Audio/Motion:** Gentle 0.8s fade-in with subtle horizontal drift.

### 🎬 FRAME 02 — INTELLIGENCE (Structured Ingestion)
- **Visual:** The Bright Data Scraper Studio Collector (`c_sentinel_cve_threats`) harvests the raw HTML and normalizes it into canonical Threat Records.
- **Data Callout:** `CVE-2021-42013` (Apache Path Traversal & RCE), `CVE-2022-3602` (OpenSSL Punycode Buffer Overflow).

### 🎬 FRAME 03 — ASSET MATCH (Internal Manifest)
- **Visual:** Monitored internal infrastructure nodes materialize from the left:
  - `srv-prod-web-01`: Apache HTTP Server `v2.4.50` (Production / Tier 1)
  - `srv-prod-auth-02`: OpenSSL Library `v3.0.7` (Production / Tier 1)
  - `srv-edge-gw-01`: Nginx Ingress `v1.24.0` (DMZ / Tier 2)

### 🎬 FRAME 04 — EXPOSURE (Deterministic Correlation)
- **Visual:** A laser-sharp connection vector links `CVE-2021-42013` with `srv-prod-web-01`.
- **State Change:** Card illuminates in intense Rose alert border (`#F43F5E`).
- **Badge:** `P0 CRITICAL EXPOSURE — EXACT VERSION MATCH (2.4.50)`.
- **Remediation:** `UPGRADE TO 2.4.51`.

### 🎬 FRAME 05 — SOURCE MUTATION (Upstream Web Drift)
- **Visual:** The Exploit-DB webpage undergoes a real-world redesign. Standard `<table>` rows are transformed into nested `<div class="exploit-card">` containers.
- **State Change:** Amber warning pulse on the source node.

### 🎬 FRAME 06 — FAILURE (Extraction Drop)
- **Visual:** The legacy scraper selector fails against the new DOM. Extracted records count drops to `0`.
- **Alert:** `COLLECTOR BROKEN — 0 RECORDS EXTRACTED`. Pipeline stalls.

### 🎬 FRAME 07 — EVIDENCE (Multimodal Playwright Harvest)
- **Visual:** Sentinel automatically launches headless Playwright to inspect the mutated page.
- **Artifacts Harvested:** Pruned DOM tree, Accessibility Object Model (AOM), and layout bounding boxes.

### 🎬 FRAME 08 — DIAGNOSIS (Gemini 3.7 Synthesis)
- **Visual:** Gemini 3.7 Flash analyzes the DOM diff and identifies the layout shift:
  - *Diagnosis:* Table rows replaced with `.exploit-card` articles.
  - *Confidence:* `0.95`.
  - *Synthesized Fix:* `"Extract title from .exploit-card .title and versions from .badge"`.

### 🎬 FRAME 09 — HEALING (Bright Data Programmatic Repair)
- **Visual:** Sentinel calls the CLI runner:
  - `$ npx -p @brightdata/cli bdata scraper heal c_sentinel_cve_threats -- "Extract from div.exploit-card"`
- **Motion:** Rebuilding progress bar smoothly sweeps across the terminal card.

### 🎬 FRAME 10 — VERIFICATION (Approval & Health Gate)
- **Visual:** Sentinel executes automated verification:
  - `$ npx -p @brightdata/cli bdata scraper approve c_sentinel_cve_threats`
- **Output:** Test run parses 10/10 threat records with 100% field completeness.

### 🎬 FRAME 11 — SIGNAL RESTORED (Continuous Defense)
- **Visual:** The entire pipeline lights up in Emerald (`#10B981`).
- **Punchline:** *"The intelligence pipeline broke. The security signal didn't."*
- **Outcome:** The P0 alert remains active and actionable for the SOC team throughout the failure.
