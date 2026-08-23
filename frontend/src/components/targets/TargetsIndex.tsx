import React from "react";
import { Plus, Shield, RefreshCw, Activity, Database, Sparkles, Cpu } from "lucide-react";
import { TargetEntity } from "../../lib/api";
import { TargetCard } from "./TargetCard";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/skeleton";
import { ShinyText } from "../ui/ShinyText";
import { SpotlightCard } from "../ui/SpotlightCard";

interface TargetsIndexProps {
  targets: TargetEntity[];
  isLoading: boolean;
  onSelectTarget: (id: string) => void;
  onOpenNewTargetDrawer: () => void;
  onRefresh: () => void;
}

export function TargetsIndex({
  targets,
  isLoading,
  onSelectTarget,
  onOpenNewTargetDrawer,
  onRefresh,
}: TargetsIndexProps) {
  const healthyCount = targets.filter((t) => (t.health || 0) >= 0.8).length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
      {/* Hero / Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08] mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Autonomous Self-Healing Scraper Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Target <ShinyText text="Intelligence Registry" />
          </h1>
          <p className="text-sm text-neutral-400 mt-1.5 max-w-xl leading-relaxed">
            Continuous DOM mutation detection, Gemini 3.7 Flash AST repair synthesis, and deterministic verification proof.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.06] text-neutral-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewTargetDrawer}
            className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Target</span>
          </Button>
        </div>
      </div>

      {/* 4-Stat Holographic Metric Cards */}
      {!isLoading && targets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <SpotlightCard className="p-4.5" spotlightColor="rgba(99, 102, 241, 0.15)">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Total Targets
            </span>
            <div className="font-mono text-3xl font-bold text-white mt-1.5">
              {targets.length}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4.5" spotlightColor="rgba(16, 185, 129, 0.15)">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Healthy Nodes
            </span>
            <div className="font-mono text-3xl font-bold text-emerald-400 mt-1.5">
              {healthyCount}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4.5" spotlightColor="rgba(168, 85, 247, 0.15)">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Chaos Targets
            </span>
            <div className="font-mono text-3xl font-bold text-purple-400 mt-1.5">
              {targets.filter((t) => t.is_demo).length}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4.5" spotlightColor="rgba(56, 189, 248, 0.15)">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Active Scrapers
            </span>
            <div className="font-mono text-3xl font-bold text-cyan-400 mt-1.5">
              {targets.filter((t) => t.status === "RUNNING" || t.status === "HEALING" || t.status === "READY").length}
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* Bento Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 p-5 rounded-xl border border-white/[0.08] bg-[#0E131F] space-y-4"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : targets.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-6 h-6 text-indigo-400" />}
          title="No targets onboarded yet"
          description="Register your first website target to begin autonomous extraction, DOM structure inspection, and self-healing scraper monitoring."
          actionLabel="Onboard Target"
          onAction={onOpenNewTargetDrawer}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {targets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              onSelect={onSelectTarget}
            />
          ))}

          {/* Add Target Bento Tile */}
          <button
            onClick={onOpenNewTargetDrawer}
            className="flex flex-col items-center justify-center min-h-[190px] p-6 rounded-xl border-2 border-dashed border-white/[0.12] bg-[#0E131F]/40 hover:bg-[#0E131F]/80 hover:border-indigo-500 text-neutral-400 hover:text-indigo-400 transition-all duration-300 group cursor-pointer text-center backdrop-blur-xl"
          >
            <div className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/[0.1] group-hover:border-indigo-500 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center mb-3 shadow-lg transition-all duration-300">
              <Plus className="w-5 h-5" />
            </div>
            <div className="font-semibold text-sm text-white group-hover:text-indigo-400 transition-colors">
              Onboard New Target
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              DOM inspection & AI schema synthesis
            </div>
          </button>
        </div>
      )}
    </main>
  );
}
