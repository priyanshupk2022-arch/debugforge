import React from "react";
import { LayoutDashboard, Database, Activity, FileCode, Settings, Sparkles } from "lucide-react";

export type WorkspaceTabKey = "overview" | "records" | "evidence" | "exposure" | "schema" | "settings";

interface WorkspaceTabsProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (tab: WorkspaceTabKey) => void;
  recordCount?: number;
  hasBrokenOrHealed?: boolean;
}

export function WorkspaceTabs({
  activeTab,
  onTabChange,
  recordCount = 0,
  hasBrokenOrHealed = false,
}: WorkspaceTabsProps) {
  const tabs = [
    {
      key: "overview" as WorkspaceTabKey,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      key: "records" as WorkspaceTabKey,
      label: "Runs & Records",
      icon: Database,
      badge: recordCount > 0 ? recordCount : undefined,
    },
    {
      key: "evidence" as WorkspaceTabKey,
      label: "Evidence & Self-Healing",
      icon: Activity,
      highlight: hasBrokenOrHealed,
    },
    {
      key: "exposure" as WorkspaceTabKey,
      label: "Exposure Engine",
      icon: Sparkles,
    },
    {
      key: "schema" as WorkspaceTabKey,
      label: "Schema",
      icon: FileCode,
    },
    {
      key: "settings" as WorkspaceTabKey,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="w-full border-b border-white/[0.08] bg-[#090D18]/80 backdrop-blur-xl px-4 sm:px-6 select-none">
      <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar py-1" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={`group relative inline-flex items-center gap-2 py-3 px-3.5 text-xs font-medium transition-all duration-200 whitespace-nowrap rounded-lg focus-visible:outline-none ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive
                    ? "text-indigo-400"
                    : tab.highlight
                    ? "text-emerald-400"
                    : "text-neutral-400 group-hover:text-neutral-200"
                }`}
              />
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/[0.08] border border-white/[0.1] font-mono text-[10px] text-neutral-300">
                  {tab.badge}
                </span>
              )}

              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
