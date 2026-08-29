/**
 * Test Suite: Memory Leak & Event Listener Retention Reproduction
 * 
 * Demonstrates:
 * 1. Single session lifecycle behavior.
 * 2. Deterministic memory leak reproduction under sustained load (1,000 connect/disconnect cycles).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createTelemetryServer } from '../src/index';

describe('Memory Leak Server - Listener & Cache Retention Suite', () => {
  test('Single Session: connects, processes metric, and disconnects', () => {
    const server = createTelemetryServer();
    
    const session = server.createSession('sess_01', 'client_alpha');
    assert.strictEqual(session.active, true);
    
    server.broadcast({
      sessionId: 'sess_01',
      clientId: 'client_alpha',
      event: 'cpu_metric',
      payload: '{"cpu": 45}',
      timestamp: Date.now(),
    });

    const stats = session.getStats();
    assert.strictEqual(stats.messageCount, 1);

    const closed = server.closeSession('sess_01');
    assert.strictEqual(closed, true);
    assert.strictEqual(session.active, false);
  });

  test('Sustained Load Memory Leak: 1,000 client sessions must release listeners and cache', () => {
    const server = createTelemetryServer();
    const ITERATIONS = 1000;

    // Simulate 1,000 rapid connect and disconnect cycles
    for (let i = 0; i < ITERATIONS; i++) {
      const sessionId = `sess_load_${i}`;
      const clientId = `client_${i}`;
      server.createSession(sessionId, clientId);
      server.closeSession(sessionId);
    }

    const health = server.getHealthMetrics();

    // BUG REPRODUCTION ASSERTIONS:
    // In the leaky implementation, disconnect() does not remove the event listener
    // from GlobalTelemetryBroker and does not purge the 64KB buffer from UnboundedTelemetryCache.
    // As a result, listenerCount is 1,000 and cacheEntries is 1,000.
    assert.strictEqual(
      health.activeSessions,
      0,
      `Active sessions count must be 0 after closing all sessions (got ${health.activeSessions})`
    );

    assert.strictEqual(
      health.listenerCount,
      0,
      `All event listeners must be removed after disconnect (expected 0, got ${health.listenerCount})`
    );

    assert.strictEqual(
      health.cacheEntries,
      0,
      `Cache entries must be purged on session close (expected 0, got ${health.cacheEntries})`
    );

    assert.strictEqual(
      health.isLeaking,
      false,
      `Server health must not detect active memory/listener leak`
    );
  });
});
