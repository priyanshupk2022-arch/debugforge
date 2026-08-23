import React from "react";
import { Terminal, Activity, Clock } from "lucide-react";
import { TelemetryEvent } from "../../hooks/useTelemetryStream";
import { Badge } from "../ui/badge";

interface TelemetryTimelineProps {
  events: TelemetryEvent[];
  maxHeight?: string;
}

export function TelemetryTimeline({
  events,
  maxHeight = "360px",
}: TelemetryTimelineProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] overflow-hidden flex flex-col">
      <div className="p-3.5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
          <Terminal className="w-4 h-4 text-[var(--accent)]" />
          <span>Live Telemetry Event Log</span>
        </div>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">
          {events.length} Telemetry Packets
        </span>
      </div>

      <div
        className="p-3 space-y-2 overflow-y-auto font-mono text-xs bg-[var(--code-surface)]"
        style={{ maxHeight }}
        aria-live="polite"
      >
        {events.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic">
            Awaiting telemetry stream events from orchestrator...
          </div>
        ) : (
          events.map((evt, idx) => {
            const time = evt.timestamp
              ? new Date(evt.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--";

            return (
              <div
                key={evt.event_id || idx}
                className="p-2.5 rounded-[var(--radius-xs)] bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-start justify-between gap-3 animate-in fade-in duration-150"
              >
                <div className="flex items-start gap-2.5 truncate">
                  <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 pt-0.5">
                    [{time}]
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-[var(--text-primary)] mr-2">
                      {evt.node_id}:
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {evt.message}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={
                    evt.status === "PASS" || evt.status === "SUCCESS" || evt.status === "HEALED"
                      ? "verified"
                      : evt.status === "FAIL" || evt.status === "ERROR"
                      ? "broken"
                      : "information"
                  }
                  className="shrink-0 text-[10px]"
                >
                  {evt.status}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
