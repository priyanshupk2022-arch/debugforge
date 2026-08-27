import React from 'react';
import { Target, ChevronRight, AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import { SecurityScenario } from '../types';

interface TargetSelectorProps {
  scenarios: SecurityScenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenario: SecurityScenario) => void;
  customRepoUrl: string;
  onCustomRepoChange: (url: string) => void;
  onRunCustomScan: () => void;
}

export const TargetSelector: React.FC<TargetSelectorProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  customRepoUrl,
  onCustomRepoChange,
  onRunCustomScan,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B0F17] p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              SECURITY TARGET SELECTOR
            </h3>
            <p className="text-[11px] font-mono text-slate-400">Pre-configured Exploit Scenarios & Custom Git Sink Hunter</p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          3 TARGETS LOADED
        </span>
      </div>

      {/* Target Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`flex flex-col text-left rounded-xl p-3.5 border transition-all ${
                isSelected
                  ? 'border-cyan-500/80 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold">
                  {scenario.cwe}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  CVSS {scenario.initialCvss.toFixed(1)}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">
                {scenario.title}
              </h4>
              <p className="text-[11px] font-mono text-slate-400 line-clamp-1">
                {scenario.repository}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 w-full text-[10px] font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Immunized 0.0</span>
                </span>
                <span className="text-cyan-400 flex items-center gap-0.5">
                  <span>SELECT</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Repo Scanner Input */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Database className="h-4 w-4 text-cyan-400" />
          <span>Custom Git Repository:</span>
        </div>

        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={customRepoUrl}
            onChange={(e) => onCustomRepoChange(e.target.value)}
            placeholder="https://github.com/org/vulnerable-service.git"
            className="w-full rounded-lg border border-slate-700 bg-black/80 px-3 py-1.5 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <button
          onClick={onRunCustomScan}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-mono font-bold text-white shadow-md hover:bg-cyan-500 transition"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>SCAN REPO</span>
        </button>
      </div>
    </div>
  );
};
