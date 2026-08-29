import React from 'react';
import { Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05080f] border-t border-slate-850 py-12 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-slate-950 font-bold">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white font-mono">
                Debug<span className="text-orange-500">Forge</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The autonomous AI debugging agent harness. Reproducing, diagnosing, and auto-healing runtime bugs in isolated Daytona sandboxes before production.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 font-mono">
              MIT Licensed • Open Source
            </div>
          </div>

          {/* Col 2: Architecture & Harness */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Core Architecture
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><a href="#pipeline" className="hover:text-orange-400 transition-colors">TrueForge ReAct Reasoning Loop</a></li>
              <li><a href="#pipeline" className="hover:text-orange-400 transition-colors">5 TrueForge-Compliant MCP Tools</a></li>
              <li><a href="#pipeline" className="hover:text-orange-400 transition-colors">Dynamic Backward Causal Tracing</a></li>
              <li><a href="#pipeline" className="hover:text-orange-400 transition-colors">Triple-Lock Differential Verifier</a></li>
              <li><a href="#pipeline" className="hover:text-orange-400 transition-colors">AST Surgical Patch Synthesizer</a></li>
            </ul>
          </div>

          {/* Col 3: Sandboxes & Integrations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Integrations
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <span className="text-cyan-400 font-semibold">Daytona Sandboxes:</span> Ephemeral Micro-Containers
              </li>
              <li>
                <span className="text-purple-400 font-semibold">Qodo PR-Agent:</span> Automated PR Quality Gate
              </li>
              <li>
                <span className="text-orange-400 font-semibold">React Ink:</span> High-Performance Terminal TUI
              </li>
              <li>
                <span className="text-emerald-400 font-semibold">Commander CLI:</span> diagnose, watch, agent
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Commands */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              CLI Subcommands
            </h4>
            <div className="space-y-1 text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div><span className="text-orange-400">$</span> debugforge diagnose</div>
              <div><span className="text-orange-400">$</span> debugforge watch</div>
              <div><span className="text-orange-400">$</span> debugforge agent "prompt"</div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-850/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © 2026 DebugForge. Built to eliminate the 2026 Developer Productivity Paradox.
          </div>
          <div className="flex items-center space-x-4">
            <span>React 19 + Vite 6 + Tailwind 3.4</span>
            <span>•</span>
            <span>Hermetic Sandbox Engine</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
