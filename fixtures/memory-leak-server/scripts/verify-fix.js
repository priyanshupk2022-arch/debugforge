#!/usr/bin/env node
/**
 * Verification Script: Memory Leak Server Fix Oracle
 * 
 * Demonstrates the verified behavior once lifecycle unsubscription is applied.
 */

const { GlobalTelemetryBroker, UnboundedTelemetryCache, ClientSession, SessionManager } = require('../dist/src/index');

function main() {
  console.log("================================================================================");
  console.log("  DebugForge Fix Verification: Memory Leak Server");
  console.log("================================================================================");

  // Patched ClientSession with proper dispose / off logic
  class PatchedSession extends ClientSession {
    disconnect() {
      super.disconnect();
      // Auto-healed: Explicitly unregister listener and purge cache entry
      this.broker.removeListener('telemetry', this.telemetryHandler);
      this.cache.deleteSessionData(this.sessionId);
    }
  }

  class PatchedSessionManager extends SessionManager {
    createSession(sessionId, clientId) {
      const session = new PatchedSession(sessionId, clientId, this.broker, this.cache);
      this.sessions.set(sessionId, session);
      return session;
    }
  }

  const broker = new GlobalTelemetryBroker();
  const cache = new UnboundedTelemetryCache();
  const server = new PatchedSessionManager(broker, cache);

  console.log("[1] Simulating 1,000 rapid connect -> disconnect cycles with patched lifecycle...");
  for (let i = 0; i < 1000; i++) {
    const sessionId = `sess_healed_${i}`;
    server.createSession(sessionId, `client_${i}`);
    server.closeSession(sessionId);
  }

  const health = server.getHealthMetrics();
  console.log(`\nPatched Telemetry Server Health Report:`);
  console.log(`  Active Sessions:    ${health.activeSessions} (Expected: 0)`);
  console.log(`  Dangling Listeners: ${health.listenerCount} (Expected: 0)`);
  console.log(`  Leaked Cache Items: ${health.cacheEntries} (Expected: 0)`);
  console.log(`  Retained Buffers:   ${health.approxMemoryBytes} Bytes (Expected: 0)`);
  console.log(`  Leak Detected:      ${health.isLeaking ? 'YES ⚠️' : 'NO ✅'}`);

  if (health.listenerCount === 0 && health.cacheEntries === 0 && !health.isLeaking) {
    console.log("\n🎉 [TRIPLE-LOCK VERIFICATION PASSED] Memory leak fix verified successfully!");
    process.exit(0);
  } else {
    console.error("\n❌ Verification failed!");
    process.exit(1);
  }
}

main();
