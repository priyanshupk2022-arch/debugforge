import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  ThumbsUp,
  Edit3,
  XCircle
} from 'lucide-react';
import { SCENARIOS } from '../data/terminalScenarios';
import { Scenario } from '../types';

export const TerminalSimulator: React.FC = () => {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('null-propagation');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [hitlDecision, setHitlDecision] = useState<'pending' | 'approved' | 'rejected' | 'edited'>('pending');

  const scenario: Scenario = SCENARIOS[selectedScenarioKey] || SCENARIOS['null-propagation'];
  const logsRef = useRef<HTMLDivElement>(null);

  // Auto-advance logs when playing
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStepIndex >= scenario.logs.length) {
      setIsPlaying(false);
      return;
    }

    const currentLog = scenario.logs[currentStepIndex];

    // If current log is HITL and user has not made decision, pause
    if (currentLog?.phase === 'HITL' && hitlDecision === 'pending') {
      setIsPlaying(false);
      return;
    }

    const delay = currentLog?.phase === 'DIFF' ? 1800 : currentLog?.phase === 'ACT' ? 1200 : 900;
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, delay / speedMultiplier);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, scenario.logs, hitlDecision, speedMultiplier]);

  // Scroll to bottom of terminal when new logs arrive
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [currentStepIndex]);

  const handleScenarioChange = (key: string) => {
    setSelectedScenarioKey(key);
    setCurrentStepIndex(0);
    setHitlDecision('pending');
    setIsPlaying(true);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setHitlDecision('pending');
    setIsPlaying(true);
  };

  const handleStepForward = () => {
    if (currentStepIndex < scenario.logs.length) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleHitlAction = (action: 'approved' | 'rejected' | 'edited') => {
    setHitlDecision(action);
    if (action === 'approved') {
      // Advance to success log
      setCurrentStepIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const activeLogs = scenario.logs.slice(0, currentStepIndex + 1);

  return (
    <section id="simulator" className="py-20 bg-[#060a12] relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Interactive Live Harness</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Live ReAct Terminal Simulator
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Watch DebugForge ingest failures, spin up Daytona sandboxes, trace causal origins, synthesize AST diffs, and prompt for HITL approval in real-time.
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
          {Object.entries(SCENARIOS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleScenarioChange(key)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all flex items-center space-x-2 ${
                selectedScenarioKey === key
                  ? 'bg-slate-800 text-orange-400 border-orange-500/60 shadow-glow-orange'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* Terminal Window Container */}
        <div className="rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Terminal Window Top Bar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0d1322] border-b border-slate-800/90 gap-3">
            
            {/* Window controls & Title */}
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
                <TerminalIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>debugforge diagnose --target {scenario.fixturePath}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause' : 'Play'}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={handleStepForward}
                title="Step Forward"
                disabled={currentStepIndex >= scenario.logs.length}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
              >
                <StepForward className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                title="Restart Simulation"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              {/* Speed Buttons */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                <button
                  onClick={() => setSpeedMultiplier(1)}
                  className={`px-2 py-0.5 rounded ${speedMultiplier === 1 ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => setSpeedMultiplier(2)}
                  className={`px-2 py-0.5 rounded ${speedMultiplier === 2 ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  2x
                </button>
                <button
                  onClick={() => {
                    setSpeedMultiplier(5);
                    setCurrentStepIndex(scenario.logs.length - 1);
                  }}
                  className="px-2 py-0.5 rounded text-cyan-400 hover:text-cyan-300"
                >
                  Skip
                </button>
              </div>

            </div>

          </div>

          {/* Terminal HUD Status Bar */}
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-850 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>REASONING</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500">Sandbox:</span>{' '}
              <span className="text-cyan-400 font-semibold">Daytona ws-901b</span>
            </div>
            <div>
              <span className="text-slate-500">Cycle:</span>{' '}
              <span className="text-amber-400 font-semibold">Step {Math.min(currentStepIndex + 1, scenario.logs.length)} / {scenario.logs.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Triple-Lock:</span>{' '}
              <span className={currentStepIndex >= 12 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                {currentStepIndex >= 12 ? '3/3 PASSED' : 'VERIFYING'}
              </span>
            </div>
          </div>

          {/* Terminal Main Body / Stream View */}
          <div 
            ref={logsRef}
            className="p-5 font-mono text-xs sm:text-sm text-slate-200 bg-[#070b14] h-[480px] overflow-y-auto space-y-3 selection:bg-orange-500/20"
          >
            {activeLogs.map((log) => {
              return (
                <div key={log.id} className="space-y-1.5 animate-fadeIn">
                  
                  {/* Phase header tag */}
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-600 text-[11px]">[{log.timestamp}]</span>
                    
                    {log.phase === 'INFO' && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold">
                        INFO
                      </span>
                    )}

                    {log.phase === 'THINK' && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 text-[11px] font-bold">
                        🧠 THINK
                      </span>
                    )}

                    {log.phase === 'ACT' && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-bold">
                        ⚡ ACT: {log.toolName}
                      </span>
                    )}

                    {log.phase === 'OBSERVE' && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold">
                        👁️ OBSERVE
                      </span>
                    )}

                    {log.phase === 'DIFF' && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 text-[11px] font-bold">
                        📝 AST DIFF
                      </span>
                    )}

                    {log.phase === 'LOCK' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                        🔒 TRIPLE-LOCK
                      </span>
                    )}

                    {log.phase === 'HITL' && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold">
                        🛡️ HITL GATE
                      </span>
                    )}

                    {log.phase === 'SUCCESS' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-600 text-[11px] font-bold">
                        🎉 PR OPENED
                      </span>
                    )}
                  </div>

                  {/* Content line */}
                  <div className={`pl-2 sm:pl-4 whitespace-pre-wrap leading-relaxed ${
                    log.phase === 'THINK' ? 'text-purple-200/90 italic' :
                    log.phase === 'ACT' ? 'text-cyan-300' :
                    log.phase === 'OBSERVE' ? 'text-amber-200/90' :
                    log.phase === 'LOCK' ? 'text-emerald-300 font-semibold' :
                    log.phase === 'HITL' ? 'text-rose-200 font-bold' :
                    log.phase === 'SUCCESS' ? 'text-emerald-400 font-bold' :
                    'text-slate-300'
                  }`}>
                    {log.content}
                  </div>

                  {/* Syntax-Highlighted Diff Viewer if present */}
                  {log.diff && (
                    <div className="my-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-slate-400">
                        <span className="font-bold text-slate-200">{log.diff.file}</span>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="text-emerald-400 font-semibold">+{log.diff.additions}</span>
                          <span className="text-rose-400 font-semibold">-{log.diff.deletions}</span>
                        </div>
                      </div>
                      <div className="p-3 font-mono space-y-0.5 overflow-x-auto">
                        {log.diff.lines.map((line, lIdx) => (
                          <div 
                            key={lIdx} 
                            className={`flex items-center px-2 py-0.5 rounded ${
                              line.type === 'add' ? 'bg-emerald-950/60 text-emerald-300' :
                              line.type === 'delete' ? 'bg-rose-950/60 text-rose-300 line-through opacity-80' :
                              'text-slate-400'
                            }`}
                          >
                            <span className="w-8 text-slate-600 select-none text-[10px]">
                              {line.newLine || line.oldLine || ''}
                            </span>
                            <span className="w-4 select-none font-bold">
                              {line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}
                            </span>
                            <span className="whitespace-pre">{line.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive HITL Decision Box */}
                  {log.hitlAction && hitlDecision === 'pending' && (
                    <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-orange-500/50 shadow-glow-orange animate-pulse">
                      <div className="flex items-center space-x-2 text-orange-400 font-bold text-sm mb-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span>TrueForge Human-in-the-Loop Approval Required</span>
                      </div>
                      <p className="text-xs text-slate-300 mb-4">
                        All 3 verification locks have passed inside Daytona. How do you wish to proceed?
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => handleHitlAction('approved')}
                          className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 rounded-lg shadow-glow-emerald flex items-center space-x-1.5 transition-transform transform hover:-translate-y-0.5"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>[A] Approve & Open Qodo PR</span>
                        </button>
                        <button
                          onClick={() => handleHitlAction('edited')}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center space-x-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>[E] Edit AST Patch</span>
                        </button>
                        <button
                          onClick={() => handleHitlAction('rejected')}
                          className="px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 rounded-lg flex items-center space-x-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>[R] Reject & Re-roll</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {log.hitlAction && hitlDecision === 'approved' && (
                    <div className="my-2 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Developer approved patch via interactive gate! Proceeding to PR synthesis.</span>
                    </div>
                  )}

                </div>
              );
            })}

            {/* Blinking Cursor at bottom of stream */}
            {isPlaying && (
              <div className="flex items-center space-x-2 pt-2 text-orange-400 font-mono">
                <span className="w-2 h-4 bg-orange-400 animate-pulse inline-block"></span>
                <span className="text-xs text-slate-400">Agent reasoning...</span>
              </div>
            )}

          </div>

          {/* Triple-Lock Live Verification HUD Tray */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Lock 1 */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Lock 1: Reproduction Test</div>
                <div className="text-xs font-bold text-white mt-0.5">{scenario.tripleLock.lock1.target}</div>
                <div className="text-[11px] text-slate-400">{scenario.tripleLock.lock1.description}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                currentStepIndex >= 12 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                {currentStepIndex >= 12 ? 'PASS (0)' : 'WAITING'}
              </span>
            </div>

            {/* Lock 2 */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Lock 2: Full Regression Suite</div>
                <div className="text-xs font-bold text-white mt-0.5">{scenario.tripleLock.lock2.target}</div>
                <div className="text-[11px] text-slate-400">{scenario.tripleLock.lock2.description}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                currentStepIndex >= 12 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                {currentStepIndex >= 12 ? 'PASS (0)' : 'WAITING'}
              </span>
            </div>

            {/* Lock 3 */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Lock 3: Concurrency Stress</div>
                <div className="text-xs font-bold text-white mt-0.5">{scenario.tripleLock.lock3.target}</div>
                <div className="text-[11px] text-slate-400">{scenario.tripleLock.lock3.description}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                currentStepIndex >= 12 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                {currentStepIndex >= 12 ? 'PASS (0)' : 'WAITING'}
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
