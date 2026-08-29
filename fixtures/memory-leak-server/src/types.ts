/**
 * Data contracts and type definitions for memory-leak-server fixture.
 */

export interface ClientTelemetry {
  sessionId: string;
  clientId: string;
  event: string;
  payload: Buffer | string;
  timestamp: number;
}

export interface SessionStats {
  sessionId: string;
  clientId: string;
  bytesReceived: number;
  messageCount: number;
  connectedAt: number;
  isActive: boolean;
}

export interface ServerHealthMetrics {
  activeSessions: number;
  listenerCount: number;
  cacheEntries: number;
  approxMemoryBytes: number;
  heapUsedBytes: number;
  isLeaking: boolean;
}
