import React, { useState } from "react";
import { ShieldAlert, Trash2, Info, Check } from "lucide-react";
import { TargetEntity } from "../../lib/api";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface SettingsTabProps {
  target: TargetEntity;
  onDeleteTarget: () => Promise<void>;
  onSimulateChaos: () => Promise<any>;
}

export function SettingsTab({
  target,
  onDeleteTarget,
  onSimulateChaos,
}: SettingsTabProps) {
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [chaosMutated, setChaosMutated] = useState(false);

  const handleChaos = async () => {
    setIsMutating(true);
    try {
      await onSimulateChaos();
      setChaosMutated(true);
      setTimeout(() => setChaosMutated(false), 3000);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Monitoring Settings (Honest disclosure) */}
      <div className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] space-y-4">
        <h3 className="font-display font-semibold text-base text-[var(--text-primary)]">
          Autonomous Monitoring & Schedule
        </h3>

        <div className="p-4 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-primary)] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-[var(--text-primary)]">
              Scheduled Extraction Polling
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Enable background recurring extraction jobs.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-[var(--information)] font-mono mt-1">
              <Info className="w-3.5 h-3.5" />
              <span>Status: Saved, not scheduled (no background executor daemon running)</span>
            </div>
          </div>

          <Switch
            checked={monitoringEnabled}
            onCheckedChange={setMonitoringEnabled}
          />
        </div>
      </div>

      {/* Chaos Control (Demo only) */}
      {target.is_demo && (
        <div className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--broken)]" />
            <h3 className="font-display font-semibold text-base text-[var(--text-primary)]">
              Chaos Injection Sandbox
            </h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Mutate the target DOM layout via the Transparent Chaos Proxy to intentionally break CSS selectors and test Sentinel-Chain's autonomous self-healing recovery loop.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={handleChaos}
            disabled={isMutating}
            className="text-[var(--broken)] border-[var(--broken-border)] hover:bg-[var(--broken-tint)]"
          >
            {isMutating ? "Mutating DOM..." : chaosMutated ? "DOM Break Injected!" : "Inject DOM Mutation Break"}
          </Button>
        </div>
      )}

      {/* Danger Zone: Delete Target */}
      <div className="p-6 rounded-[var(--radius-md)] border border-[var(--broken-border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] space-y-4">
        <div className="flex items-center gap-2 text-[var(--broken)]">
          <Trash2 className="w-5 h-5" />
          <h3 className="font-display font-semibold text-base">
            Danger Zone
          </h3>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Permanently delete this target along with its schemas, inspection caches, and harvested records. This action cannot be undone.
        </p>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          Delete Target
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Target Entity?"
        description={`Are you sure you want to delete ${target.name}? All associated schemas and records in SQLite will be permanently removed.`}
        variant="destructive"
        confirmLabel="Delete Target"
        isLoading={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true);
          await onDeleteTarget();
        }}
      />
    </div>
  );
}
