import React, { useState } from 'react';
import { Copy, Check, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { INSTALL_TABS } from '../data/incidentData';

export const QuickInstall: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'powershell' | 'npm' | 'npx'>('curl');
  const [copied, setCopied] = useState(false);

  const currentTab = INSTALL_TABS.find((t) => t.id === activeTab) || INSTALL_TABS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTab.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" className="py-16 bg-[#0c121e]/90 border-y border-slate-800/80 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>One-Line Quick Setup</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Install DebugForge in Seconds
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-1">
            Zero-config install script with automated Daytona sandbox and TrueForge ReAct harness initialization.
          </p>
        </div>

        {/* Tabbed Installer Box */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Tabs bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-2.5">
            <div className="flex space-x-1 sm:space-x-2">
              {INSTALL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                    activeTab === tab.id
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>v1.0.0 Verified</span>
            </div>
          </div>

          {/* Command Display Body */}
          <div className="p-5 sm:p-6 bg-[#070b14] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full overflow-x-auto">
              <span className="text-orange-500 font-mono font-bold select-none text-base sm:text-lg">$</span>
              <code className="text-xs sm:text-sm md:text-base font-mono text-emerald-400 whitespace-nowrap overflow-x-auto selection:bg-orange-500/20">
                {currentTab.command}
              </code>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald font-semibold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>

          {/* Tab Description & Prerequisites Footer */}
          <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{currentTab.description}</span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Prerequisite: Node.js &ge; 18.0.0
            </div>
          </div>

        </div>

        {/* Feature quick badges under install */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero configuration required</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Hermetic local & Daytona cloud support</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Automated Qodo PR-Agent review hook</span>
          </div>
        </div>

      </div>
    </section>
  );
};
