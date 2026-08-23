"use client";

import { Play, Zap, ExternalLink, AlertCircle, Clock, Trash2, ChevronRight, BarChart2, Settings, Database, Wifi, WifiOff, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Target {
  id: string;
  name: string;
  url: string;
  domain: string;
  status: string;
  health: number;
  is_demo: boolean;
  last_run?: string;
  monitoring_enabled: boolean;
  schedule: string;
}

interface TargetCardProps {
  target: Target;
  onRun: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  isPrimary?: boolean;
}

export function TargetCard({ target, onRun, onOpen, onDelete, isPrimary }: TargetCardProps) {
  const getStatusConfig = (status: string, health: number) => {
    switch (status) {
      case "HEALTHY": return { label: "Healthy", variant: "badge-verified" as const, icon: <Wifi className="w-3 h-3" /> };
      case "DEGRADED": return { label: "Degraded", variant: "badge-degraded" as const, icon: <Wifi className="w-3 h-3" /> };
      case "FAILED": return { label: "Failed", variant: "badge-broken" as const, icon: <AlertCircle className="w-3 h-3" /> };
      case "RUNNING": return { label: "Running", variant: "badge-degraded" as const, icon: <Loader2 className="w-3 h-3 animate-spin" /> };
      default: return { label: status, variant: "badge-neutral" as const, icon: <Clock className="w-3 h-3" /> };
    }
  };

  const config = getStatusConfig(target.status, target.health);
  const lastRun = target.last_run ? format(new Date(target.last_run), "MMM d, HH:mm") : "Never";

  return (
    <article
      className={`card card-hover flex flex-col ${isPrimary ? "col-span-12 lg:col-span-7" : "col-span-12 lg:col-span-5"} animate-fade-in`}
      style={isPrimary ? { gridColumn: "span 12 / span 7" } : { gridColumn: "span 12 / span 5" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2 border-b border-line">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-md bg-surface-sunken flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-heading-md text-ink truncate">{target.name}</h3>
              {target.is_demo && (
                <span className="badge badge-simulated">SIMULATED TARGET</span>
              )}
            </div>
            <p className="text-body-sm text-ink-muted truncate font-mono-data">{target.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <button
            onClick={() => onOpen(target.id)}
            className="btn btn-ghost btn-sm p-2"
            aria-label={`Open ${target.name} workspace`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status + Health */}
      <div className="p-4 border-b border-line">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className={`badge ${config.variant} flex items-center gap-1`}>
            {config.icon}
            {config.label}
          </span>
          <div className="flex items-center gap-2 text-body-sm text-ink-muted">
            <span className="font-mono-data">{Math.round(target.health * 100)}% health</span>
            <span className="w-px h-4 bg-line" aria-hidden="true" />
            <span>Last run: {lastRun}</span>
          </div>
        </div>

        {/* Health trend placeholder - would use recharts sparkline */}
        <div className="h-12 bg-surface-sunken rounded-sm flex items-end justify-around p-2">
          {[0.8, 0.85, 0.9, 0.75, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0].map((h, i) => (
            <div
              key={i}
              className="w-6 rounded-t-xs transition-all duration-300"
              style={{
                height: `${h * 100}%`,
                backgroundColor: h >= 0.9 ? "var(--verified)" : h >= 0.7 ? "var(--degraded)" : "var(--broken)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRun(target.id)}
            disabled={target.status === "RUNNING"}
            className="btn btn-primary flex-1 sm:flex-none"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
          <button
            onClick={() => onOpen(target.id)}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            <BarChart2 className="w-4 h-4" />
            Records
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpen(target.id)}
            className="btn btn-ghost btn-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(target.id)}
            className="btn btn-ghost btn-sm text-broken hover:text-broken"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}