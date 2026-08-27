import { DatabaseSync } from 'node:sqlite';
import * as path from 'path';
import * as fs from 'fs';
import { ZeroShieldState, VulnerabilityReport, SecurityPatchNode } from '../types/index.js';

export interface AuditTrailEntry {
  id: number;
  sessionId: string;
  timestamp: number;
  eventType: string;
  actor: string;
  details: Record<string, unknown>;
}

export interface SessionStoreConfig {
  dbPath?: string;
  inMemory?: boolean;
}

export class ZeroShieldSessionStore {
  private db: DatabaseSync;
  private isClosed = false;

  constructor(config: SessionStoreConfig = {}) {
    if (config.inMemory || !config.dbPath) {
      this.db = new DatabaseSync(':memory:');
    } else {
      const dir = path.dirname(config.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = new DatabaseSync(config.dbPath);
      // Enable WAL mode for high concurrency and audit trail durability
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
    }

    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        target_repo_path TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        active_vulnerability_index INTEGER NOT NULL DEFAULT 0,
        daytona_sandbox_id TEXT,
        sandbox_port INTEGER,
        sandbox_ready INTEGER NOT NULL DEFAULT 0,
        current_patch_iteration INTEGER NOT NULL DEFAULT 0,
        max_iterations INTEGER NOT NULL DEFAULT 3,
        hitl_approval_token TEXT,
        hitl_status TEXT NOT NULL DEFAULT 'PENDING',
        generated_pull_request_url TEXT,
        discovered_sinks_json TEXT NOT NULL DEFAULT '[]',
        candidate_patches_json TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_trails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        details_json TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS context_pointers (
        session_id TEXT NOT NULL,
        key_name TEXT NOT NULL,
        value_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(session_id, key_name),
        FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_trails(session_id);
      CREATE INDEX IF NOT EXISTS idx_context_session ON context_pointers(session_id);
    `);
  }

  public createSession(
    sessionId: string,
    targetRepoPath: string,
    options: {
      maxIterations?: number;
      discoveredSinks?: VulnerabilityReport[];
      daytonaSandboxId?: string;
      sandboxPort?: number;
    } = {}
  ): ZeroShieldState {
    const now = Date.now();
    const state: ZeroShieldState = {
      sessionId,
      targetRepoPath,
      startTime: now,
      discoveredSinks: options.discoveredSinks || [],
      activeVulnerabilityIndex: 0,
      daytonaSandboxId: options.daytonaSandboxId,
      sandboxPort: options.sandboxPort || 8080,
      sandboxReady: false,
      currentPatchIteration: 0,
      maxIterations: options.maxIterations || 3,
      candidatePatches: [],
      hitlStatus: 'PENDING',
    };

    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        session_id, target_repo_path, start_time, active_vulnerability_index,
        daytona_sandbox_id, sandbox_port, sandbox_ready, current_patch_iteration,
        max_iterations, hitl_approval_token, hitl_status, generated_pull_request_url,
        discovered_sinks_json, candidate_patches_json, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    stmt.run(
      state.sessionId,
      state.targetRepoPath,
      state.startTime,
      state.activeVulnerabilityIndex,
      state.daytonaSandboxId || null,
      state.sandboxPort || 8080,
      state.sandboxReady ? 1 : 0,
      state.currentPatchIteration,
      state.maxIterations,
      state.hitlApprovalToken || null,
      state.hitlStatus,
      state.generatedPullRequestUrl || null,
      JSON.stringify(state.discoveredSinks),
      JSON.stringify(state.candidatePatches),
      now,
      now
    );

    this.recordAuditTrail({
      sessionId,
      eventType: 'SESSION_INITIALIZED',
      actor: 'ZeroShieldSessionStore',
      details: { targetRepoPath, maxIterations: state.maxIterations },
    });

    return state;
  }

  public getSession(sessionId: string): ZeroShieldState | null {
    const stmt = this.db.prepare(`SELECT * FROM sessions WHERE session_id = ?`);
    const row = stmt.get(sessionId) as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      sessionId: row.session_id as string,
      targetRepoPath: row.target_repo_path as string,
      startTime: Number(row.start_time),
      discoveredSinks: JSON.parse((row.discovered_sinks_json as string) || '[]') as VulnerabilityReport[],
      activeVulnerabilityIndex: Number(row.active_vulnerability_index),
      daytonaSandboxId: (row.daytona_sandbox_id as string) || undefined,
      sandboxPort: row.sandbox_port ? Number(row.sandbox_port) : undefined,
      sandboxReady: Boolean(row.sandbox_ready),
      currentPatchIteration: Number(row.current_patch_iteration),
      maxIterations: Number(row.max_iterations),
      candidatePatches: JSON.parse((row.candidate_patches_json as string) || '[]') as SecurityPatchNode[],
      hitlApprovalToken: (row.hitl_approval_token as string) || undefined,
      hitlStatus: row.hitl_status as 'PENDING' | 'APPROVED' | 'REJECTED',
      generatedPullRequestUrl: (row.generated_pull_request_url as string) || undefined,
    };
  }

  public saveSession(state: ZeroShieldState): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        session_id, target_repo_path, start_time, active_vulnerability_index,
        daytona_sandbox_id, sandbox_port, sandbox_ready, current_patch_iteration,
        max_iterations, hitl_approval_token, hitl_status, generated_pull_request_url,
        discovered_sinks_json, candidate_patches_json, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
      ON CONFLICT(session_id) DO UPDATE SET
        target_repo_path = excluded.target_repo_path,
        start_time = excluded.start_time,
        active_vulnerability_index = excluded.active_vulnerability_index,
        daytona_sandbox_id = excluded.daytona_sandbox_id,
        sandbox_port = excluded.sandbox_port,
        sandbox_ready = excluded.sandbox_ready,
        current_patch_iteration = excluded.current_patch_iteration,
        max_iterations = excluded.max_iterations,
        hitl_approval_token = excluded.hitl_approval_token,
        hitl_status = excluded.hitl_status,
        generated_pull_request_url = excluded.generated_pull_request_url,
        discovered_sinks_json = excluded.discovered_sinks_json,
        candidate_patches_json = excluded.candidate_patches_json,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      state.sessionId,
      state.targetRepoPath,
      state.startTime,
      state.activeVulnerabilityIndex,
      state.daytonaSandboxId || null,
      state.sandboxPort || 8080,
      state.sandboxReady ? 1 : 0,
      state.currentPatchIteration,
      state.maxIterations,
      state.hitlApprovalToken || null,
      state.hitlStatus,
      state.generatedPullRequestUrl || null,
      JSON.stringify(state.discoveredSinks),
      JSON.stringify(state.candidatePatches),
      now,
      now
    );
  }

  public listSessions(): ZeroShieldState[] {
    const stmt = this.db.prepare(`SELECT * FROM sessions ORDER BY created_at DESC`);
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map(row => ({
      sessionId: row.session_id as string,
      targetRepoPath: row.target_repo_path as string,
      startTime: Number(row.start_time),
      discoveredSinks: JSON.parse((row.discovered_sinks_json as string) || '[]') as VulnerabilityReport[],
      activeVulnerabilityIndex: Number(row.active_vulnerability_index),
      daytonaSandboxId: (row.daytona_sandbox_id as string) || undefined,
      sandboxPort: row.sandbox_port ? Number(row.sandbox_port) : undefined,
      sandboxReady: Boolean(row.sandbox_ready),
      currentPatchIteration: Number(row.current_patch_iteration),
      maxIterations: Number(row.max_iterations),
      candidatePatches: JSON.parse((row.candidate_patches_json as string) || '[]') as SecurityPatchNode[],
      hitlApprovalToken: (row.hitl_approval_token as string) || undefined,
      hitlStatus: row.hitl_status as 'PENDING' | 'APPROVED' | 'REJECTED',
      generatedPullRequestUrl: (row.generated_pull_request_url as string) || undefined,
    }));
  }

  public deleteSession(sessionId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM sessions WHERE session_id = ?`);
    const result = stmt.run(sessionId);
    return Number(result.changes) > 0;
  }

  public recordAuditTrail(entry: {
    sessionId: string;
    eventType: string;
    actor: string;
    details: Record<string, unknown> | string;
  }): void {
    const detailsJson = typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details);
    const stmt = this.db.prepare(`
      INSERT INTO audit_trails (session_id, timestamp, event_type, actor, details_json)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(entry.sessionId, Date.now(), entry.eventType, entry.actor, detailsJson);
  }

  public getAuditTrail(sessionId: string): AuditTrailEntry[] {
    const stmt = this.db.prepare(`
      SELECT id, session_id, timestamp, event_type, actor, details_json
      FROM audit_trails
      WHERE session_id = ?
      ORDER BY id ASC
    `);
    const rows = stmt.all(sessionId) as Record<string, unknown>[];
    return rows.map(row => ({
      id: Number(row.id),
      sessionId: row.session_id as string,
      timestamp: Number(row.timestamp),
      eventType: row.event_type as string,
      actor: row.actor as string,
      details: JSON.parse((row.details_json as string) || '{}'),
    }));
  }

  public setContextPointer(sessionId: string, keyName: string, value: unknown): void {
    const now = Date.now();
    const valueJson = JSON.stringify(value);
    const stmt = this.db.prepare(`
      INSERT INTO context_pointers (session_id, key_name, value_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(session_id, key_name) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(sessionId, keyName, valueJson, now);
  }

  public getContextPointer<T = unknown>(sessionId: string, keyName: string): T | null {
    const stmt = this.db.prepare(`
      SELECT value_json FROM context_pointers WHERE session_id = ? AND key_name = ?
    `);
    const row = stmt.get(sessionId, keyName) as { value_json: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.value_json) as T;
  }

  public getAllContextPointers(sessionId: string): Record<string, unknown> {
    const stmt = this.db.prepare(`
      SELECT key_name, value_json FROM context_pointers WHERE session_id = ?
    `);
    const rows = stmt.all(sessionId) as { key_name: string; value_json: string }[];
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key_name] = JSON.parse(row.value_json);
    }
    return result;
  }

  public close(): void {
    if (!this.isClosed) {
      this.db.close();
      this.isClosed = true;
    }
  }
}
