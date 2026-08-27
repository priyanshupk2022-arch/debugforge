import React from 'react';
import { Shield, Radio, TerminalSquare, Cpu, CheckCircle } from 'lucide-react';

interface HeaderProps {
  activeSessionId: string;
  isLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeSessionId, isLive }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#070A0F]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Shield className="h-6 w-6 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0B0F17]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider font-mono text-white">
                ZEROSHIELD
              </h1>
              <span className="rounded-md bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-800/60">
                v1.0.0-PROD
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Autonomous Cyber Red-Team & Exploit Immunizer Command Center
            </p>
          </div>
        </div>

        {/* Engine Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-mono text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>SESSION:</span>
            <span className="text-cyan-400 font-semibold">{activeSessionId}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-mono font-semibold text-emerald-300">
            {isLive ? (
              <>
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                <span>DAYTONA LIVE</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>AVO CONVERGED</span>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <TerminalSquare className="h-4 w-4 text-cyan-400" />
            <span>ZeroShield CLI TUI Linked</span>
          </div>
        </div>
      </div>
    </header>
  );
};
