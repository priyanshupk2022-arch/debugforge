import React from "react";
import { EvidenceNode, NodeState } from "./EvidenceNode";

export const SIGNAL_NODES = [
  { id: "RUN", label: "1. Run" },
  { id: "BROKEN", label: "2. Broken" },
  { id: "EVIDENCE", label: "3. Evidence" },
  { id: "DIAGNOSIS", label: "4. Diagnosis" },
  { id: "PROPOSAL", label: "5. Proposal" },
  { id: "GATE", label: "6. Gate" },
  { id: "HEAL", label: "7. Heal" },
  { id: "RE_RUN", label: "8. Re-Run" },
  { id: "VERIFIED", label: "9. Verified" },
];

interface SignalPathProps {
  nodeStates: Record<string, NodeState>;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

export function SignalPath({
  nodeStates,
  selectedNodeId,
  onSelectNode,
}: SignalPathProps) {
  return (
    <div className="w-full overflow-x-auto py-7 px-6 rounded-xl border border-white/[0.08] bg-[#0E131F]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative">
      {/* Background Cyber Glowing Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-emerald-500/5 pointer-events-none rounded-xl" />

      <div className="min-w-[860px] flex items-center justify-between relative px-4">
        {/* Animated Glowing Laser Connector behind nodes */}
        <div className="absolute left-8 right-8 top-7 h-[2px] bg-gradient-to-r from-indigo-500/30 via-purple-500/40 to-emerald-500/30 -z-0" />

        {SIGNAL_NODES.map((node, index) => {
          const state: NodeState = nodeStates[node.id] || "UPCOMING";
          const isSelected = selectedNodeId === node.id;

          return (
            <div key={node.id} className="relative z-10 flex items-center">
              <EvidenceNode
                id={node.id}
                label={node.label}
                state={state}
                isSelected={isSelected}
                onClick={() => onSelectNode(node.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
