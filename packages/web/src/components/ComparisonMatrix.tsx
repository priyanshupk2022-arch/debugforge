import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  Zap 
} from 'lucide-react';
import { COMPARISON_DATA } from '../data/comparisonData';

export const ComparisonMatrix: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Autonomous Sandboxing', 'Root Cause Diagnosis', 'Verification & Code Quality', 'Developer Experience'];

  const filteredRows = activeCategory === 'ALL'
    ? COMPARISON_DATA
    : COMPARISON_DATA.filter((row) => row.category === activeCategory);

  const renderCellContent = (val: string | boolean, isDebugForge: boolean = false) => {
    if (typeof val === 'boolean') {
      return val ? (
        <span className="inline-flex items-center text-emerald-400 font-semibold">
          <Check className="w-5 h-5 mr-1 text-emerald-400" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center text-rose-400">
          <X className="w-5 h-5 mr-1 text-rose-400" /> No
        </span>
      );
    }

    if (val.startsWith('None') || val.startsWith('❌')) {
      return <span className="text-slate-500 font-medium">{val}</span>;
    }

    if (val.startsWith('⚠️') || val.includes('Heuristic') || val.includes('Manual')) {
      return <span className="text-amber-400/90 font-medium">{val}</span>;
    }

    if (isDebugForge) {
      return (
        <span className="text-orange-400 font-semibold flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{val}</span>
        </span>
      );
    }

    return <span className="text-slate-300 font-medium">{val}</span>;
  };

  return (
    <section id="comparison" className="py-20 bg-[#090d16] relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Architectural Supremacy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How DebugForge Compares
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Unlike IDE copilot chat boxes or post-mortem log viewers, DebugForge combines isolated Daytona sandboxes, causal graph tracing, and Triple-Lock verification.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
                activeCategory === cat
                  ? 'bg-orange-500 text-slate-950 font-bold shadow-glow-orange'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Comparison Table Box */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="p-4 sm:p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-1/3">
                  Capability / Feature
                </th>
                <th className="p-4 sm:p-5 text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border-x border-orange-500/30 w-1/4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                    <span>DebugForge</span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 text-xs font-semibold uppercase tracking-wider text-slate-300 w-1/6">
                  Cursor
                </th>
                <th className="p-4 sm:p-5 text-xs font-semibold uppercase tracking-wider text-slate-300 w-1/6">
                  Sentry
                </th>
                <th className="p-4 sm:p-5 text-xs font-semibold uppercase tracking-wider text-slate-300 w-1/6">
                  SWE-agent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs sm:text-sm">
              {filteredRows.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-slate-900/40 transition-colors ${row.highlight ? 'bg-slate-900/20' : ''}`}
                >
                  
                  {/* Feature name & category */}
                  <td className="p-4 sm:p-5 font-medium text-white">
                    <div className="flex items-center space-x-2">
                      <span>{row.feature}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {row.tooltip}
                    </div>
                  </td>

                  {/* DebugForge */}
                  <td className="p-4 sm:p-5 bg-orange-500/5 border-x border-orange-500/20 font-medium">
                    {renderCellContent(row.debugforge, true)}
                  </td>

                  {/* Cursor */}
                  <td className="p-4 sm:p-5 text-slate-300">
                    {renderCellContent(row.cursor)}
                  </td>

                  {/* Sentry */}
                  <td className="p-4 sm:p-5 text-slate-300">
                    {renderCellContent(row.sentry)}
                  </td>

                  {/* SWE-agent */}
                  <td className="p-4 sm:p-5 text-slate-300">
                    {renderCellContent(row.sweagent)}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Callout banner */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0d1424] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-white">
              Ready to eliminate the 2026 Developer Productivity Paradox?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Run <code className="text-orange-400 font-mono">debugforge diagnose</code> on any failing repository today.
            </p>
          </div>
          <a
            href="#install"
            className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-orange-400 hover:bg-orange-500 rounded-xl shadow-glow-orange shrink-0 transition-transform transform hover:-translate-y-0.5"
          >
            <span>Get Started</span>
            <Check className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
};
