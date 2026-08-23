"use client";

import { ChevronDown, Command, ExternalLink, Loader2, Wifi, WifiOff, Shield, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export function TopBar({ onAddTarget, onCommandPalette }: { onAddTarget: () => void; onCommandPalette: () => void }) {
  const [bdStatus, setBdStatus] = useState<"connected" | "degraded" | "offline">("connected");
  const [geminiStatus, setGeminiStatus] = useState<"connected" | "degraded" | "offline">("connected");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/scraper/health");
        const data = await res.json();
        setBdStatus(data.bright_data_key_configured ? "connected" : "offline");
        setGeminiStatus(data.gemini_key_configured ? "connected" : "offline");
      } catch {
        setBdStatus("offline");
        setGeminiStatus("offline");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatusChip = ({ label, status }: { label: string; status: typeof bdStatus }) => (
    <span className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-surface border border-line text-body-sm">
      <span className={`status-dot ${status}`} aria-hidden="true" />
      <span className="font-label">{label}</span>
      <span className={`badge ${status === "connected" ? "badge-verified" : status === "degraded" ? "badge-degraded" : "badge-neutral"}`}>
        {status === "connected" ? "Live" : status === "degraded" ? "Degraded" : "Offline"}
      </span>
    </span>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-line">
      <div className="container-workspace flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="font-display text-heading-lg text-brand-ink tracking-tight">
            Sentinel-Chain
          </span>
          <span className="hidden sm:block w-px h-6 bg-line" aria-hidden="true" />
        </div>

        {/* Live status chips */}
        <div className="hidden md:flex items-center gap-3">
          <StatusChip label="Bright Data" status={bdStatus} />
          <StatusChip label="Gemini" status={geminiStatus} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCommandPalette}
            className="btn btn-ghost btn-sm flex items-center gap-2 px-3"
            aria-label="Open command palette (⌘K)"
          >
            <Command className="w-4 h-4" />
            <kbd className="hidden sm:inline-flex font-mono-data text-caption px-1.5 py-0.5 rounded-xs bg-surface-sunken border border-line">
              ⌘K
            </kbd>
          </button>
          <button onClick={onAddTarget} className="btn btn-primary btn-sm">
            Add Target
          </button>
        </div>
      </div>
    </header>
  );
}