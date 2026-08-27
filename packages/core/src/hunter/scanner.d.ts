import { VulnerabilityReport } from '../types/index.js';
export declare class VulnerabilityHunter {
    scanDirectory(directoryPath: string): VulnerabilityReport[];
    scanFile(filePath: string): VulnerabilityReport[];
    private getAllSourceFiles;
}
