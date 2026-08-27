import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';
export declare class BlueAgentImmunizer {
    synthesizePatch(report: VulnerabilityReport, sourceContent: string): SecurityPatchNode;
    private generateUnifiedDiff;
}
