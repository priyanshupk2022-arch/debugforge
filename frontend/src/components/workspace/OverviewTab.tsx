import React from "react";
import { Play, ShieldAlert, Search, Activity, Clock, Globe, ArrowUpRight, Database, Cpu, Sparkles } from "lucide-react";
import { TargetEntity, InspectionResult, ExtractionSchema, HarvestRecord } from "../../lib/api";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { HealthTrend } from "../targets/HealthTrend";
import { SpotlightCard } from "../ui/SpotlightCard";
import { BorderBeam } from "../ui/BorderBeam";
import { ShinyText } from "../ui/ShinyText";

interface OverviewTabProps {
  target: TargetEntity;
  inspection: InspectionResult | null;
  schema: ExtractionSchema | null;
  records: HarvestRecord[];
  onTriggerRun: () => void;
  onSimulateChaos: () => void;
  onInspect: () => void;
  onSelectTab: (tabKey: string) => void;
  isRunning?: boolean;
}

export function OverviewTab({
  target,
  inspection,
  schema,
  records,
  onTriggerRun,
  onSimulateChaos,
  onInspect,
  onSelectTab,
  isRunning = false,
}: OverviewTabProps) {
  const formattedDate = target.updated_at
    ? new Date(target.updated_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never run";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Actions */}
      <SpotlightCard className="p-6 relative overflow-hidden" spotlightColor="rgba(99, 102, 241, 0.2)">
        <BorderBeam size={220} duration={12} colorFrom="#6366F1" colorTo="#38BDF8" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                Target Profile
              </span>
              {target.is_demo && <Badge variant="simulated">Simulation Node</Badge>}
              <Badge
                variant={
                  target.status === "READY"
                    ? "verified"
                    : target.status === "BROKEN"
                    ? "broken"
                    : target.status === "HEALING" || target.status === "DEGRADED"
                    ? "degraded"
                    : "information"
                }
                dot
              >
                {target.status}
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {target.name}
            </h2>

            <a
              href={target.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono mt-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{target.url}</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onInspect}
              className="border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-neutral-200"
            >
              <Search className="w-4 h-4" />
              <span>Re-Inspect DOM</span>
            </Button>

            {target.is_demo && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSimulateChaos}
                className="text-rose-400 border-rose-500/30 hover:bg-rose-950/30 hover:border-rose-500/60"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Simulate Break</span>
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onTriggerRun}
              disabled={isRunning}
              className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border-0"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? "Scraping..." : "Trigger Run"}</span>
            </Button>
          </div>
        </div>
      </SpotlightCard>

      {/* 3-Column Metrics Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Health Metric */}
        <SpotlightCard className="p-5 flex flex-col justify-between" spotlightColor="rgba(16, 185, 129, 0.15)">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono uppercase mb-2">
              <span>Health Score</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono text-3xl font-bold text-emerald-400">
              {Math.round((target.health || 1.0) * 100)}%
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Autonomous selector reliability rate
            </p>
          </div>
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-mono">Recent trend</span>
            <HealthTrend health={target.health || 1.0} />
          </div>
        </SpotlightCard>

        {/* Records Harvested */}
        <SpotlightCard className="p-5 flex flex-col justify-between" spotlightColor="rgba(99, 102, 241, 0.15)">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono uppercase mb-2">
              <span>Records Harvested</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              {records.length}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Persisted in SQLite WAL storage
            </p>
          </div>
          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => onSelectTab("records")}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View Data Grid</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </SpotlightCard>

        {/* Schema Status */}
        <SpotlightCard className="p-5 flex flex-col justify-between" spotlightColor="rgba(168, 85, 247, 0.15)">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono uppercase mb-2">
              <span>Extraction Schema</span>
              <span className="text-xs font-mono text-purple-400">
                v{schema?.version || 1}
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              {schema?.fields.length || 0}{" "}
              <span className="text-sm font-normal text-neutral-400">fields</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 truncate">
              {schema?.intent_prompt || "Configured via Playwright & Gemini"}
            </p>
          </div>
          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => onSelectTab("schema")}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>Edit Field Selectors</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </SpotlightCard>
      </div>

      {/* Target Details Grid */}
      <SpotlightCard className="p-6 space-y-4" spotlightColor="rgba(56, 189, 248, 0.15)">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Target Diagnostic Snapshot</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
            <div className="text-neutral-400 font-mono uppercase text-[10px]">Detected Page Type</div>
            <div className="font-medium text-white">{inspection?.page_type || "Advisory / Threat Catalog"}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
            <div className="text-neutral-400 font-mono uppercase text-[10px]">DOM Elements Indexed</div>
            <div className="font-mono text-white">{inspection?.detected_fields?.length || 5} candidate fields</div>
          </div>

          <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
            <div className="text-neutral-400 font-mono uppercase text-[10px]">Last Scrape Run</div>
            <div className="font-mono text-white">{formattedDate}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
            <div className="text-neutral-400 font-mono uppercase text-[10px]">Self-Healing Engine</div>
            <div className="font-medium text-emerald-400">Gemini 3.7 Flash + Deterministic Gate</div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
