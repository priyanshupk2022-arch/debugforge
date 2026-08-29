/**
 * Global Telemetry Broker
 * 
 * Central EventEmitter bus distributing telemetry events across subsystems.
 */

import { EventEmitter } from 'node:events';
import { ClientTelemetry } from '../types';

export class GlobalTelemetryBroker extends EventEmitter {
  private static instance: GlobalTelemetryBroker;

  constructor() {
    super();
    // Default Node limit is 10 before warning; we keep default to demonstrate MaxListenersExceededWarning
    this.setMaxListeners(10);
  }

  static getInstance(): GlobalTelemetryBroker {
    if (!GlobalTelemetryBroker.instance) {
      GlobalTelemetryBroker.instance = new GlobalTelemetryBroker();
    }
    return GlobalTelemetryBroker.instance;
  }

  publishTelemetry(metric: ClientTelemetry): void {
    this.emit('telemetry', metric);
  }

  getListenerCount(eventName: string = 'telemetry'): number {
    return this.listenerCount(eventName);
  }

  reset(): void {
    this.removeAllListeners();
  }
}
