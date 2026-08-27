import { VulnerabilityHunter } from '../hunter/scanner.js';
import { RedAgentArena, ExploitExecutionResult } from '../redteam/exploit.js';
import { BlueAgentImmunizer } from '../blueteam/patcher.js';
import { ImmunizationVerifier } from '../verifier/assert.js';
import { VulnerabilityReport, SecurityPatchNode } from '../types/index.js';
import { ZeroShieldSessionStore } from './session.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export class TrueForgeMcpServer {
  private sessionStore: ZeroShieldSessionStore;
  private hunter: VulnerabilityHunter;
  private redAgent: RedAgentArena;
  private blueAgent: BlueAgentImmunizer;
  private verifier: ImmunizationVerifier;

  constructor(sessionStore?: ZeroShieldSessionStore) {
    this.sessionStore = sessionStore || new ZeroShieldSessionStore({ inMemory: true });
    this.hunter = new VulnerabilityHunter();
    this.redAgent = new RedAgentArena();
    this.blueAgent = new BlueAgentImmunizer();
    this.verifier = new ImmunizationVerifier();
  }

  public getSessionStore(): ZeroShieldSessionStore {
    return this.sessionStore;
  }

  public getToolDefinitions(): McpToolDefinition[] {
    return [
      {
        name: 'zeroshield_sast_scan',
        description: 'AST-based static analysis scanner to detect CWE-78 (Command Injection), CWE-1321 (Prototype Pollution), and CWE-287 (Broken Auth IDOR) sinks in a target directory or repository.',
        inputSchema: {
          type: 'object',
          properties: {
            targetDir: {
              type: 'string',
              description: 'Absolute or relative filesystem path to the target source directory to scan.',
            },
            sessionId: {
              type: 'string',
              description: 'Optional ZeroShield session ID to associate discovered sinks and persist audit trails.',
            },
          },
          required: ['targetDir'],
        },
      },
      {
        name: 'zeroshield_daytona_exploit',
        description: 'Executes a safe red-team exploit payload in the Daytona sandbox arena to confirm vulnerability proof-of-exploit.',
        inputSchema: {
          type: 'object',
          properties: {
            vulnerability: {
              type: 'object',
              description: 'The vulnerability report containing target endpoint, payload specs, and expected proof signature.',
            },
            port: {
              type: 'number',
              description: 'Target service port for local or sandbox runner (default: 8080).',
            },
            useLocalRunner: {
              type: 'boolean',
              description: 'Whether to use local loopback runner or remote Daytona runner (default: true).',
            },
            sessionId: {
              type: 'string',
              description: 'Optional session ID for audit logging.',
            },
          },
          required: ['vulnerability'],
        },
      },
      {
        name: 'zeroshield_avo_patch',
        description: 'Synthesizes an Automated Vulnerability Optimization (AVO) AST security patch and schema sanitization for the detected vulnerability.',
        inputSchema: {
          type: 'object',
          properties: {
            vulnerability: {
              type: 'object',
              description: 'The vulnerability report to be patched.',
            },
            sourceContent: {
              type: 'string',
              description: 'The raw source code content of the vulnerable file.',
            },
            sessionId: {
              type: 'string',
              description: 'Optional session ID for audit logging.',
            },
          },
          required: ['vulnerability', 'sourceContent'],
        },
      },
      {
        name: 'zeroshield_immunize_verify',
        description: 'Runs the 3-Lock Immunization Verifier ensuring exploit is blocked (400/403), golden legitimate inputs are preserved (200), and test suite passes.',
        inputSchema: {
          type: 'object',
          properties: {
            vulnerability: {
              type: 'object',
              description: 'The target vulnerability report.',
            },
            candidatePatch: {
              type: 'object',
              description: 'The candidate SecurityPatchNode to verify.',
            },
            port: {
              type: 'number',
              description: 'Target service port (default: 8080).',
            },
            mockTestSuitePass: {
              type: 'boolean',
              description: 'Flag to simulate test suite pass/fail state for CI evaluation.',
            },
            sessionId: {
              type: 'string',
              description: 'Optional session ID for updating candidate patch state and audit logs.',
            },
          },
          required: ['vulnerability', 'candidatePatch'],
        },
      },
    ];
  }

  public async executeTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    try {
      switch (name) {
        case 'zeroshield_sast_scan': {
          const targetDir = args.targetDir as string;
          const sessionId = args.sessionId as string | undefined;
          if (!targetDir) {
            return { content: [{ type: 'text', text: 'Error: targetDir is required' }], isError: true };
          }

          const reports = this.hunter.scanDirectory(targetDir);

          if (sessionId) {
            const session = this.sessionStore.getSession(sessionId);
            if (session) {
              session.discoveredSinks = reports;
              this.sessionStore.saveSession(session);
            }
            this.sessionStore.recordAuditTrail({
              sessionId,
              eventType: 'SAST_SCAN_COMPLETED',
              actor: 'zeroshield_sast_scan',
              details: { targetDir, foundCount: reports.length, reports },
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify({ success: true, count: reports.length, reports }, null, 2) }],
          };
        }

        case 'zeroshield_daytona_exploit': {
          const vulnerability = args.vulnerability as VulnerabilityReport;
          const port = (args.port as number) || 8080;
          const useLocalRunner = args.useLocalRunner !== undefined ? Boolean(args.useLocalRunner) : true;
          const sessionId = args.sessionId as string | undefined;

          if (!vulnerability) {
            return { content: [{ type: 'text', text: 'Error: vulnerability is required' }], isError: true };
          }

          const arena = (port === 8080 && useLocalRunner)
            ? this.redAgent
            : new RedAgentArena({ fallbackPort: port, useLocalRunner });
          const exploitResult: ExploitExecutionResult = await arena.executeExploitProof(vulnerability);

          if (sessionId) {
            this.sessionStore.recordAuditTrail({
              sessionId,
              eventType: 'EXPLOIT_PROOF_EXECUTED',
              actor: 'zeroshield_daytona_exploit',
              details: {
                vulnerabilityId: vulnerability.id,
                exploitConfirmed: exploitResult.exploitConfirmed,
                statusCode: exploitResult.statusCode,
                sandboxId: exploitResult.daytonaSandboxId,
              },
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(exploitResult, null, 2) }],
          };
        }

        case 'zeroshield_avo_patch': {
          const vulnerability = args.vulnerability as VulnerabilityReport;
          const sourceContent = args.sourceContent as string;
          const sessionId = args.sessionId as string | undefined;

          if (!vulnerability || sourceContent === undefined) {
            return { content: [{ type: 'text', text: 'Error: vulnerability and sourceContent are required' }], isError: true };
          }

          const patchNode = this.blueAgent.synthesizePatch(vulnerability, sourceContent);

          if (sessionId) {
            const session = this.sessionStore.getSession(sessionId);
            if (session) {
              session.candidatePatches.push(patchNode);
              this.sessionStore.saveSession(session);
            }
            this.sessionStore.recordAuditTrail({
              sessionId,
              eventType: 'PATCH_SYNTHESIZED',
              actor: 'zeroshield_avo_patch',
              details: {
                vulnerabilityId: vulnerability.id,
                patchId: patchNode.id,
                diffLength: patchNode.patchDiff.length,
              },
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(patchNode, null, 2) }],
          };
        }

        case 'zeroshield_immunize_verify': {
          const vulnerability = args.vulnerability as VulnerabilityReport;
          const candidatePatch = args.candidatePatch as SecurityPatchNode;
          const port = (args.port as number) || 8080;
          const mockTestSuitePass = args.mockTestSuitePass !== undefined ? Boolean(args.mockTestSuitePass) : true;
          const sessionId = args.sessionId as string | undefined;

          if (!vulnerability || !candidatePatch) {
            return { content: [{ type: 'text', text: 'Error: vulnerability and candidatePatch are required' }], isError: true };
          }

          const targetVerifier = (port === 8080 && mockTestSuitePass === false)
            ? this.verifier
            : new ImmunizationVerifier({ port, mockTestSuitePass });
          const verifiedPatch = await targetVerifier.verifyPatch(vulnerability, candidatePatch);

          if (sessionId) {
            const session = this.sessionStore.getSession(sessionId);
            if (session) {
              const existingIdx = session.candidatePatches.findIndex(p => p.id === verifiedPatch.id);
              if (existingIdx >= 0) {
                session.candidatePatches[existingIdx] = verifiedPatch;
              } else {
                session.candidatePatches.push(verifiedPatch);
              }
              this.sessionStore.saveSession(session);
            }
            this.sessionStore.recordAuditTrail({
              sessionId,
              eventType: 'IMMUNIZATION_VERIFIED',
              actor: 'zeroshield_immunize_verify',
              details: {
                vulnerabilityId: vulnerability.id,
                patchId: verifiedPatch.id,
                status: verifiedPatch.status,
                resultingCvssScore: verifiedPatch.resultingCvssScore,
                results: verifiedPatch.immunizationResults,
              },
            });
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(verifiedPatch, null, 2) }],
          };
        }

        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: `Tool execution failed: ${errorMessage}` }],
        isError: true,
      };
    }
  }

  public async handleJsonRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (request.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
      };
    }

    switch (request.method) {
      case 'ping':
        return { jsonrpc: '2.0', id: request.id, result: { status: 'pong', timestamp: Date.now() } };

      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'zeroshield-trueforge-mcp',
              version: '1.0.0',
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: this.getToolDefinitions(),
          },
        };

      case 'tools/call': {
        const params = request.params || {};
        const toolName = params.name as string;
        const toolArgs = (params.arguments as Record<string, unknown>) || {};

        if (!toolName) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32602, message: 'Invalid params: name is required for tools/call' },
          };
        }

        const toolResult = await this.executeTool(toolName, toolArgs);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: toolResult,
        };
      }

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: `Method not found: ${request.method}` },
        };
    }
  }
}
