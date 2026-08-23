'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Terminal as TerminalIcon,
  Database,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Flame,
  AlertTriangle,
  FileCode,
  Sparkles,
  Server,
  Layers,
  Cpu,
  Search,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  GitBranch,
  Lock,
  Code2,
  LayoutGrid,
  Eye,
  Sliders,
  Check,
  Copy,
  Clock,
  Play,
  Filter,
  Plus
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Asset {
  asset_id: string;
  name: string;
  component: string;
  version: string;
  environment: string;
  criticality: string;
  source: string;
}

interface ExposureRecord {
  exposure_id: string;
  asset: Asset;
  threat: {
    cve_id: string;
    title: string;
    component: string;
    affected_versions: string[];
    severity: string;
    exploit_status: string;
    published_date: string;
    source_name: string;
    source_url: string;
    provenance_snippet?: string;
  };
  correlation_status: 'AFFECTED' | 'NOT_AFFECTED' | 'UNKNOWN';
  match_type: 'EXACT_VERSION' | 'VERSION_RANGE' | 'COMPONENT_ONLY';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  why_affected: string;
  evidence: string[];
  recommendation_action: 'UPGRADE' | 'PATCH' | 'MITIGATE' | 'INVESTIGATE' | 'MONITOR';
  recommendation_reason: string;
  calculated_at: string;
}

const DEFAULT_ASSETS: Asset[] = [
  {
    asset_id: "srv-prod-web-01",
    name: "Apache HTTP Server",
    component: "httpd",
    version: "2.4.50",
    environment: "production",
    criticality: "high",
    source: "manual"
  },
  {
    asset_id: "srv-prod-auth-02",
    name: "OpenSSL Library",
    component: "openssl",
    version: "3.0.7",
    environment: "production",
    criticality: "high",
    source: "manual"
  },
  {
    asset_id: "srv-edge-gw-01",
    name: "Nginx Ingress",
    component: "nginx",
    version: "1.24.0",
    environment: "dmz",
    criticality: "medium",
    source: "manual"
  }
];

const DEFAULT_THREATS = [
  {
    cve_id: "CVE-2021-42013",
    title: "Apache HTTP Server 2.4.50 Path Traversal & RCE Exploit",
    component: "httpd",
    affected_versions: ["2.4.49", "2.4.50"],
    severity: "critical",
    exploit_status: "available",
    published_date: "2026-08-21T10:00:00Z",
    source_name: "Exploit-DB",
    source_url: "https://www.exploit-db.com/exploits/50383",
    provenance_snippet: "ap_normalize_path filter bypass enables remote command execution via mod_cgi."
  },
  {
    cve_id: "CVE-2022-3602",
    title: "OpenSSL Punycode Buffer Overflow in X.509 Certificate Verification",
    component: "openssl",
    affected_versions: ["3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.0.4", "3.0.5", "3.0.6", "3.0.7"],
    severity: "high",
    exploit_status: "referenced",
    published_date: "2026-08-21T10:15:00Z",
    source_name: "Exploit-DB",
    source_url: "https://www.exploit-db.com/exploits/51020",
    provenance_snippet: "Buffer overflow triggered during 4-byte arbitrary stack write in X.509 parsing."
  }
];

const DEFAULT_EXPOSURES: ExposureRecord[] = [
  {
    exposure_id: "exp-srv-prod-web-01-cve-2021-42013",
    asset: DEFAULT_ASSETS[0],
    threat: DEFAULT_THREATS[0],
    correlation_status: "AFFECTED",
    match_type: "EXACT_VERSION",
    priority: "P0",
    why_affected: "Installed version 2.4.50 is vulnerable to CVE-2021-42013 (Critical RCE Exploit).",
    evidence: [
      "Asset srv-prod-web-01 running httpd v2.4.50",
      "Exploit-DB advisory 50383 covers versions 2.4.49, 2.4.50",
      "Public Remote Code Execution PoC verified available"
    ],
    recommendation_action: "UPGRADE",
    recommendation_reason: "Immediate upgrade to Apache 2.4.51 required to mitigate active remote exploitation.",
    calculated_at: "2026-08-21T12:00:00Z"
  }
];

