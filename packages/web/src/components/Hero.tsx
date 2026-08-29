import React from 'react';
import { 
  Terminal, 
  Flame, 
  ArrowRight, 
  AlertTriangle, 
  Clock, 
  Layers 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden bg-grid-pattern">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-orange-600/20 via-amber-500/15 to-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-orange-500/30 text-xs text-orange-300 shadow-glow-orange"
          >
            <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">TrueForge Agent SDK</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Daytona Sandboxes</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Qodo Code Review</span>
          </motion.div>
        </div>

        {/* Main Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center max-w-4xl mx-auto space-y-5"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
            The Autonomous AI{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
              Debugging Agent
            </span>{' '}
            Harness
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            DebugForge autonomously <strong className="text-white font-semibold">reproduces</strong>, <strong className="text-white font-semibold">diagnoses</strong> (backward causal tracing), and <strong className="text-white font-semibold">auto-heals</strong> runtime bugs inside isolated Daytona sandboxes before code reaches production.
          </p>
        </motion.div>

        {/* Action CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#simulator"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-950 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-glow-orange transition-all transform hover:-translate-y-0.5"
          >
            <Terminal className="w-5 h-5" />
            <span>Launch Live Terminal Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#pipeline"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 text-sm sm:text-base font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all"
          >
            <Layers className="w-5 h-5 text-orange-400" />
            <span>Explore 5-Stage ReAct Loop</span>
          </a>
        </motion.div>

        {/* 2026 Developer Productivity Paradox Spotlight */}
        <motion.div 
          id="paradox"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-slate-800/80"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>The 2026 Industry Crisis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The 2026 Developer Productivity Paradox
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-2">
              AI code generation tools write code in seconds, but create silent runtime explosions that human engineers spend entire sprints diagnosing.
            </p>
          </div>

          {/* 3 Paradox Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: 67% Time Lost */}
            <div className="relative group p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-orange-500/40 transition-all duration-300 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-3xl font-extrabold text-orange-400 font-mono">
                  67%
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Developer Time Debugging AI Code
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Developers in 2026 spend more than <strong>two-thirds</strong> of their weekly engineering hours triaging AI-generated hallucinations, edge-case regressions, and unhandled null cascades.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center text-xs text-orange-400 font-medium">
                <span>DebugForge autonomous fix: <strong className="text-white">&lt; 2 mins</strong></span>
              </div>
            </div>

            {/* Card 2: 43% Post-Test Failures */}
            <div className="relative group p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-3xl font-extrabold text-amber-400 font-mono">
                  43%
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Post-Test Production Failure Rate
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                <strong>43%</strong> of runtime incidents pass standard mock tests but fail catastrophically in production under asynchronous concurrency, connection pool timeouts, or unbounded memory leaks.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center text-xs text-amber-400 font-medium">
                <span>Triple-Lock Verification: <strong className="text-white">Zero Regressions</strong></span>
              </div>
            </div>

            {/* Card 3: 10x MTTR Reduction */}
            <div className="relative group p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  10x
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Faster Mean Time to Resolution
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Autonomous ReAct agent loop cuts Mean Time to Resolution from <strong>4.2 hours</strong> down to <strong>under 2 minutes</strong> using Daytona sandboxes, dynamic backward causal tracing, and surgical AST patches.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center text-xs text-emerald-400 font-medium">
                <span>Qodo PR-Agent review: <strong className="text-white">100% automated</strong></span>
              </div>
            </div>

          </div>

          {/* Quick Value Metrics Ribbon */}
          <div className="mt-8 p-4 rounded-xl bg-slate-900/50 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-400">Reproduction Fidelity</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">100% Hermetic</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Causal Blame Origin</div>
              <div className="text-lg font-bold text-orange-400 font-mono mt-0.5">AST Data-Flow</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Verification Gate</div>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">Triple-Lock</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Human Governance</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">HITL Decision</div>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
};
