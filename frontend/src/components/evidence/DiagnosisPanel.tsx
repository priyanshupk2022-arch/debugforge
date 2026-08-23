import React from "react";
import { Sparkles, Brain, Cpu } from "lucide-react";
import { RepairProposal } from "../../lib/api";
import { Badge } from "../ui/badge";

interface DiagnosisPanelProps {
  proposal?: RepairProposal;
  rawDiagnosis?: string;
}

export function DiagnosisPanel({ proposal, rawDiagnosis }: DiagnosisPanelProps) {
  const isAI = proposal?.source_type === "AI_GENERATED" || !proposal?.source_type;
  const modelUsed = proposal?.model_used || "gemini-3.7-flash";

  return (
    <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--accent)]" />
          <h4 className="font-display font-semibold text-sm text-[var(--text-primary)]">
            AI Diagnosis & Root-Cause Analysis
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="information" dot>
            {isAI ? "Live AI Reasoning" : "Rule Fallback"}
          </Badge>
          <span className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--surface-sunken)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
            {modelUsed}
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] leading-relaxed space-y-2">
        <div className="font-medium text-[var(--text-secondary)] font-mono text-[10px] uppercase">
          Diagnosis Summary:
        </div>
        <p>
          {proposal?.diagnosis || rawDiagnosis || "Analyzing DOM structure change between baseline and current layout snapshot."}
        </p>
      </div>

      <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 font-mono">
        <Cpu className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <span>
          {isAI
            ? "Gemini diagnosed this failure by cross-referencing broken CSS selectors against mutated HTML AST nodes."
            : "Rule-based fallback selector deduction — no live model inference invoked."}
        </span>
      </div>
    </div>
  );
}
