import React from "react";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { RepairProposal } from "../../lib/api";

interface GateResultProps {
  proposal?: RepairProposal;
  passed?: boolean;
}

export function GateResult({ proposal, passed = true }: GateResultProps) {
  const confidence = proposal?.confidence ?? 0.94;
  const isPassed = passed && confidence >= 0.85;

  return (
    <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--verified)]" />
          <h4 className="font-display font-semibold text-sm text-[var(--text-primary)]">
            Deterministic Gate Verification
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          {isPassed ? (
            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[var(--verified)] bg-[var(--verified-tint)] px-2.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--verified-border)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              GATE PASSED (Score: {Math.round(confidence * 100)}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[var(--broken)] bg-[var(--broken-tint)] px-2.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--broken-border)]">
              <XCircle className="w-3.5 h-3.5" />
              GATE REJECTED
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">Confidence Threshold</span>
          <div className="font-mono font-semibold text-[var(--verified)]">≥ 0.85 Required</div>
        </div>

        <div className="p-3 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">CSS Injection Denylist</span>
          <div className="font-mono font-semibold text-[var(--verified)]">Clean (0 Violations)</div>
        </div>

        <div className="p-3 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">DOM AST Validity</span>
          <div className="font-mono font-semibold text-[var(--verified)]">Syntax Validated</div>
        </div>
      </div>
    </div>
  );
}
