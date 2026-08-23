import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { ConnectionState } from "../../hooks/useTelemetryStream";

interface ConnectionBannerProps {
  state: ConnectionState;
  onReconnect?: () => void;
}

export function ConnectionBanner({ state, onReconnect }: ConnectionBannerProps) {
  if (state === "connected") return null;

  return (
    <div
      role="status"
      className="w-full bg-[var(--broken-tint)] border-b border-[var(--broken-border)] px-4 py-2 text-xs flex items-center justify-between text-[var(--broken)] select-none animate-in fade-in"
    >
      <div className="flex items-center gap-2 font-mono">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>
          {state === "reconnecting"
            ? "Reconnecting to live telemetry stream..."
            : "Telemetry stream disconnected. Displaying cached state."}
        </span>
      </div>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="inline-flex items-center gap-1 font-medium hover:underline text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          Reconnect
        </button>
      )}
    </div>
  );
}
