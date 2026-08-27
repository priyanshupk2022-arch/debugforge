import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Zap, Activity } from 'lucide-react';

interface ThreatGaugeProps {
  currentScore: number;
  initialScore: number;
  cvssVector: string;
  stage: string;
  isImmunized: boolean;
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({
  currentScore,
  initialScore,
  cvssVector,
  stage,
  isImmunized,
}) => {
  // SVG Circle calculations
  const size = 260;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Normalized score 0 - 10
  const normalizedScore = Math.max(0, Math.min(10, currentScore));
  const scorePercent = normalizedScore / 10;
  
  // Arc calculation: using 260 degree arc for automotive/cyber dashboard gauge look
  const strokeDashoffset = circumference - scorePercent * (circumference * 0.75);

  const getSeverityInfo = (score: number) => {
    if (score === 0) {
      return {
        label: 'CLEAN / IMMUNIZED',
        color: '#10B981',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bgGradient: 'from-emerald-500/20 to-teal-500/5',
        badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
      };
    }
    if (score < 4.0) {
      return {
        label: 'LOW SEVERITY',
        color: '#3B82F6',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        bgGradient: 'from-blue-500/20 to-cyan-500/5',
        badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-500/40',
      };
    }
    if (score < 7.0) {
      return {
        label: 'MEDIUM THREAT',
        color: '#F59E0B',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgGradient: 'from-amber-500/20 to-orange-500/5',
        badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
      };
    }
    if (score < 9.0) {
      return {
        label: 'HIGH THREAT',
        color: '#F97316',
        textColor: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        bgGradient: 'from-orange-500/20 to-red-500/5',
        badgeBg: 'bg-orange-950/60 text-orange-300 border-orange-500/40',
      };
    }
    return {
      label: 'CRITICAL SINK',
      color: '#EF4444',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      bgGradient: 'from-rose-500/20 to-red-500/5',
      badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
    };
  };

  const severity = getSeverityInfo(currentScore);
  const reductionPercent = initialScore > 0 
    ? Math.round(((initialScore - currentScore) / initialScore) * 100)
    : 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${severity.borderColor} bg-gradient-to-b from-[#111827] to-[#0B0F17] p-6 shadow-2xl transition-all duration-500 backdrop-blur-md`}>
      {/* Background radial glow */}
      <div 
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl transition-colors duration-700"
        style={{ backgroundColor: severity.color }}
      />

      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/90 border border-slate-700/60 text-cyan-400 shadow-inner">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-200">REAL-TIME CVSS THREAT GAUGE</h3>
            <p className="text-xs text-slate-400 font-mono">Continuous Threat Differential Engine</p>
          </div>
        </div>
        <div className={`px-3 py-1 text-xs font-mono font-semibold rounded-full border ${severity.badgeBg} flex items-center gap-1.5 shadow-sm`}>
          {isImmunized ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>IMMUNIZED 0.0</span>
            </>
          ) : currentScore > 7 ? (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 animate-bounce" />
              <span>ACTIVE THREAT</span>
            </>
          ) : (
            <>
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>HARDENING</span>
            </>
          )}
        </div>
      </div>

      {/* Main Radial SVG Gauge */}
      <div className="relative mt-4 flex flex-col items-center justify-center py-2">
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            <defs>
              <linearGradient id="threatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="35%" stopColor="#3B82F6" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#1E293B"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />

            {/* Active Value Arc with Dynamic Glow */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="url(#threatGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Central Radial Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-widest font-mono text-slate-400 font-semibold">CVSS v3.1</span>
            <div className="flex items-baseline justify-center gap-1 my-1">
              <span className={`text-5xl font-extrabold tracking-tight font-mono transition-all duration-300 ${severity.textColor}`}>
                {currentScore.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-slate-500 font-medium">/10.0</span>
            </div>
            <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${severity.borderColor} bg-slate-900/80 ${severity.textColor}`}>
              {severity.label}
            </span>
          </div>
        </div>

        {/* Real-time Status Metric Badges */}
        <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-2.5 backdrop-blur-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Baseline CVSS</span>
            <span className="text-sm font-mono font-bold text-rose-400">{initialScore.toFixed(1)}</span>
          </div>

          <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-2.5 backdrop-blur-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Current Stage</span>
            <span className="text-xs font-mono font-bold text-cyan-400 truncate block">{stage}</span>
          </div>

          <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-2.5 backdrop-blur-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Risk Neutralized</span>
            <div className="flex items-center justify-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span className="text-sm font-mono font-bold text-emerald-400">{reductionPercent}%</span>
            </div>
          </div>
        </div>

        {/* Vector breakdown */}
        <div className="mt-3 w-full rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-left">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Vector String</span>
            <span className="text-emerald-400 font-semibold">{isImmunized ? 'IMMUNIZATION LOCK' : 'EXPLOIT IDENTIFIED'}</span>
          </div>
          <p className="text-[11px] font-mono text-slate-300 break-all bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
            {cvssVector}
          </p>
        </div>
      </div>
    </div>
  );
};
