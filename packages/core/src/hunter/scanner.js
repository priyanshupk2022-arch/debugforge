"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VulnerabilityHunter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const typescript_1 = __importDefault(require("typescript"));
class VulnerabilityHunter {
    scanDirectory(directoryPath) {
        const reports = [];
        const files = this.getAllSourceFiles(directoryPath);
        for (const file of files) {
            const fileReports = this.scanFile(file);
            reports.push(...fileReports);
        }
        return reports;
    }
    scanFile(filePath) {
        const reports = [];
        const content = fs.readFileSync(filePath, 'utf8');
        const sourceFile = typescript_1.default.createSourceFile(filePath, content, typescript_1.default.ScriptTarget.Latest, true);
        const visit = (node) => {
            // Rule 1: Command Injection (child_process.exec / eval)
            if (typescript_1.default.isCallExpression(node)) {
                const text = node.expression.getText(sourceFile);
                if (text === 'exec' || text === 'child_process.exec' || text === 'eval') {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    const snippet = node.getText(sourceFile);
                    const exploitSpec = {
                        protocol: 'HTTP_POST',
                        endpoint: '/api/report',
                        bodyPayload: { command: '; cat /etc/passwd' },
                        expectedProofSignature: 'root:x:0:0',
                    };
                    const goldenInputs = [
                        {
                            description: 'Standard safe report generation',
                            protocol: 'HTTP_POST',
                            endpoint: '/api/report',
                            bodyPayload: { command: '--summary-only' },
                            expectedStatusCode: 200,
                            expectedResponseSubstring: 'Report generated',
                        },
                    ];
                    reports.push({
                        id: `vuln_ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        category: 'COMMAND_INJECTION',
                        cwe: 'CWE-78: OS Command Injection',
                        cvssBaseScore: 9.8,
                        vulnerableFilePath: filePath,
                        vulnerableLineNumber: line + 1,
                        sinkIdentifier: text,
                        codeSnippet: snippet,
                        exploitPayloadSpec: exploitSpec,
                        goldenValidInputs: goldenInputs,
                        status: 'SUSPECTED',
                    });
                }
                // Rule 3: Broken Authentication / IDOR (jwt.decode without verify)
                if (text === 'jwt.decode' || text === 'decode') {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    const snippet = node.getText(sourceFile);
                    const exploitSpec = {
                        protocol: 'HTTP_GET',
                        endpoint: '/api/user/profile',
                        headers: { Authorization: 'Bearer forged.unsigned.token' },
                        expectedProofSignature: 'admin_dashboard_unlocked',
                    };
                    const goldenInputs = [
                        {
                            description: 'Valid signed JWT token',
                            protocol: 'HTTP_GET',
                            endpoint: '/api/user/profile',
                            headers: { Authorization: 'Bearer valid.signed.jwt.token' },
                            expectedStatusCode: 200,
                            expectedResponseSubstring: 'profile',
                        },
                    ];
                    reports.push({
                        id: `vuln_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        category: 'BROKEN_AUTH_IDOR',
                        cwe: 'CWE-287: Broken Authentication / IDOR',
                        cvssBaseScore: 8.8,
                        vulnerableFilePath: filePath,
                        vulnerableLineNumber: line + 1,
                        sinkIdentifier: text,
                        codeSnippet: snippet,
                        exploitPayloadSpec: exploitSpec,
                        goldenValidInputs: goldenInputs,
                        status: 'SUSPECTED',
                    });
                }
            }
            // Rule 2: Prototype Pollution (Unsafe recursive deep-merge / dynamic bracket assign)
            if (typescript_1.default.isFunctionDeclaration(node) || typescript_1.default.isFunctionExpression(node) || typescript_1.default.isArrowFunction(node)) {
                const fullFnText = node.getText(sourceFile);
                if ((fullFnText.includes('target[key]') && fullFnText.includes('source[key]')) &&
                    !fullFnText.includes('__proto__') &&
                    !fullFnText.includes('prototype')) {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    const exploitSpec = {
                        protocol: 'HTTP_POST',
                        endpoint: '/api/config/update',
                        bodyPayload: { __proto__: { admin: true } },
                        expectedProofSignature: 'POLLUTED_ADMIN_FLAG',
                    };
                    const goldenInputs = [
                        {
                            description: 'Standard valid profile config update',
                            protocol: 'HTTP_POST',
                            endpoint: '/api/config/update',
                            bodyPayload: { theme: 'dark', notifications: true },
                            expectedStatusCode: 200,
                            expectedResponseSubstring: 'Config updated',
                        },
                    ];
                    reports.push({
                        id: `vuln_pp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        category: 'PROTOTYPE_POLLUTION',
                        cwe: 'CWE-1321: Prototype Pollution',
                        cvssBaseScore: 7.5,
                        vulnerableFilePath: filePath,
                        vulnerableLineNumber: line + 1,
                        sinkIdentifier: 'unsafe_object_merge',
                        codeSnippet: fullFnText.split('\n')[0],
                        exploitPayloadSpec: exploitSpec,
                        goldenValidInputs: goldenInputs,
                        status: 'SUSPECTED',
                    });
                }
            }
            typescript_1.default.forEachChild(node, visit);
        };
        visit(sourceFile);
        return reports;
    }
    getAllSourceFiles(dir) {
        let files = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
                    files = files.concat(this.getAllSourceFiles(fullPath));
                }
            }
            else if (entry.isFile() &&
                (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
exports.VulnerabilityHunter = VulnerabilityHunter;
