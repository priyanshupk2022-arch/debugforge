import React from "react";
import { Check, X, Circle, Play, AlertTriangle, Search, Sparkles, ShieldCheck, Wrench, RotateCcw, CheckCircle2 } from "lucide-react";

export type NodeState = "UPCOMING" | "ACTIVE" | "PASS" | "FAIL";

interface EvidenceNodeProps {
  id: string;
  label: string;
  state: NodeState;
  isSelected: boolean;
  onClick: () => void;
  metadata?: string;
}

export function EvidenceNode({
  id,
  label,
  state,
  isSelected,
  onClick,
  metadata,
}: EvidenceNodeProps) {
  const getNodeIcon = () => {
    switch (id) {
      case "RUN":
        return <Play className="w-3.5 h-3.5" />;
      case "BROKEN":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case "EVIDENCE":
        return <Search className="w-3.5 h-3.5" />;
      case "DIAGNOSIS":
        return <Sparkles className="w-3.5 h-3.5" />;
      case "PROPOSAL":
        return <Sparkles className="w-3.5 h-3.5" />;
      case "GATE":
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case "HEAL":
        return <Wrench className="w-3.5 h-3.5" />;
      case "RE_RUN":
        return <RotateCcw className="w-3.5 h-3.5" />;
      case "VERIFIED":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      default:
        return <Circle className="w-3.5 h-3.5" />;
    }
  };

  const getStyle = () => {
    switch (state) {
      case "PASS":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]";
      case "FAIL":
        return "bg-rose-500/20 text-rose-400 border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
      case "ACTIVE":
        return "bg-indigo-600 text-white border-indigo-400 animate-pulse shadow-[0_0_25px_rgba(99,102,241,0.8)]";
      case "UPCOMING":
      default:
        return "bg-[#0E131F] text-neutral-400 border-white/[0.1]";
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={state === "ACTIVE" ? "step" : undefined}
      className={`group flex flex-col items-center focus-visible:outline-none rounded-lg p-1.5 transition-all duration-200 ${
        isSelected ? "scale-110" : "hover:scale-105"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStyle()} ${
          isSelected ? "ring-4 ring-indigo-500/40 ring-offset-2 ring-offset-black" : ""
        }`}
      >
        {state === "PASS" ? (
          <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
        ) : state === "FAIL" ? (
          <X className="w-5 h-5 text-rose-400 stroke-[3]" />
        ) : (
          getNodeIcon()
        )}
      </div>

      <span
        className={`text-[10px] font-mono uppercase tracking-wider mt-2.5 font-semibold transition-colors ${
          state === "ACTIVE"
            ? "text-indigo-400 font-bold drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            : state === "PASS"
            ? "text-emerald-400"
            : state === "FAIL"
            ? "text-rose-400"
            : "text-neutral-400 group-hover:text-neutral-200"
        }`}
      >
        {label}
      </span>

      {metadata && (
        <span className="text-[9px] font-mono text-neutral-400 mt-0.5">
          {metadata}
        </span>
      )}
    </button>
  );
}
