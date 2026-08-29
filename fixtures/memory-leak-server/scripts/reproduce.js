#!/usr/bin/env node
/**
 * Standalone Reproduction Script for Fixture 3: Memory Leak Server
 * 
 * Simulates 1,000 connect/disconnect cycles and measures leaked listeners and cache retention.
 */

const { createTelemetryServer } = require('../dist/src/index');

function main() {
  console.log("================================================================================");
  console.log("  DebugForge Fixture Reproduction: Memory Leak Server");
  console.log("================================================================================");
  
  const server = createTelemetryServer();
  const initialMem = process.memoryUsage().heapUsed;

  console.log("[1] Server initialized. Baseline heap used:", Math.round(initialMem / 1024 / 1024), "MB");
  console.log("[2] Simulating 1,000 rapid client connect -> disconnect cycles...");

  for (let i = 0; i < 1000; i++) {
    const sessionId = `sess_repro_${i}`;
    const clientId = `client_${i}`;
    server.createSession(sessionId, clientId);
    server.closeSession(sessionId);
  }

  const health = server.getHealthMetrics();
  const endMem = process.memoryUsage().heapUsed;
  const memoryDeltaMB = Math.round((endMem - initialMem) / 1024 / 1024);

  console.log(`\nTelemetry Server Health Report:`);
  console.log(`  Active Sessions:    ${health.activeSessions} (Expected: 0)`);
  console.log(`  Dangling Listeners: ${health.listenerCount} (Expected: 0)`);
  console.log(`  Leaked Cache Items: ${health.cacheEntries} (Expected: 0)`);
  console.log(`  Retained Buffers:   ${Math.round(health.approxMemoryBytes / 1024 / 1024)} MB (Expected: 0 MB)`);
  console.log(`  Heap Delta:         +${memoryDeltaMB} MB`);
  console.log(`  Leak Detected:      ${health.isLeaking ? 'YES ⚠️' : 'NO ✅'}`);

  if (health.listenerCount > 0 || health.cacheEntries > 0) {
    console.error("\n💥 [MEMORY LEAK REPRODUCED] Event Listener & Cache Bloat Detected!");
    console.error(`1,000 event listeners remained registered after sessions disconnected!`);
    console.log("\nBackward Causal Chain:");
    console.log("  [Crash / Leak Site] test/leak.test.ts:54 (AssertionError: listenerCount === 0)");
    console.log("         ▲");
    console.log("  [Propagation 2]     src/server/cache.ts:18 (UnboundedTelemetryCache retains 64KB buffers)");
    console.log("         ▲");
    console.log("  [Propagation 1]     src/server/emitter.ts:25 (GlobalTelemetryBroker listenerCount retains closures)");
    console.log("         ▲");
    console.log("  [Infection Origin]  src/server/session.ts:58 (ClientSession.disconnect() missing removeListener & cache.delete)");
    process.exit(1);
  } else {
    console.log("\n✅ Memory and listener lifecycle clean.");
    process.exit(0);
  }
}

main();
