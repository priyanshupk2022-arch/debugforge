import React, { useState, useEffect } from "react";
import { Play, ShieldAlert, Sparkles, RefreshCw, Terminal, Activity, Zap } from "lucide-react";
import { TargetEntity, ScraperTriggerResponse, RepairProposal } from "../../lib/api";
import { useTelemetryStream } from "../../hooks/useTelemetryStream";
import { SignalPath, SIGNAL_NODES } from "./SignalPath";
import { NodeState } from "./EvidenceNode";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { ProposalPanel } from "./ProposalPanel";
import { SelectorDiff } from "./SelectorDiff";
import { GateResult } from "./GateResult";
import { VerificationResult } from "./VerificationResult";
import { TelemetryTimeline } from "./TelemetryTimeline";
import { ElapsedTimer } from "./ElapsedTimer";
import { ConnectionBanner } from "../navigation/ConnectionBanner";
import { Button } from "../ui/button";
import { SpotlightCard } from "../ui/SpotlightCard";
import { ShinyText } from "../ui/ShinyText";
import { BorderBeam } from "../ui/BorderBeam";

interface EvidenceHealingTabProps {
  target: TargetEntity;
  latestRun: ScraperTriggerResponse | null;
  onTriggerRun: () => Promise<any>;
  onSimulateChaos: () => Promise<any>;
  isRunning?: boolean;
}

export function EvidenceHealingTab({
  target,
  latestRun,
  onTriggerRun,
  onSimulateChaos,
  isRunning = false,
}: EvidenceHealingTabProps) {
  const { events, latestEvent, connectionState, nodeStates: sseNodeStates, clearEvents, reconnect } =
    useTelemetryStream(latestRun?.run_id);

  const [selectedNodeId, setSelectedNodeId] = useState<string>("VERIFIED");

  const computedNodeStates: Record<string, NodeState> = {
    RUN: "PASS",
    BROKEN: latestRun?.status === "HEALED" ? "PASS" : "UPCOMING",
    EVIDENCE: latestRun?.status === "HEALED" ? "PASS" : "UPCOMING",
    DIAGNOSIS: latestRun?.status === "HEALED" ? "PASS" : "UPCOMING",
    PROPOSAL: latestRun?.status === "HEALED" ? "PASS" : "UPCOMING",
    GATE: latestRun?.status === "HEALED" ? "PASS" : "UPCOMING",
    HEAL: latestRun?.status === "HEALED" ? "PASS" : "UPCOMING",
    RE_RUN: latestRun?.status === "HEALED" ? "PASS" : "UPCOMING",
    VERIFIED: latestRun?.status === "HEALED" || latestRun?.status === "SUCCESS" ? "PASS" : "UPCOMING",
    ...sseNodeStates,
  };

  const proposal: RepairProposal | undefined =
    latestRun?.repair_proposal ||
    (latestEvent?.payload?.repair_proposal as RepairProposal) ||
    undefined;

  const lastConfirmedStage =
    latestEvent?.node_id ||
    (latestRun?.status === "HEALED" ? "VERIFIED" : "IDLE");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner for SSE status if offline */}
      <ConnectionBanner state={connectionState} onReconnect={reconnect} />

      {/* Hero Header Controls */}
      <SpotlightCard className="p-6 relative overflow-hidden" spotlightColor="rgba(99, 102, 241, 0.2)">
        <BorderBeam size={250} duration={10} colorFrom="#6366F1" colorTo="#10B981" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-xs font-mono text-indigo-400 uppercase font-semibold tracking-wider mb-2 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Evidence & Recovery Chain</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Autonomous <ShinyText text="Self-Healing Pipeline" />
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
              Real-time telemetry trace of selector degradation detection, Gemini AST diagnosis, deterministic gating, and recovery verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ElapsedTimer
              lastConfirmedStage={lastConfirmedStage}
              isRunning={isRunning}
            />

            {target.is_demo && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSimulateChaos}
                className="text-rose-400 border-rose-500/30 hover:bg-rose-950/30 hover:border-rose-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
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
              <span>{isRunning ? "Running Scraper..." : "Execute & Verify"}</span>
            </Button>
          </div>
        </div>
      </SpotlightCard>

      {/* 9-Node Signal Path DAG */}
      <SignalPath
        nodeStates={computedNodeStates}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />

      {/* Interactive Detail Inspector for Selected Node */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Step Details: {selectedNodeId}</span>
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            Click any node in the signal path above to inspect step evidence
          </span>
        </div>

        {selectedNodeId === "DIAGNOSIS" && (
          <DiagnosisPanel proposal={proposal} />
        )}

        {selectedNodeId === "PROPOSAL" && (
          <ProposalPanel proposal={proposal} />
        )}

        {(selectedNodeId === "BROKEN" || selectedNodeId === "HEAL") && (
          <SelectorDiff proposal={proposal} />
        )}

        {selectedNodeId === "GATE" && (
          <GateResult proposal={proposal} passed={true} />
        )}

        {(selectedNodeId === "VERIFIED" || selectedNodeId === "RUN" || selectedNodeId === "RE_RUN") && (
          <VerificationResult latestRun={latestRun} recovered={latestRun?.recovered ?? true} />
        )}

        {selectedNodeId === "EVIDENCE" && (
          <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0E131F] space-y-3">
            <h4 className="font-semibold text-sm text-white">
              DOM Mutation Evidence Package
            </h4>
            <div className="p-4 rounded-lg bg-black/60 border border-white/[0.08] font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
              {JSON.stringify(
                proposal?.evidence || {
                  failure_type: "DOM_TREE_MUTATION",
                  broken_selector: proposal?.broken_selector || "table.cve-grid td.title a",
                  matched_elements_count: 0,
                  dom_snippet: "<div class='advisory-row'><span class='advisory-title'><a href='...'>",
                },
                null,
                2
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real Live Telemetry Event Stream Timeline */}
      <TelemetryTimeline events={events} />
    </div>
  );
}
