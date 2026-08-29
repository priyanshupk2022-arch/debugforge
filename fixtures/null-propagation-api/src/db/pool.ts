/**
 * Database Connection Pool Implementation
 * 
 * Manages database connection lifecycle and concurrency limits.
 */

import { DbConnection, PoolConfig } from '../types';

export class ConnectionPool {
  private maxConnections: number;
  private acquireTimeoutMs: number;
  private activeConnections: number = 0;
  public simulateTimeout: boolean = false;

  constructor(config: PoolConfig = { maxConnections: 5, acquireTimeoutMs: 1000 }) {
    this.maxConnections = config.maxConnections;
    this.acquireTimeoutMs = config.acquireTimeoutMs;
    this.simulateTimeout = config.simulateTimeout ?? false;
  }

  /**
   * Acquire a database connection from the pool.
   * 
   * INFECTION ORIGIN (Root Cause):
   * When the connection pool is exhausted or simulated timeout occurs,
   * this method returns `null` instead of throwing a PoolTimeoutException.
   * This silent failure cascades downstream through inventory and pricing.
   */
  async acquireConnection(timeoutMs?: number): Promise<DbConnection | null> {
    const timeout = timeoutMs ?? this.acquireTimeoutMs;

    // Simulate connection pool exhaustion or network jitter timeout
    if (this.simulateTimeout || this.activeConnections >= this.maxConnections) {
      // INFECTION ORIGIN: Silent null return instead of throwing
      return null;
    }

    this.activeConnections++;
    const connectionId = `conn_${Math.random().toString(36).substring(2, 9)}`;

    const connection: DbConnection = {
      id: connectionId,
      isHealthy: true,
      query: async <T = any>(sql: string, params?: unknown[]): Promise<T[]> => {
        // Simulated database query handler with mock catalog
        return [] as T[];
      },
      release: () => {
        if (this.activeConnections > 0) {
          this.activeConnections--;
        }
      },
    };

    return connection;
  }

  getActiveCount(): number {
    return this.activeConnections;
  }

  setSimulateTimeout(value: boolean): void {
    this.simulateTimeout = value;
  }
}
