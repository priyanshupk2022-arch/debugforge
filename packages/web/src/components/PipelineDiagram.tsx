import React, { useState } from 'react';
import { 
  FileText, 
  Box, 
  GitBranch, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  ChevronRight, 
  Layers, 
  Code2, 
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PIPELINE_STAGES } from '../data/pipelineStages';
import { PipelineStage } from '../types';

export const PipelineDiagram: React.FC = () => {
  const [selectedStageId, setSelectedStageId] = useState<string>('ingest_error');

  const selectedStage = PIPELINE_STAGES.find((s) => s.id === selectedStageId) || PIPELINE_STAGES[0];

  const getStageIcon = (iconName: PipelineStage['iconName']) => {
    switch (iconName) {
      case 'ingest':
        return <FileText className="w-5 h-5" />;
      case 'sandbox':
        return <Box className="w-5 h-5" />;
      case 'trace':
        return <GitBranch className="w-5 h-5" />;
      case 'patch':
        return <ShieldCheck className="w-5 h-5" />;
      case 'hitl':
        return <UserCheck className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  return (
    <section id="pipeline" className="py-20 bg-[#090d16] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Autonomous TrueForge Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The 5-Stage Autonomous ReAct Pipeline
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Every runtime bug is ingested, reproduced in Daytona, causal-traced to infection origin, Triple-Lock verified, and human-approved.
          </p>
        </div>

        {/* 5-Stage Visual Workflow Cards Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative mb-12">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isSelected = stage.id === selectedStageId;
            return (
              <div key={stage.id} className="relative flex flex-col">
                <button
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-300 flex-1 relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-orange-500/80 shadow-glow-orange ring-1 ring-orange-500/50'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Active indicator bar */}
                  {isSelected && (
                    <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isSelected
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {getStageIcon(stage.iconName)}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      0{stage.stepNumber}
                    </span>
                  </div>

                  <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-400/90 mb-1">
                    {stage.badge}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">
                    {stage.shortName}
                  </h3>
                  <code className="text-[11px] font-mono text-cyan-400/90 block mb-2">
                    {stage.toolName}()
                  </code>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {stage.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'text-orange-400 font-semibold' : 'text-slate-400'}>
                      {isSelected ? 'Inspecting' : 'Click to inspect'}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-orange-400' : 'text-slate-500'}`} />
                  </div>
                </button>

                {/* Desktop connecting arrow between steps */}
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-600">
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Interactive Inspection Drawer / Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStage.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c121e] border border-slate-800 shadow-2xl p-6 sm:p-8"
          >
            
            {/* Header of inspected stage */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-glow-orange">
                  {getStageIcon(selectedStage.iconName)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                      Stage 0{selectedStage.stepNumber}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      TrueForge MCP: {selectedStage.toolName}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {selectedStage.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedStage.verificationMethod}</span>
                </span>
              </div>
            </div>

            {/* Description & Technical Narrative */}
            <div className="py-5 text-sm sm:text-base text-slate-300 leading-relaxed border-b border-slate-800/80">
              <p>{selectedStage.description}</p>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70">
                <strong className="text-slate-300 font-semibold">Engine Mechanics:</strong> {selectedStage.technicalDetails}
              </p>
            </div>

            {/* 2-Column I/O Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
              
              {/* Inputs & Schema */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Code2 className="w-4 h-4 text-orange-400" />
                    <span>Inputs & Preconditions</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Zod Validated</span>
                </div>

                <ul className="space-y-2">
                  {selectedStage.inputs.map((inp, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0"></span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>

                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-1.5">Example Input Payload:</div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto selection:bg-orange-500/20">
                    {JSON.stringify(selectedStage.exampleInput, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Outputs & Diagnostic Proof */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Deterministic Outputs</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">Verified Exit-0</span>
                </div>

                <ul className="space-y-2">
                  {selectedStage.outputs.map((out, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>

                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-1.5">Example Output Result:</div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto selection:bg-orange-500/20">
                    {JSON.stringify(selectedStage.exampleOutput, null, 2)}
                  </pre>
                </div>
              </div>

            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
