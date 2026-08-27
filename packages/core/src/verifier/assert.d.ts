import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';
export interface VerifierConfig {
    port?: number;
    mockTestSuitePass?: boolean;
}
export declare class ImmunizationVerifier {
    private config;
    constructor(config?: VerifierConfig);
    verifyPatch(vulnerability: VulnerabilityReport, candidatePatch: SecurityPatchNode): Promise<SecurityPatchNode>;
    private probeExploitBlockage;
    private probeGoldenInputs;
}
