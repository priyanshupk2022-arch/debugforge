"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecuritySupervisor = void 0;
class SecuritySupervisor {
    checkTrajectory(patches) {
        if (patches.length < 2)
            return null;
        const last = patches[patches.length - 1];
        const prev = patches[patches.length - 2];
        // Compute Levenshtein distance on consecutive diffs
        const distance = this.levenshtein(last.patchDiff, prev.patchDiff);
        const maxLen = Math.max(last.patchDiff.length, prev.patchDiff.length);
        const similarity = 1 - distance / (maxLen || 1);
        // If diffs are > 90% identical and both failed, it's a cyclic syntax deadlock
        if (similarity > 0.9) {
            return {
                alertId: `alert_${Date.now()}`,
                type: 'CYCLIC_SYNTAX_LOOP',
                explanation: 'Consecutive patches are oscillating with trivial whitespace/syntax tweaks without addressing the root sink.',
                recommendedPivot: 'Halt string regex tweaks. Pivot immediately to AST parameterized execution (execFile) with strict Zod validation.',
            };
        }
        if (patches.length >= 3) {
            return {
                alertId: `alert_${Date.now()}`,
                type: 'STAGNATION_LOOP',
                explanation: 'Reached hard cap of 3 failed repair iterations for this vulnerability.',
                recommendedPivot: 'Backtrack to parent lineage node and flag for human review.',
            };
        }
        return null;
    }
    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++)
            matrix[i] = [i];
        for (let j = 0; j <= a.length; j++)
            matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}
exports.SecuritySupervisor = SecuritySupervisor;
