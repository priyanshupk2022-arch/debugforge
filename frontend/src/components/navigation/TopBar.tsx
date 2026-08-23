import React, { useState } from "react";
import { Shield, Search, Plus, Terminal, Activity, Zap } from "lucide-react";
import { LiveStatusChip } from "./LiveStatusChip";
import { TargetSwitcher } from "./TargetSwitcher";
import { CommandPalette } from "./CommandPalette";
import { TargetEntity } from "../../lib/api";
import { useHealth } from "../../hooks/useHealth";
import { Button } from "../ui/button";
import { ShinyText } from "../ui/ShinyText";

interface TopBarProps {
  targets: TargetEntity[];
  activeTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  onOpenNewTargetDrawer: () => void;
  onSelectTab?: (tabKey: string) => void;
  onTriggerRun?: () => void;
  onSimulateChaos?: () => void;
}

export function TopBar({
  targets,
  activeTargetId,
  onSelectTarget,
  onOpenNewTargetDrawer,
  onSelectTab = () => {},
  onTriggerRun = () => {},
  onSimulateChaos = () => {},
}: TopBarProps) {
  const { brightDataState, geminiState } = useHealth(20000);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <header className="h-16 w-full border-b border-white/[0.08] bg-[#070A12]/85 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between select-none z-30 sticky top-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Left Brand Wordmark & Target Switcher */}
      <div className="flex items-center gap-4 sm:gap-6">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] transition-all duration-300">
            <div className="w-full h-full bg-[#090D18] rounded-[7px] flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
              <span>SENTINEL</span>
              <span className="text-indigo-400 font-mono text-xs">·CHAIN</span>
            </div>
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
              Autonomous Acquisition Mesh
            </span>
          </div>
        </a>

        <div className="h-5 w-[1px] bg-white/[0.08] hidden sm:block" />

        <TargetSwitcher
          targets={targets}
          activeTargetId={activeTargetId}
          onSelectTarget={onSelectTarget}
          onOpenNewTargetDrawer={onOpenNewTargetDrawer}
        />
      </div>

      {/* Right controls: Health Chips & ⌘K */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex items-center gap-2">
          <LiveStatusChip label="Bright Data" state={brightDataState} />
          <LiveStatusChip label="Gemini AI" state={geminiState} />
        </div>

        <button
          onClick={() => setCmdOpen(true)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] hover:border-indigo-500/50 text-xs text-neutral-300 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Search or execute command (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Search actions...</span>
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono text-[10px] text-neutral-300">
            ⌘K
          </kbd>
        </button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewTargetDrawer}
          className="hidden sm:inline-flex bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white border-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Target</span>
        </Button>
      </div>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        targets={targets}
        activeTargetId={activeTargetId}
        onSelectTarget={onSelectTarget}
        onSelectTab={onSelectTab}
        onTriggerRun={onTriggerRun}
        onSimulateChaos={onSimulateChaos}
        onOpenNewTarget={onOpenNewTargetDrawer}
      />
    </header>
  );
}
