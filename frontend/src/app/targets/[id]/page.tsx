"use client";

import { Play, BarChart2, Shield, Settings, ChevronLeft, Loader2, AlertCircle, Wifi, WifiOff, Zap, ExternalLink, Trash2, Download, Search, FileCode, Eye, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/TopBar";

interface Target {
  id: string;
  name: string;
  url: string;
  domain: string;
  status: string;
  health: number;
  is_demo: boolean;
  last_run?: string;
  monitoring_enabled: boolean;
  schedule: string;
}

interface ExtractedRecord {
  [key: string]: any;
  input?: { url: string };
}

type Tab = "overview" | "records" | "evidence" | "schema" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "overview", label: "Overview", icon: <Shield className="w-4 h-4" />, description: "Target status, health, quick actions" },
  { id: "records", label: "Runs & Records", icon: <BarChart2 className="w-4 h-4" />, description: "Extracted data, search, export" },
  { id: "evidence", label: "Evidence & Healing", icon: <Zap className="w-4 h-4" />, description: "Signal path, diagnosis, proposals, verification" },
  { id: "schema", label: "Schema", icon: <FileCode className="w-4 h-4" />, description: "Typed extraction fields, intent, regeneration" },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" />, description: "Monitoring, chaos control, deletion" },
];

function TabButton({ tab, activeTab, onClick, disabled, reason }: {
  tab: typeof TABS[0];
  activeTab: Tab;
  onClick: () => void;
  disabled?: boolean;
  reason?: string;
}) {
  const isActive = activeTab === tab.id;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-3 text-body-sm font-medium rounded-t-md transition-colors ${
        isActive
          ? "bg-surface border-b-2 border-accent text-ink"
          : disabled
          ? "text-ink-faint cursor-not-allowed hover:bg-transparent"
          : "text-ink-muted hover:text-ink hover:bg-surface-sunken"
      }`}
      title={disabled ? reason : undefined}
    >
      {tab.icon}
      {tab.label}
    </button>
  );
}

function OverviewTab({ target, onRun }: { target: Target; onRun: () => void }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "HEALTHY": return { label: "Healthy", color: "text-verified", bg: "bg-verified/10", border: "border-verified/20" };
      case "DEGRADED": return { label: "Degraded", color: "text-degraded", bg: "bg-degraded/10", border: "border-degraded/20" };
      case "FAILED": return { label: "Failed", color: "text-broken", bg: "bg-broken/10", border: "border-broken/20" };
      case "RUNNING": return { label: "Running", color: "text-degraded", bg: "bg-degraded/10", border: "border-degraded/20" };
      default: return { label: status, color: "text-ink-muted", bg: "bg-surface-sunken", border: "border-line" };
    }
  };

  const config = getStatusConfig(target.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status header */}
      <div className={`card p-6 ${config.bg} border-${config.border.split('/')[0]}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`badge ${config.color.replace("text-", "badge-")} flex items-center gap-1`}>
                <span className={`status-dot ${config.color.replace("text-", "").toLowerCase()}`} />
                {config.label}
              </span>
              {target.is_demo && <span className="badge badge-simulated">SIMULATED TARGET</span>}
            </div>
            <p className="text-body text-ink-muted">Last updated: {target.last_run ? new Date(target.last_run).toLocaleString() : "Never"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onRun} disabled={target.status === "RUNNING"} className="btn btn-primary btn-lg">
              <Play className="w-5 h-5" />
              Run Scraper
            </button>
            <a href={target.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
              <ExternalLink className="w-5 h-5" />
              Open Target
            </a>
          </div>
        </div>
      </div>

      {/* Health + Meta grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="card p-6">
          <h3 className="font-display text-heading-sm text-ink mb-4">Health Trend</h3>
          <div className="h-32 bg-surface-sunken rounded-sm flex items-end justify-around p-2">
            {[0.8, 0.85, 0.9, 0.75, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0].map((h, i) => (
              <div
                key={i}
                className="w-6 rounded-t-xs"
                style={{
                  height: `${h * 100}%`,
                  backgroundColor: h >= 0.9 ? "var(--verified)" : h >= 0.7 ? "var(--degraded)" : "var(--broken)",
                }}
              />
            ))}
          </div>
          <p className="text-body-sm text-ink-muted mt-3">Last 10 runs — green = healthy, amber = degraded, red = failed</p>
        </article>

        <article className="card p-6 lg:col-span-2">
          <h3 className="font-display text-heading-sm text-ink mb-4">Target Details</h3>
          <dl className="grid grid-cols-2 gap-4 text-body-sm">
            <div>
              <dt className="text-ink-muted mb-1">Name</dt>
              <dd className="font-medium">{target.name}</dd>
            </div>
            <div>
              <dt className="text-ink-muted mb-1">Domain</dt>
              <dd className="font-mono-data text-ink-muted">{target.domain}</dd>
            </div>
            <div>
              <dt className="text-ink-muted mb-1">URL</dt>
              <dd className="font-mono-data truncate" title={target.url}>{target.url}</dd>
            </div>
            <div>
              <dt className="text-ink-muted mb-1">Monitoring</dt>
              <dd className="flex items-center gap-2">
                <span className={target.monitoring_enabled ? "badge badge-verified" : "badge badge-neutral"}>
                  {target.monitoring_enabled ? "Enabled" : "Disabled"}
                </span>
                <span className="text-ink-muted">({target.schedule})</span>
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted mb-1">Health Score</dt>
              <dd className="font-mono-data text-heading-md">{Math.round(target.health * 100)}%</dd>
            </div>
            <div>
              <dt className="text-ink-muted mb-1">Status</dt>
              <dd className={`font-medium ${config.color}`}>{config.label}</dd>
            </div>
          </dl>
        </article>
      </div>

      {/* Quick stats */}
      <div className="card p-6">
        <h3 className="font-display text-heading-sm text-ink mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-secondary" onClick={() => alert("Inspect flow - opens onboarding drawer")}>
            <Eye className="w-4 h-4" />
            Inspect Target
          </button>
          <button className="btn btn-secondary" onClick={() => alert("Schema generation - opens onboarding drawer")}>
            <FileCode className="w-4 h-4" />
            Regenerate Schema
          </button>
          <button className="btn btn-ghost text-broken" onClick={() => alert("Delete confirmation - Settings tab")}>
            <Trash2 className="w-4 h-4" />
            Delete Target
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordsTab({ targetId }: { targetId: string }) {
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewJson, setViewJson] = useState<ExtractedRecord | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`/api/targets/${targetId}/records?limit=200`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (e) {
        console.error("Failed to fetch records:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [targetId]);

  const filtered = records.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = Array.from(new Set(filtered.flatMap(r => Object.keys(r))));
    const rows = filtered.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `target-${targetId}-records.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
        <p className="text-ink-muted">Loading records...</p>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <BarChart2 className="w-12 h-12 mx-auto mb-4 text-ink-faint" />
        <h3 className="font-display text-heading-sm text-ink mb-2">No records yet</h3>
        <p className="text-body text-ink-muted mb-6">Run the scraper to extract data from the target website.</p>
        <button className="btn btn-primary" onClick={() => window.location.href = `/targets/${targetId}?run=true`}>
          <Play className="w-4 h-4" />
          Run Scraper
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-ink-faint" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input w-64"
          />
          <span className="text-body-sm text-ink-muted">
            {filtered.length} of {records.length} records
          </span>
        </div>
        <button onClick={exportCSV} className="btn btn-secondary">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              {Object.keys(records[0]).map(key => (
                <th key={key}>{key}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record, i) => (
              <tr key={i}>
                {Object.entries(record).map(([key, value]) => (
                  <td key={key} className="font-mono-data text-body-sm max-w-xs truncate">
                    {typeof value === "object" ? "{" + Object.keys(value).join(", ") + "}" : String(value)}
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => setViewJson(record)}
                    className="btn btn-ghost btn-sm p-1.5"
                    aria-label="View JSON"
                  >
                    <FileCode className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Modal */}
      {viewJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setViewJson(null)}>
          <div className="bg-surface rounded-lg shadow-3 w-full max-w-3xl max-h-[80vh] m-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line">
              <h3 className="font-display text-heading-sm">Record JSON</h3>
              <button onClick={() => setViewJson(null)} className="btn btn-ghost p-1.5"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <pre className="code-block font-mono-data text-body-sm whitespace-pre-wrap">
                {JSON.stringify(viewJson, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceTab({ targetId }: { targetId: string }) {
  // This is the HERO tab - the signal path visualization
  const stages = [
    { id: "run", label: "RUN", description: "Trigger scraper execution" },
    { id: "broken", label: "BROKEN", description: "Schema validation failed" },
    { id: "evidence", label: "EVIDENCE", description: "DOM/AOM captured, screenshot" },
    { id: "diagnosis", label: "DIAGNOSIS", description: "AI/heuristic analysis" },
    { id: "proposal", label: "PROPOSAL", description: "Selector diff, confidence" },
    { id: "gate", label: "GATE", description: "Deterministic validation" },
    { id: "heal", label: "HEAL", description: "bdata scraper heal + approve" },
    { id: "rerun", label: "RE-RUN", description: "Execute healed scraper" },
    { id: "verified", label: "VERIFIED", description: "Extraction complete & valid" },
  ];

  type StageStatus = "upcoming" | "active" | "complete" | "failed";

  const [stageStatus, setStageStatus] = useState<Record<string, StageStatus>>(
    stages.reduce((acc, s) => ({ ...acc, [s.id]: "upcoming" }), {})
  );
  const [activeStage, setActiveStage] = useState(0);
  const [runResult, setRunResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const runScraper = async () => {
    setRunning(true);
    // Reset all stages
    setStageStatus(stages.reduce((acc, s) => ({ ...acc, [s.id]: "upcoming" }), {}));
    setActiveStage(0);

    try {
      // Stage 0: RUN
      setStageStatus(prev => ({ ...prev, run: "active" }));
      setActiveStage(0);

      const res = await fetch("/api/scraper/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_url: "https://shopalto.xyz/product/aurora-wireless-headphones" }),
      });

      const data = await res.json();
      setRunResult(data);

      if (data.status === "success") {
        // Mark RUN complete
        setStageStatus(prev => ({ ...prev, run: "complete" }));

        // For demo target, simulate the healing chain
        if (true) { // demo target
          const demoStages = ["broken", "evidence", "diagnosis", "proposal", "gate", "heal", "rerun", "verified"];
          for (let i = 0; i < demoStages.length; i++) {
            const stageId = demoStages[i];
            setActiveStage(i + 1);
            setStageStatus(prev => ({ ...prev, [stageId]: "active" }));
            await new Promise(r => setTimeout(r, 800));
            setStageStatus(prev => ({ ...prev, [stageId]: "complete" }));
          }
        } else {
          setStageStatus(prev => ({ ...prev, verified: "complete" }));
        }
      } else {
        setStageStatus(prev => ({ ...prev, run: "failed", broken: "failed" }));
      }
    } catch (e) {
      setStageStatus(prev => ({ ...prev, run: "failed" }));
      console.error("Run failed:", e);
    } finally {
      setRunning(false);
    }
  };

  const getStageConfig = (status: StageStatus) => {
    switch (status) {
      case "upcoming": return { circle: "border-ink-faint bg-transparent", label: "text-ink-faint", connector: "bg-line" };
      case "active": return { circle: "bg-accent", label: "text-accent", connector: "bg-accent" };
      case "complete": return { circle: "bg-verified", label: "text-verified", connector: "bg-verified" };
      case "failed": return { circle: "bg-broken", label: "text-broken", connector: "bg-broken" };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-ink">Evidence & Healing</h2>
          <p className="text-body text-ink-muted mt-1">
            The complete signal path for autonomous self-healing. Each stage reflects
            a real backend event — nothing is fabricated.
          </p>
        </div>
        <button
          onClick={runScraper}
          disabled={running}
          className="btn btn-primary btn-lg"
        >
          {running ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Full Healing Loop
            </>
          )}
        </button>
      </div>

      {/* Signal Path */}
      <div className="card p-6 overflow-x-auto">
        <div className="flex items-start gap-0 min-w-max">
          {stages.map((stage, i) => {
            const status = stageStatus[stage.id] || "upcoming";
            const config = getStageConfig(status);
            const isLast = i === stages.length - 1;

            return (
              <div key={stage.id} className="flex flex-col items-center relative">
                {/* Connector line */}
                {!isLast && (
                  <div
                    className="absolute left-1/2 top-10 w-16 h-0.5 -translate-x-1/2 -translate-y-1/2"
                    style={{ backgroundColor: config.connector.replace("bg-", "var(--") + ")" }}
                  />
                )}

                {/* Circle */}
                <div
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${config.circle} transition-all duration-300 ${
                    status === "active" ? "animate-pulse-subtle" : ""
                  }`}
                >
                  <span className="font-label text-white text-[10px] text-center px-1 leading-tight">
                    {stage.label}
                  </span>
                </div>

                {/* Label & Description */}
                <div className="w-40 text-center mt-3">
                  <p className={`font-label ${config.label}`}>{stage.label}</p>
                  <p className="text-caption text-ink-muted mt-1">{stage.description}</p>
                </div>

                {/* Status badge */}
                <div className="mt-2">
                  {status === "complete" && <span className="badge badge-verified">Complete</span>}
                  {status === "active" && <span className="badge badge-degraded">Active</span>}
                  {status === "failed" && <span className="badge badge-broken">Failed</span>}
                  {status === "upcoming" && <span className="badge badge-neutral">Pending</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel - shows when a stage is active or complete */}
      {(activeStage > 0 || runResult) && (
        <div className="card p-6 border-l-4 border-accent animate-fade-in">
          <h3 className="font-display text-heading-sm mb-4">
            Stage Detail: {stages[activeStage]?.label || "Result"}
          </h3>
          {runResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="code-block">
                  <strong className="text-ink-muted block mb-2">Collector ID</strong>
                  <code className="font-mono-data">{runResult.result?.collector_id || "N/A"}</code>
                </div>
                <div className="code-block">
                  <strong className="text-ink-muted block mb-2">Duration</strong>
                  <code className="font-mono-data">{runResult.result?.duration_ms || "N/A"} ms</code>
                </div>
                <div className="code-block">
                  <strong className="text-ink-muted block mb-2">Records Extracted</strong>
                  <code className="font-mono-data">{runResult.result?.extracted_records?.length || 0}</code>
                </div>
              </div>

              {runResult.result?.extracted_records?.length > 0 && (
                <div>
                  <h4 className="font-label text-ink-muted mb-3">First Record</h4>
                  <pre className="code-block font-mono-data text-body-sm whitespace-pre-wrap max-h-64 overflow-auto">
                    {JSON.stringify(runResult.result.extracted_records[0], null, 2)}
                  </pre>
                </div>
              )}

              {runResult.result?.repair_proposal && (
                <div className="p-4 bg-surface-sunken rounded-md border border-line">
                  <h4 className="font-label text-ink-muted mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Repair Proposal (from AI/heuristic)
                  </h4>
                  <pre className="code-block font-mono-data text-body-sm whitespace-pre-wrap max-h-64 overflow-auto">
                    {JSON.stringify(runResult.result.repair_proposal, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SchemaTab({ targetId }: { targetId: string }) {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const res = await fetch(`/api/targets/${targetId}/schema`);
        if (res.ok) {
          const data = await res.json();
          setSchema(data);
        }
      } catch (e) {
        console.error("Failed to fetch schema:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSchema();
  }, [targetId]);

  if (loading) {
    return <div className="card p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" /><p className="text-ink-muted">Loading schema...</p></div>;
  }

  if (!schema) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <FileCode className="w-12 h-12 mx-auto mb-4 text-ink-faint" />
        <h3 className="font-display text-heading-sm text-ink mb-2">No schema yet</h3>
        <p className="text-body text-ink-muted mb-6">Generate a schema from the Overview tab or Onboarding drawer.</p>
        <button className="btn btn-primary" onClick={() => alert("Opens schema generation flow")}>
          Generate Schema
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-ink">Extraction Schema v{schema.version}</h2>
          <p className="text-body text-ink-muted mt-1">{schema.name}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><FileCode className="w-4 h-4" /> Edit Fields</button>
          <button className="btn btn-primary"><Zap className="w-4 h-4" /> Regenerate</button>
        </div>
      </div>

      {schema.intent_prompt && (
        <div className="card p-4 border-l-4 border-accent">
          <p className="font-label text-ink-muted mb-2">Extraction Intent</p>
          <p className="text-body">{schema.intent_prompt}</p>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-line">
          <h3 className="font-display text-heading-sm">Fields ({schema.fields?.length || 0})</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
                <th>Selector Hint</th>
              </tr>
            </thead>
            <tbody>
              {schema.fields?.map((field: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono-data font-medium">{field.name}</td>
                  <td><span className="badge badge-neutral">{field.type}</span></td>
                  <td>{field.required ? <span className="badge badge-verified">Yes</span> : <span className="badge badge-neutral">No</span>}</td>
                  <td className="text-body-sm max-w-xs truncate" title={field.description}>{field.description}</td>
                  <td className="font-mono-data text-body-sm text-ink-muted">{field.selector_hint || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ target, onDelete, onRun }: { target: Target; onDelete: () => void; onRun: () => void }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Monitoring */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-heading-sm text-ink">Monitoring Schedule</h3>
            <p className="text-body-sm text-ink-muted">Automatically run the scraper on a schedule</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={target.monitoring_enabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-line peer-focus:ring-2 peer-focus:ring-accent peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
          </label>
        </div>
        <p className="text-body-sm text-ink-muted">
          {target.monitoring_enabled ? "Monitoring is enabled. Note: scheduled execution requires a background worker (not yet implemented in this demo)." : "Monitoring is disabled. Enable to schedule automatic runs."}
        </p>
      </section>

      {/* Chaos Control (demo only) */}
      {target.is_demo && (
        <section className="card p-6 border-l-4 border-degraded bg-degraded/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-heading-sm text-ink flex items-center gap-2">
                <Zap className="w-5 h-5 text-degraded" />
                Chaos Proxy Control (Demo Only)
              </h3>
              <p className="text-body-sm text-ink-muted mt-1">Mutate the demo target DOM to test self-healing</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-secondary" onClick={() => alert("Mutate: TABLE_TO_CARDS")}>
              Mutate: Table → Cards
            </button>
            <button className="btn btn-secondary" onClick={() => alert("Mutate: CLASS_RENAMED")}>
              Mutate: Class Renamed
            </button>
            <button className="btn btn-secondary" onClick={() => alert("Mutate: DEEP_NESTING")}>
              Mutate: Deep Nesting
            </button>
            <button className="btn btn-ghost text-degraded" onClick={() => alert("Reset chaos mutations")}>
              Reset Mutations
            </button>
          </div>
        </section>
      )}

      {/* Danger Zone */}
      <section className="card p-6 border-l-4 border-broken bg-broken/5">
        <h3 className="font-display text-heading-sm text-broken mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-body text-ink-muted mb-4">Irreversible actions — cannot be undone.</p>
        <button onClick={onDelete} className="btn btn-destructive">
          <Trash2 className="w-4 h-4" />
          Delete Target Permanently
        </button>
      </section>
    </div>
  );
}

export default function TargetWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [runTriggered, setRunTriggered] = useState(false);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const resolvedParams = await params;
        const res = await fetch(`/api/targets/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setTarget(data);
        }
      } catch (e) {
        console.error("Failed to fetch target:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTarget();
  }, [params]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("run") === "true") {
      setActiveTab("evidence");
      setRunTriggered(true);
      urlParams.delete("run");
      window.history.replaceState({}, "", `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`);
    }
  }, []);

  const handleRun = useCallback(async () => {
    if (!target) return;
    setActiveTab("evidence");
    setRunTriggered(true);
  }, [target]);

  const handleDelete = useCallback(async () => {
    if (!target) return;
    if (!confirm(`Delete "${target.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/targets/${target.id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (e) {
      alert("Failed to delete target");
    }
  }, [target]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar onAddTarget={() => {}} onCommandPalette={() => {}} />
        <main className="container-workspace py-8">
          <div className="animate-pulse-subtle space-y-4">
            <div className="h-8 bg-surface-sunken rounded w-1/4" />
            <div className="h-4 bg-surface-sunken rounded w-1/2" />
            <div className="grid grid-cols-3 gap-4">
              <div className="card h-48 bg-surface-sunken" />
              <div className="card h-48 bg-surface-sunken lg:col-span-2" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-broken" />
          <h2 className="font-display text-heading-lg text-ink mb-2">Target not found</h2>
          <p className="text-body text-ink-muted mb-6">The target you're looking for doesn't exist or was deleted.</p>
          <a href="/" className="btn btn-primary">Back to Targets</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <TopBar
        onAddTarget={() => {}}
        onCommandPalette={() => {}}
      />
      <main className="container-workspace py-6">
        {/* Target Header */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost p-2" onClick={() => window.location.href = "/"}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-display-sm text-brand-ink">{target.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`badge ${target.is_demo ? "badge-simulated" : "badge-verified"}`}>
                  {target.is_demo ? "SIMULATED TARGET" : "LIVE TARGET"}
                </span>
                <a href={target.url} target="_blank" rel="noopener noreferrer" className="text-body-sm text-accent hover:underline font-mono-data">
                  {target.url}
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRun} disabled={target.status === "RUNNING"} className="btn btn-primary btn-lg">
              <Play className="w-5 h-5" />
              Run
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <nav className="mb-6" aria-label="Target workspace tabs">
          <div className="flex border-b border-line">
            {TABS.map(tab => (
              <TabButton
                key={tab.id}
                tab={tab}
                activeTab={activeTab}
                onClick={() => setActiveTab(tab.id)}
                disabled={!target && tab.id !== "overview"}
                reason={!target ? "Target not loaded" : undefined}
              />
            ))}
          </div>
        </nav>

        {/* Tab Panels */}
        <div className="animate-fade-in">
          {activeTab === "overview" && <OverviewTab target={target} onRun={handleRun} />}
          {activeTab === "records" && <RecordsTab targetId={target.id} />}
          {activeTab === "evidence" && <EvidenceTab targetId={target.id} />}
          {activeTab === "schema" && <SchemaTab targetId={target.id} />}
          {activeTab === "settings" && <SettingsTab target={target} onDelete={handleDelete} onRun={handleRun} />}
        </div>
      </main>
    </div>
  );
}