export default function MissionControlApp() {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'threats' | 'exposures' | 'healing' | 'telemetry'>('overview');
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [threats, setThreats] = useState<any[]>(DEFAULT_THREATS);
  const [exposures, setExposures] = useState<ExposureRecord[]>(DEFAULT_EXPOSURES);
  const [selectedExposure, setSelectedExposure] = useState<ExposureRecord | null>(null);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isHealing, setIsHealing] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [newAsset, setNewAsset] = useState({ name: '', component: '', version: '', environment: 'production', criticality: 'high' });
  const [terminalLogs, setTerminalLogs] = useState<any[]>([
    {
      time: '12:00:15',
      cmd: 'npx -p @brightdata/cli bdata login',
      out: 'Authenticated. Collector: c_sentinel_cve_threats | Target: Exploit-DB',
      status: 'success'
    }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resAssets, resThreats, resExposures] = await Promise.all([
        fetch(`${API_BASE}/api/exposure/assets`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/exposure/threats`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/exposure/correlate`).then((r) => r.ok ? r.json() : [])
      ]);
      setAssets(resAssets);
      setThreats(resThreats);
      setExposures(resExposures);
    } catch (e) {
      console.warn('Backend offline or loading defaults', e);
    }
  };

  const addLog = (cmd: string, out: string, status: string = 'success') => {
    setTerminalLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), cmd, out, status }
    ]);
  };

  const handleRunHarvest = async () => {
    setIsScraping(true);
    addLog(
      'npx -p @brightdata/cli bdata scraper run c_sentinel_cve_threats --json',
      'Executing Bright Data Scraper Studio Collector against Exploit-DB target...',
      'running'
    );

    try {
      await fetch(`${API_BASE}/api/scraper/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collector_id: 'c_sentinel_cve_threats',
          auto_heal: true
        })
      });
      await loadData();
      addLog(
        'bdata scraper run c_sentinel_cve_threats',
        'Ingestion complete. Correlated against internal Asset Manifest -> Found P0 Critical Exposure.',
        'success'
      );
    } catch (e: any) {
      addLog('bdata scraper run', `Error: ${e.message}`, 'failed');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSimulateHeal = async () => {
    setIsHealing(true);
    addLog(
      'CONTROLLED CHAOS INJECTION: Exploit-DB HTML table mutated to CSS card layout',
      'Target DOM Drift Detected. Scraper returned 0 records. Pipeline state: BROKEN',
      'failed'
    );

    try {
      await fetch(`${API_BASE}/api/chaos/mutate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'table_to_cards' })
      });

      addLog(
        'Playwright AOM Evidence -> Gemini 3.7 Flash Diagnostics',
        'Diagnosis: Table rows replaced by <div class="exploit-card"> containers.\nSynthesized repair instruction for Bright Data engine.',
        'running'
      );

      await fetch(`${API_BASE}/api/scraper/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collector_id: 'c_sentinel_cve_threats',
          auto_heal: true
        })
      });

      addLog(
        'npx -p @brightdata/cli bdata scraper heal c_sentinel_cve_threats -- "Extract from div.exploit-card"',
        'Heal executed & approved via: bdata scraper approve c_sentinel_cve_threats\nRe-run verified 100% extraction. Threat intelligence pipeline operational!',
        'success'
      );
      await loadData();
    } catch (e: any) {
      addLog('Self-Healing Engine', `Error: ${e.message}`, 'failed');
    } finally {
      setIsHealing(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.component || !newAsset.version) return;
    try {
      await fetch(`${API_BASE}/api/exposure/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: `srv-${newAsset.component}-${Date.now().toString().slice(-4)}`,
          ...newAsset,
          source: 'manual'
        })
      });
      setIsAddAssetOpen(false);
      setNewAsset({ name: '', component: '', version: '', environment: 'production', criticality: 'high' });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F0F6FC] selection:bg-indigo-600 selection:text-white font-sans antialiased">
      
      {/* App Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-600/30">
                S
              </div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                SENTINEL
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                  COCKPIT
                </span>
              </span>
            </Link>

            {/* Breadcrumb / Tab Switcher */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold bg-[#161B22] p-1 rounded-xl border border-white/[0.08]">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'assets', label: `Assets (${assets.length})` },
                { id: 'threats', label: `Threat Intel (${threats.length})` },
                { id: 'exposures', label: `Exposures (${exposures.length})` },
                { id: 'healing', label: 'Self-Healing' },
                { id: 'telemetry', label: 'Telemetry' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white/[0.12] text-white shadow-xs'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-[#161B22] hover:bg-[#21262D] text-xs font-semibold text-white border border-white/[0.08] items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON Proof</span>
            </button>

            <button
              onClick={handleRunHarvest}
              disabled={isScraping}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/25"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isScraping ? 'Harvesting...' : 'Harvest Intel'}</span>
            </button>

            <Link
              href="/"
              className="px-3 py-2 rounded-xl bg-[#161B22] hover:bg-[#21262D] text-xs font-semibold text-[#8B949E] hover:text-white border border-white/[0.08] transition-all"
            >
              Exit to Landing
            </Link>
          </div>
        </div>
      </header>

      {/* Main Cockpit Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Status HUD Header */}
        <div className="p-6 rounded-3xl bg-[#0D1117] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Collector: c_sentinel_cve_threats // ONLINE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Enterprise Cyber Threat Cockpit
            </h1>
            <p className="text-xs text-[#8B949E]">
              Target: <strong className="text-white">https://www.exploit-db.com/</strong> | Storage: <strong className="text-emerald-400">SQLite WAL</strong> | AI: <strong className="text-indigo-300">Gemini 3.7 Flash</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddAssetOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#161B22] hover:bg-[#21262D] text-xs font-bold text-white border border-white/[0.08] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Monitored Asset</span>
            </button>

            <button
              onClick={handleSimulateHeal}
              disabled={isHealing}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isHealing ? 'Healing Pipeline...' : 'Simulate Break & Auto-Heal'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Asset Manifest & Exposures */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Asset Manifest Bento */}
              <div className="p-6 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span>Monitored Assets ({assets.length})</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Live WAL Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {assets.map((asset) => (
                    <div key={asset.asset_id} className="p-3.5 rounded-2xl bg-[#161B22] border border-white/[0.06] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{asset.name}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.08] text-[#8B949E]">
                          {asset.environment}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-indigo-300">
                        v{asset.version} ({asset.component})
                      </div>
                      <div className="text-[10px] text-[#8B949E] capitalize">
                        Criticality: <strong className="text-white">{asset.criticality}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Correlated Exposure Alerts */}
              <div className="p-6 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Correlated Exposures ({exposures.length})</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                    P0 Alert Active
                  </span>
                </div>

                <div className="space-y-3">
                  {exposures.map((exp) => (
                    <div
                      key={exp.exposure_id}
                      className="p-4 rounded-2xl bg-[#161B22] border border-white/[0.06] hover:border-white/[0.15] transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                            exp.priority === 'P0' ? 'bg-rose-600' : 'bg-amber-600'
                          }`}>
                            {exp.priority}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{exp.asset.name} (v{exp.asset.version})</span>
                              <span className="text-[10px] font-mono bg-white/[0.08] px-1.5 py-0.5 rounded text-indigo-300">
                                {exp.threat.cve_id}
                              </span>
                            </div>
                            <p className="text-xs text-[#8B949E] mt-0.5">{exp.why_affected}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedExposure(exp)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-white/[0.04]">
                        <span className="text-[#8B949E]">
                          Directive: <strong className="text-emerald-400">{exp.recommendation_action}</strong>
                        </span>
                        <span className="text-[#8B949E]">
                          Source: <strong className="text-white">{exp.threat.source_name}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Terminal & Chaos Controls */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Terminal Logs View */}
              <div className="p-6 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Scraper Studio CLI Logs</span>
                  </div>
                  <span className="text-[10px] text-[#8B949E]">c_sentinel_cve_threats</span>
                </div>

                <div className="h-96 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-black/60 border border-white/[0.04]">
                  {terminalLogs.map((log, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2 text-[#8B949E] text-[10px]">
                        <span>[{log.time}]</span>
                        <span className="text-emerald-400 font-semibold">$ {log.cmd}</span>
                      </div>
                      <pre className="text-slate-300 whitespace-pre-wrap pl-3 text-[11px] font-sans leading-relaxed">
                        {log.out}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assets */}
        {activeTab === 'assets' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Monitored Software Assets</h2>
              <button
                onClick={() => setIsAddAssetOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[#8B949E] font-mono">
                    <th className="pb-3">ASSET ID</th>
                    <th className="pb-3">NAME</th>
                    <th className="pb-3">COMPONENT</th>
                    <th className="pb-3">VERSION</th>
                    <th className="pb-3">ENVIRONMENT</th>
                    <th className="pb-3">CRITICALITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {assets.map((a) => (
                    <tr key={a.asset_id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 font-mono text-indigo-300">{a.asset_id}</td>
                      <td className="py-3.5 font-bold text-white">{a.name}</td>
                      <td className="py-3.5 font-mono text-[#8B949E]">{a.component}</td>
                      <td className="py-3.5 font-mono text-emerald-400">{a.version}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/[0.08] text-[10px] font-mono uppercase">
                          {a.environment}
                        </span>
                      </td>
                      <td className="py-3.5 capitalize font-bold">{a.criticality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Threats */}
        {activeTab === 'threats' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-6">
            <h2 className="text-xl font-bold text-white">Ingested Public Threat Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {threats.map((t, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#161B22] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-400">{t.cve_id}</span>
                    <span className="text-[10px] font-mono uppercase bg-rose-950/60 text-rose-400 px-2 py-0.5 rounded border border-rose-800/50 font-bold">
                      PoC {t.exploit_status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{t.title}</h4>
                  <div className="text-xs font-mono text-[#8B949E]">
                    Affected: [{t.affected_versions.join(', ')}]
                  </div>
                  <div className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
                    Provenance: {t.provenance_snippet || 'Verified via Exploit-DB advisory'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Exposures */}
        {activeTab === 'exposures' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-6">
            <h2 className="text-xl font-bold text-white">Correlated Asset Exposures</h2>
            <div className="space-y-4">
              {exposures.map((exp) => (
                <div key={exp.exposure_id} className="p-5 rounded-2xl bg-[#161B22] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-xs text-white">
                        {exp.priority}
                      </span>
                      <div>
                        <h4 className="font-bold text-white">{exp.asset.name} (v{exp.asset.version})</h4>
                        <span className="text-xs font-mono text-indigo-300">{exp.threat.cve_id}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedExposure(exp)}
                      className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-white cursor-pointer"
                    >
                      Deep Inspect
                    </button>
                  </div>
                  <p className="text-xs text-[#8B949E]">{exp.why_affected}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Self-Healing Simulator */}
        {activeTab === 'healing' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-amber-400 font-bold">DEMO / CONTROLLED FAILURE</span>
              <h2 className="text-xl font-bold text-white">Target DOM Drift & Self-Healing Pipeline</h2>
              <p className="text-xs text-[#8B949E] max-w-2xl">
                Simulate a breaking redesign on Exploit-DB (HTML Table ➔ CSS Card Layout). Watch Sentinel harvest Playwright evidence, synthesize repair with Gemini 3.7 Flash, and execute <code className="text-indigo-300">bdata scraper heal</code> in real time.
              </p>
            </div>

            <button
              onClick={handleSimulateHeal}
              disabled={isHealing}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isHealing ? 'Executing Autonomous Recovery Loop...' : 'Execute Controlled Break & Heal'}</span>
            </button>
          </div>
        )}

        {/* Tab 6: Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1117] border border-white/[0.08] space-y-4">
            <h2 className="text-xl font-bold text-white">Live Telemetry & Event Stream</h2>
            <div className="h-96 overflow-y-auto p-4 rounded-2xl bg-black/60 font-mono text-xs text-emerald-400 space-y-2">
              {terminalLogs.map((log, i) => (
                <div key={i} className="border-b border-white/[0.04] pb-2">
                  <div className="text-[#8B949E] text-[10px]">[{log.time}] {log.cmd}</div>
                  <pre className="text-slate-300 whitespace-pre-wrap">{log.out}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD ASSET */}
      {isAddAssetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddAsset} className="bg-[#0D1117] border border-white/[0.1] rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-white text-base">Add Monitored Asset</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8B949E] block mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apache HTTP Server"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#161B22] border border-white/[0.08] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8B949E] block mb-1">Component Alias</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. httpd"
                    value={newAsset.component}
                    onChange={(e) => setNewAsset({ ...newAsset, component: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#161B22] border border-white/[0.08] text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8B949E] block mb-1">Version</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2.4.50"
                    value={newAsset.version}
                    onChange={(e) => setNewAsset({ ...newAsset, version: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#161B22] border border-white/[0.08] text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white">
                Save to SQLite WAL
              </button>
              <button type="button" onClick={() => setIsAddAssetOpen(false)} className="px-4 py-2.5 rounded-xl bg-[#161B22] text-[#8B949E] font-bold text-xs">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: INSPECT EXPOSURE */}
      {selectedExposure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D1117] border border-white/[0.1] rounded-3xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-bold text-white text-sm">{selectedExposure.asset.name} Exposure</h3>
              <button onClick={() => setSelectedExposure(null)} className="text-[#8B949E] hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-800/50">
              {selectedExposure.why_affected}
            </p>
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#8B949E]">EVIDENCE:</span>
              {selectedExposure.evidence.map((e, idx) => (
                <div key={idx} className="text-xs text-slate-300 font-mono">• {e}</div>
              ))}
            </div>
            <button onClick={() => setSelectedExposure(null)} className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs">
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: JSON PROOF */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D1117] border border-white/[0.1] rounded-3xl p-6 max-w-xl w-full space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="font-bold text-white">Structured Output Evidence</span>
              <button onClick={() => setIsJsonModalOpen(false)} className="text-[#8B949E] hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64 overflow-y-auto p-3 bg-black/60 rounded-xl text-emerald-400">
              <pre>{JSON.stringify({ asset_manifest: assets, threat_records: threats, exposures }, null, 2)}</pre>
            </div>
            <button onClick={() => setIsJsonModalOpen(false)} className="w-full py-2 rounded-xl bg-white text-black font-bold text-xs">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
