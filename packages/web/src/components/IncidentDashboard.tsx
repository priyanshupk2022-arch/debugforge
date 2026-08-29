import React, { useState } from 'react';
import { 
  Box, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  GitBranch, 
  Server
} from 'lucide-react';
import { INCIDENTS_DATA } from '../data/incidentData';

export const IncidentDashboard: React.FC = () => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(INCIDENTS_DATA[0].id);

  const selectedIncident = INCIDENTS_DATA.find((i) => i.id === selectedIncidentId) || INCIDENTS_DATA[0];

  return (
    <section className="py-12 bg-[#080c14] min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Live Incident Triage & Telemetry HUD
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time monitoring of autonomous Daytona sandbox reproduction, causal blame graphs, and Qodo review gates.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Daytona Cluster: <strong>US-EAST-1</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Triple-Lock Guard Active</span>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          
          {/* Active Sandboxes */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Daytona Sandboxes</span>
              <Box className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white font-mono">3</span>
              <span className="text-xs text-emerald-400 font-medium">Isolated Containers</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              0% local filesystem contamination
            </div>
          </div>

          {/* Auto-Heal Success Rate */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Triple-Lock Auto-Heal Rate</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">98.4%</span>
              <span className="text-xs text-slate-400">verified</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              43/44 incidents healed on first pass
            </div>
          </div>

          {/* Mean Time to Fix */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Mean Time to Fix (MTTR)</span>
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-orange-400 font-mono">1m 42s</span>
              <span className="text-xs text-slate-400">vs 4.2h human</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              -99.3% reduction in resolution time
            </div>
          </div>

          {/* Qodo Code Review Gate */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Qodo PR-Agent Review</span>
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-purple-400 font-mono">100%</span>
              <span className="text-xs text-slate-400">Pass Rate</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              0 security vulnerabilities introduced
            </div>
          </div>

        </div>

        {/* 2-Column Split: Incidents List vs Causal Graph Inspection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Incidents Table (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Triage Stream
              </h3>
              <span className="text-xs text-slate-500 font-mono">4 Total</span>
            </div>

            <div className="space-y-2.5">
              {INCIDENTS_DATA.map((inc) => {
                const isSelected = inc.id === selectedIncidentId;
                return (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-orange-500/60 shadow-glow-orange ring-1 ring-orange-500/30'
                        : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {inc.id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {inc.timestamp}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white truncate mb-1">
                      {inc.service}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 line-clamp-1 mb-2">
                      {inc.errorType}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{inc.status}</span>
                      </span>
                      <span className="text-slate-400 font-mono">
                        MTTR: <strong className="text-white">{inc.mttr}</strong>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Visual Causal Trace Graph & Blame Details (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl h-full flex flex-col justify-between">
              
              <div>
                {/* Incident Detail Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                      <span>{selectedIncident.id}</span>
                      <span>•</span>
                      <span className="text-orange-400 font-semibold">{selectedIncident.service}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {selectedIncident.message}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                      Locks: {selectedIncident.locksPassed}/3 PASS
                    </span>
                  </div>
                </div>

                {/* Visual Causal Trace Blame Chain */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <GitBranch className="w-4 h-4 text-orange-400" />
                    <span>Dynamic Backward Causal Trace (AST Data-Flow)</span>
                  </div>

                  <div className="space-y-3 relative pl-4 border-l-2 border-slate-800">
                    {selectedIncident.causalTrace.map((node, idx) => (
                      <div key={idx} className="relative group">
                        
                        {/* Dot on timeline */}
                        <div className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                          node.role === 'origin'
                            ? 'bg-rose-500 border-slate-950 ring-2 ring-rose-500/30'
                            : node.role === 'crash'
                            ? 'bg-orange-500 border-slate-950 ring-2 ring-orange-500/30'
                            : 'bg-slate-700 border-slate-950'
                        }`} />

                        <div className={`p-3.5 rounded-xl border ${
                          node.role === 'origin'
                            ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                            : node.role === 'crash'
                            ? 'bg-orange-950/20 border-orange-800/40 text-orange-200'
                            : 'bg-slate-950/50 border-slate-800 text-slate-300'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs font-mono flex items-center space-x-1.5">
                              <span>{node.node}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              node.role === 'origin' ? 'bg-rose-500/20 text-rose-300' :
                              node.role === 'crash' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {node.role === 'origin' ? '🔴 Infection Origin' : node.role === 'crash' ? '💥 Crash Site' : 'Propagation'}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-cyan-400 mb-1">
                            {node.file}:{node.line}
                          </div>

                          <div className="text-xs text-slate-400">
                            {node.desc}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sandbox Container Telemetry Footer */}
              <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono gap-3 bg-slate-950/60 p-3 rounded-xl">
                <div>
                  Sandbox: <strong className="text-white">{selectedIncident.sandboxId}</strong>
                </div>
                <div>
                  Fidelity: <strong className="text-emerald-400">100% Hermetic</strong>
                </div>
                <div>
                  Auto-Patch: <strong className="text-orange-400">Triple-Lock Passed</strong>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
