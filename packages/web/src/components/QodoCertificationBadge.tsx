import React from 'react';
import { Award, CheckCircle2, ShieldCheck, FileCheck2, Cpu, Hash } from 'lucide-react';
import { SecurityScenario } from '../types';

interface QodoCertificationBadgeProps {
  certification: SecurityScenario['qodoCertification'];
  isApproved: boolean;
}

export const QodoCertificationBadge: React.FC<QodoCertificationBadgeProps> = ({
  certification,
  isApproved,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#111827] to-[#070A0F] p-5 shadow-2xl backdrop-blur-md">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              QODO CODE QUALITY CERTIFICATION
            </h3>
            <p className="text-[11px] font-mono text-slate-400">Automated AST Security & Integrity Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-2.5 py-1 text-[11px] font-mono font-bold text-cyan-300">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>GRADE A+ CERTIFIED</span>
        </div>
      </div>

      {/* Overall Score Banner */}
      <div className="my-4 flex items-center justify-between rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3.5">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Qodo Quality Metric</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-mono font-extrabold text-cyan-300">
              {certification.overallScore.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">/100</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Gate Status</span>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300 border border-emerald-800/60 mt-0.5">
            <CheckCircle2 className="h-3 w-3" />
            {certification.securityGateStatus}
          </span>
        </div>
      </div>

      {/* Sub-Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
          <span className="text-[10px] text-slate-400 block">Test Integrity</span>
          <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
            {certification.testIntegrityScore}%
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
          <span className="text-[10px] text-slate-400 block">Code Smells</span>
          <span className="text-xs font-bold text-cyan-300 mt-0.5 block">
            {certification.codeSmellCount} DETECTED
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
          <span className="text-[10px] text-slate-400 block">Regression Risk</span>
          <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
            {certification.regressionRiskPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Verification Verdict */}
      <div className="mt-3 rounded-lg border border-slate-800 bg-black/60 p-2.5 text-[11px] font-mono text-slate-300 flex items-start gap-2">
        <FileCheck2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">{certification.verdict}</p>
      </div>

      {/* Cryptographic Stamp */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1">
          <Hash className="h-3 w-3 text-cyan-400" />
          <span className="truncate max-w-[200px]" title={certification.cryptographicCertificateHash}>
            {certification.cryptographicCertificateHash}
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
          <Cpu className="h-3 w-3" />
          <span>{isApproved ? 'DISPATCHED' : 'READY TO DISPATCH'}</span>
        </div>
      </div>
    </div>
  );
};
