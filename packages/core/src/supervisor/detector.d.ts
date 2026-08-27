import { SecurityPatchNode, SecuritySupervisorAlert } from '../types/index.js';
export declare class SecuritySupervisor {
    checkTrajectory(patches: SecurityPatchNode[]): SecuritySupervisorAlert | null;
    private levenshtein;
}
