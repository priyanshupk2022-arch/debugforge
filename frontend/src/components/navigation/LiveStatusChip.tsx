import React from "react";
import { ServiceHealthState } from "../../hooks/useHealth";

interface LiveStatusChipProps {
  label: string;
  state: ServiceHealthState;
  className?: string;
}

export function LiveStatusChip({ label, state, className = "" }: LiveStatusChipProps) {
  const dotColor =
    state === "connected"
      ? "bg-[var(--verified)]"
      : state === "degraded"
      ? "bg-[var(--degraded)]"
      : "bg-[var(--broken)]";

  const stateText =
    state === "connected" ? "Live" : state === "degraded" ? "Degraded" : "Offline";

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-xs text-[var(--text-secondary)] shadow-[var(--shadow-1)] select-none ${className}`}
      title={`${label}: ${stateText}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className="font-medium text-[var(--text-primary)]">{label}</span>
      <span className="text-[var(--text-tertiary)] font-mono text-[10px] uppercase">
        {stateText}
      </span>
    </div>
  );
}
