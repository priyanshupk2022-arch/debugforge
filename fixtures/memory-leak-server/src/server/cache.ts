/**
 * Unbounded Telemetry Cache
 * 
 * Stores raw telemetry frames and session snapshot buffers in memory.
 */

export class UnboundedTelemetryCache {
  private cache: Map<string, Buffer[]> = new Map();

  /**
   * Store raw telemetry buffer for a session.
   * 
   * INFECTION ORIGIN (Cache Leak):
   * Stores 64KB allocated buffers per session without TTL, LRU eviction,
   * or cleanup hooks when sessions disconnect.
   */
  storeSessionData(sessionId: string, buffer: Buffer): void {
    const existing = this.cache.get(sessionId) || [];
    existing.push(buffer);
    this.cache.set(sessionId, existing);
  }

  getSessionData(sessionId: string): Buffer[] | undefined {
    return this.cache.get(sessionId);
  }

  deleteSessionData(sessionId: string): boolean {
    return this.cache.delete(sessionId);
  }

  get size(): number {
    return this.cache.size;
  }

  getApproximateMemoryBytes(): number {
    let totalBytes = 0;
    for (const buffers of this.cache.values()) {
      for (const buf of buffers) {
        totalBytes += buf.byteLength;
      }
    }
    return totalBytes;
  }

  clear(): void {
    this.cache.clear();
  }
}
