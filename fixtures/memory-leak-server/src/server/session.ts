/**
 * Client Session Management
 * 
 * Manages active telemetry client connection lifecycle and frame processing.
 */

import { GlobalTelemetryBroker } from './emitter';
import { UnboundedTelemetryCache } from './cache';
import { ClientTelemetry, SessionStats } from '../types';

export class ClientSession {
  public readonly sessionId: string;
  public readonly clientId: string;
  public readonly connectedAt: number;
  private isActive: boolean = true;
  private messageCount: number = 0;
  private bytesReceived: number = 0;
  private telemetryHandler: (metric: ClientTelemetry) => void;

  constructor(
    sessionId: string,
    clientId: string,
    private broker: GlobalTelemetryBroker,
    private cache: UnboundedTelemetryCache
  ) {
    this.sessionId = sessionId;
    this.clientId = clientId;
    this.connectedAt = Date.now();

    // Allocate 64KB session buffer frame
    const initialBuffer = Buffer.alloc(65536, 0xaa);
    this.cache.storeSessionData(this.sessionId, initialBuffer);

    // INFECTION ORIGIN (Root Cause):
    // Registers bound listener on singleton broker.
    // The closure captures 'this' (the ClientSession instance).
    this.telemetryHandler = (metric: ClientTelemetry) => {
      this.handleTelemetry(metric);
    };

    this.broker.on('telemetry', this.telemetryHandler);
  }

  private handleTelemetry(metric: ClientTelemetry): void {
    if (!this.isActive) return;
    if (metric.sessionId === this.sessionId || metric.clientId === this.clientId) {
      this.messageCount++;
      const payloadLength = typeof metric.payload === 'string'
        ? metric.payload.length
        : metric.payload.byteLength;
      this.bytesReceived += payloadLength;
    }
  }

  /**
   * INFECTION ORIGIN (Lifecycle Leak):
   * Marks session as inactive but fails to unregister event listener from broker
   * and fails to remove 64KB buffer from cache.
   */
  disconnect(): void {
    this.isActive = false;

    // BUG: Missing unsubscription:
    // this.broker.removeListener('telemetry', this.telemetryHandler);
    // this.cache.deleteSessionData(this.sessionId);
  }

  getStats(): SessionStats {
    return {
      sessionId: this.sessionId,
      clientId: this.clientId,
      bytesReceived: this.bytesReceived,
      messageCount: this.messageCount,
      connectedAt: this.connectedAt,
      isActive: this.isActive,
    };
  }

  get active(): boolean {
    return this.isActive;
  }
}
