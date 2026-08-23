import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ElapsedTimerProps {
  lastConfirmedStage: string;
  isRunning?: boolean;
}

export function ElapsedTimer({ lastConfirmedStage, isRunning = false }: ElapsedTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-[var(--radius-xs)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-xs shadow-[var(--shadow-1)]">
      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
        <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <span className="font-mono font-semibold text-[var(--text-primary)]">
          {mins}:{secs}
        </span>
      </div>

      <div className="h-3 w-[1px] bg-[var(--border-default)]" />

      <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
        Last Confirmed:{" "}
        <span className="font-medium text-[var(--text-primary)] uppercase">
          {lastConfirmedStage || "IDLE"}
        </span>
      </div>
    </div>
  );
}
