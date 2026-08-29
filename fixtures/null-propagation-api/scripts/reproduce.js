#!/usr/bin/env node
/**
 * Standalone Reproduction Script for Fixture 1: Null Propagation API
 * 
 * Executes the failure scenario and displays the exact crash stack trace.
 */

const { createOrderApp } = require('../dist/src/index');

async function main() {
  console.log("================================================================================");
  console.log("  DebugForge Fixture Reproduction: Null Propagation API");
  console.log("================================================================================");
  console.log("[1] Initializing order application with DB Connection Pool Timeout enabled...");
  
  const app = createOrderApp({ simulateTimeout: true });

  console.log("[2] Submitting checkout order request for SKU-LAPTOP-01...");
  try {
    const result = await app.orderService.processOrder({
      orderId: 'ORD-REPRODUCE-001',
      customerId: 'CUST-REPRO-99',
      items: [{ sku: 'SKU-LAPTOP-01', quantity: 1 }],
    });
    console.log("Order result:", result);
  } catch (error) {
    console.error("\n💥 [CRASH REPRODUCED] Unhandled Runtime Exception Encountered:");
    console.error(`Error Type: ${error.name}`);
    console.error(`Message:    ${error.message}`);
    console.error(`Stack Trace:`);
    console.error(error.stack);
    console.log("\nBackward Causal Chain:");
    console.log("  [Crash Site]        src/services/order.ts:48 (order.pricing.total.toFixed(2))");
    console.log("         ▲");
    console.log("  [Propagation 2]     src/services/pricing.ts:32 (pricing.total = undefined)");
    console.log("         ▲");
    console.log("  [Propagation 1]     src/services/inventory.ts:40 (item = null)");
    console.log("         ▲");
    console.log("  [Infection Origin]  src/db/pool.ts:28 (pool.acquireConnection() -> returns null)");
    process.exit(1);
  }
}

main();
