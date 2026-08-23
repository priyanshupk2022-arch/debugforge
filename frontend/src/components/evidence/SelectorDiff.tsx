import React from "react";
import { ArrowRight, Code2 } from "lucide-react";
import { RepairProposal } from "../../lib/api";

interface SelectorDiffProps {
  proposal?: RepairProposal;
  brokenSelector?: string;
  proposedSelector?: string;
}

export function SelectorDiff({
  proposal,
  brokenSelector,
  proposedSelector,
}: SelectorDiffProps) {
  const broken =
    brokenSelector ||
    proposal?.broken_selector ||
    "table.cve-grid td.title a";
  const proposed =
    proposedSelector ||
    proposal?.proposed_selector ||
    "div.advisory-row span.advisory-title a";

  return (
    <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-[var(--accent)]" />
        <h4 className="font-display font-semibold text-sm text-[var(--text-primary)]">
          Selector Diff & Mutation Delta
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Broken Selector (Red) */}
        <div className="p-3.5 rounded-[var(--radius-xs)] bg-[var(--broken-tint)] border border-[var(--broken-border)] space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-[var(--broken)] font-semibold flex items-center justify-between">
            <span>- Broken Prior Selector</span>
            <span className="text-[9px]">FAIL</span>
          </div>
          <div className="p-2 rounded-[var(--radius-xs)] bg-[var(--bg-elevated)] font-mono text-xs text-[var(--broken)] border border-[var(--broken-border)] break-all select-all">
            {broken}
          </div>
        </div>

        {/* Proposed Selector (Green) */}
        <div className="p-3.5 rounded-[var(--radius-xs)] bg-[var(--verified-tint)] border border-[var(--verified-border)] space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-[var(--verified)] font-semibold flex items-center justify-between">
            <span>+ Proposed Self-Healed Selector</span>
            <span className="text-[9px]">HEALED</span>
          </div>
          <div className="p-2 rounded-[var(--radius-xs)] bg-[var(--bg-elevated)] font-mono text-xs text-[var(--verified)] border border-[var(--verified-border)] break-all select-all">
            {proposed}
          </div>
        </div>
      </div>
    </div>
  );
}
