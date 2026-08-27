import React, { useState } from 'react';
import { Terminal, Shield, Flame, CheckCircle2, Play, Pause, RotateCcw, Copy, Check, Server, Lock } from 'lucide-react';
import { SecurityScenario } from '../types';

interface RedBlueSplitTerminalProps {
  scenario: SecurityScenario;
  activeStage: string;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
}

export const RedBlueSplitTerminal: React.FC<RedBlueSplitTerminalProps> = ({
  scenario,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
}) => {
  const [copiedRed, setCopiedRed] = useState(false);
  const [copiedBlue, setCopiedBlue] = useState(false);

  const handleCopyRed = () => {
    const text = scenario.redAgentDetails.terminalLogs.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedRed(true);
    setTimeout(() => {
      setCopiedRed(false);
    }, 2000);
  };

  const handleCopyBlue = () => {
    const text = scenario.blueAgentDetails.compileLogs.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBlue(true);
    setTimeout(() => {
      setCopiedBlue(false);
    }, 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B0F17] shadow-2xl overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 ring-2 ring-rose-500/20" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 ring-2 ring-amber-500/20" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 ring-2 ring-emerald-500/20" />
          </div>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold tracking-wider text-slate-200 uppercase">
              LIVE SPLIT TERMINAL VISUALIZER (RED ARENA vs BLUE DAYTONA)
            </span>
          </div>
        </div>

        {/* Playback simulation controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSimulation}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all ${
              isSimulating
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isSimulating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isSimulating ? 'PAUSE STREAM' : 'RUN AVO SIMULATION'}</span>
          </button>

          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Split Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left Side: RED AGENT (Exploit Arena) */}
        <div className="flex flex-col bg-[#070A0F]/90 p-5">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-950 border border-rose-800/60 text-rose-400">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wide text-rose-400">
                  RED AGENT: EXPLOIT ARENA
                </span>
                <p className="text-[11px] font-mono text-slate-400">Dynamic Payload Synthesizer & Breach Verifier</p>
              </div>
            </div>

            <button
              onClick={handleCopyRed}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition"
              title="Copy Red logs"
            >
              {copiedRed ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedRed ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Active Exploit Payload Card */}
          <div className="mb-4 rounded-xl border border-rose-900/50 bg-rose-950/20 p-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-300 mb-1">
              <span className="font-semibold">ACTIVE TARGET ENDPOINT</span>
              <span className="rounded bg-rose-900/60 px-1.5 py-0.5 text-rose-200 font-bold">
                {scenario.redAgentDetails.method} {scenario.redAgentDetails.targetEndpoint}
              </span>
            </div>
            <div className="mt-2 rounded-lg bg-black/80 p-2.5 border border-rose-900/30">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Weaponized Payload String:</span>
              <code className="text-xs font-mono text-rose-400 break-all">
                {scenario.redAgentDetails.payload}
              </code>
            </div>
          </div>

          {/* Live Log Stream */}
          <div className="flex-1 flex flex-col min-h-[220px] rounded-xl border border-slate-800/90 bg-black/90 p-4 font-mono text-xs overflow-y-auto max-h-[280px]">
            <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-2 flex justify-between">
              <span>EXECUTION STREAM</span>
              <span className="text-rose-400 font-semibold">STATUS: BREACHED (HTTP {scenario.redAgentDetails.exploitResponseCode})</span>
            </div>
            <div className="space-y-1.5">
              {scenario.redAgentDetails.terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.startsWith('[!]') ? (
                    <span className="text-rose-400 font-semibold">{log}</span>
                  ) : log.startsWith('[+]') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith('[>]') ? (
                    <span className="text-amber-300">{log}</span>
                  ) : (
                    <span className="text-slate-300">{log}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Proof of Exploit Exfiltrated data */}
            <div className="mt-4 pt-3 border-t border-rose-950">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-1">
                💥 Exfiltrated Proof Evidence (Status 200 OK):
              </span>
              <pre className="p-2 rounded bg-rose-950/40 border border-rose-900/40 text-[11px] text-rose-300 whitespace-pre-wrap overflow-x-auto">
                {scenario.redAgentDetails.exploitProofOutput}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Side: BLUE AGENT (Daytona Sandbox & AVO Loop) */}
        <div className="flex flex-col bg-[#070A0F]/90 p-5">
          <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-950 border border-emerald-800/60 text-emerald-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wide text-emerald-400">
                  BLUE AGENT: DAYTONA SANDBOX & AVO LOOP
                </span>
                <p className="text-[11px] font-mono text-slate-400">AST Synthesizer & Zero-Regression Compiler</p>
              </div>
            </div>

            <button
              onClick={handleCopyBlue}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition"
              title="Copy Blue logs"
            >
              {copiedBlue ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedBlue ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Sandbox Info & Strategy Card */}
          <div className="mb-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold">{scenario.blueAgentDetails.sandboxId}</span>
              </div>
              <span className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-emerald-200 font-bold flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>CONTAINER IMMUNIZED</span>
              </span>
            </div>
            <div className="mt-2 rounded-lg bg-black/80 p-2.5 border border-emerald-900/30">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Synthesized Codemod Strategy:</span>
              <p className="text-xs font-mono text-emerald-300">
                {scenario.blueAgentDetails.patchStrategy}
              </p>
            </div>
          </div>

          {/* Live Log Stream */}
          <div className="flex-1 flex flex-col min-h-[220px] rounded-xl border border-slate-800/90 bg-black/90 p-4 font-mono text-xs overflow-y-auto max-h-[280px]">
            <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-2 flex justify-between">
              <span>DAYTONA COMPILE PASS</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                TEST SUITE {scenario.blueAgentDetails.testsPassed}/{scenario.blueAgentDetails.testsTotal} (EXIT CODE 0)
              </span>
            </div>
            <div className="space-y-1.5">
              {scenario.blueAgentDetails.compileLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.includes('✅') || log.includes('BLOCKED') ? (
                    <span className="text-emerald-400 font-semibold">{log}</span>
                  ) : log.startsWith('[BLUE-AVO]') ? (
                    <span className="text-cyan-300">{log}</span>
                  ) : (
                    <span className="text-slate-300">{log}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Retest response proof */}
            <div className="mt-4 pt-3 border-t border-emerald-950">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                🛡️ Exploit Re-Test Result (Hardened Endpoint):
              </span>
              <pre className="p-2 rounded bg-emerald-950/40 border border-emerald-900/40 text-[11px] text-emerald-300 whitespace-pre-wrap overflow-x-auto">
                HTTP {scenario.blueAgentDetails.retestBlockedCode} Blocked: {scenario.blueAgentDetails.retestProofOutput}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
