import React from "react";
import { Globe, ArrowRight, Activity, Clock, ShieldCheck, Zap } from "lucide-react";
import { TargetEntity } from "../../lib/api";
import { Badge } from "../ui/badge";
import { HealthTrend } from "./HealthTrend";
import { SpotlightCard } from "../ui/SpotlightCard";
import { BorderBeam } from "../ui/BorderBeam";

interface TargetCardProps {
  target: TargetEntity;
  onSelect: (targetId: string) => void;
}

export function TargetCard({ target, onSelect }: TargetCardProps) {
  const getStatusBadge = () => {
    switch (target.status) {
      case "READY":
        return <Badge variant="verified" dot>Ready</Badge>;
      case "RUNNING":
        return <Badge variant="information" dot>Scraping</Badge>;
      case "HEALING":
        return <Badge variant="degraded" dot>Auto-Healing</Badge>;
      case "DEGRADED":
        return <Badge variant="degraded" dot>Degraded</Badge>;
      case "BROKEN":
        return <Badge variant="broken" dot>Broken</Badge>;
      default:
        return <Badge variant="neutral" dot>{target.status}</Badge>;
    }
  };

  const formattedDate = target.updated_at
    ? new Date(target.updated_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never run";

  return (
    <SpotlightCard
      onClick={() => onSelect(target.id)}
      className="group flex flex-col justify-between p-5.5 cursor-pointer select-none min-h-[190px]"
      spotlightColor={target.is_demo ? "rgba(168, 85, 247, 0.25)" : "rgba(99, 102, 241, 0.2)"}
    >
      {target.is_demo && <BorderBeam size={180} duration={8} colorFrom="#A855F7" colorTo="#6366F1" />}

      <div>
        {/* Top header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:border-indigo-400 transition-colors shadow-[0_0_12px_rgba(99,102,241,0.25)]">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white group-hover:text-indigo-400 transition-colors leading-tight">
                {target.name}
              </h3>
              <div className="text-xs text-neutral-400 font-mono truncate max-w-[200px] mt-0.5">
                {target.domain}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {target.is_demo && (
              <Badge variant="simulated">Demo</Badge>
            )}
            {getStatusBadge()}
          </div>
        </div>

        {/* URL descriptor */}
        <div className="text-xs text-neutral-300 bg-black/40 px-3 py-1.5 rounded-md font-mono truncate border border-white/[0.06] mb-4">
          {target.url}
        </div>
      </div>

      {/* Bottom meta row */}
      <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-neutral-400" />
            <HealthTrend health={target.health} />
          </div>
        </div>

        <div className="w-7 h-7 rounded-full bg-white/[0.05] group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-neutral-400 transition-all duration-200 group-hover:scale-110">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </SpotlightCard>
  );
}
