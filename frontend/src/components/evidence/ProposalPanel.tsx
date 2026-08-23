import React from "react";
import { Sparkles, Target } from "lucide-react";
import { RepairProposal } from "../../lib/api";
import { ConfidenceGauge } from "./ConfidenceGauge";

interface ProposalPanelProps {
  proposal?: RepairProposal;
}

export function ProposalPanel({ proposal }: ProposalPanelProps) {
  const confidence = proposal?.confidence ?? 0.94;
  const targetField = proposal?.target_field || "vulnerability_title";

  return (
    <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <h4 className="font-display font-semibold text-sm text-[var(--text-primary)]">
            Synthesized Repair Proposal
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)] font-mono uppercase">Target Field:</span>
          <span className="font-mono text-xs font-semibold text-[var(--accent)] bg-[var(--selection-fill)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--accent)]">
            {targetField}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 p-4 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)]">
        <ConfidenceGauge confidence={confidence} size={70} />

        <div className="space-y-1">
          <div className="text-xs font-semibold text-[var(--text-primary)]">
            Synthesized Selector Candidate
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Confidence score reflects element uniqueness, hierarchy depth stability, and ancestor class resilience.
          </p>
        </div>
      </div>
    </div>
  );
}
