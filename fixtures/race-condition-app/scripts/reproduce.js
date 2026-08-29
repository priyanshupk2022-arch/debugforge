#!/usr/bin/env node
/**
 * Standalone Reproduction Script for Fixture 2: Race Condition App
 * 
 * Fires concurrent requests and displays the state corruption & negative balance.
 */

const { createTransferApp } = require('../dist/src/index');

async function main() {
  console.log("================================================================================");
  console.log("  DebugForge Fixture Reproduction: Race Condition App");
  console.log("================================================================================");
  
  const app = createTransferApp([
    { id: 'acc_alice', holder: 'Alice', balance: 100, currency: 'USD', updatedAt: Date.now() },
    { id: 'acc_bob', holder: 'Bob', balance: 0, currency: 'USD', updatedAt: Date.now() },
  ]);

  console.log("[1] Initial State: Alice has $100.00, Bob has $0.00");
  console.log("[2] Launching 20 simultaneous concurrent transfers of $50.00 each...");

  const requests = Array.from({ length: 20 }, (_, i) => ({
    transferId: `tx_repro_${i + 1}`,
    fromAccountId: 'acc_alice',
    toAccountId: 'acc_bob',
    amount: 50,
  }));

  const results = await app.transferService.executeBatch(requests);
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const rejected = results.filter(r => r.status === 'REJECTED').length;
  const alice = await app.accountStore.getAccount('acc_alice');

  console.log(`\nExecution Summary:`);
  console.log(`  Total Requests:       20`);
  console.log(`  Successful Transfers: ${successful} (Expected: 2)`);
  console.log(`  Rejected Transfers:   ${rejected} (Expected: 18)`);
  console.log(`  Alice Final Balance:  $${alice.balance}.00 (Expected: $0.00)`);

  if (alice.balance < 0 || successful > 2) {
    console.error("\n💥 [RACE CONDITION REPRODUCED] State Corruption Detected!");
    console.error(`Double-spend occurred: Alice's balance dropped to $${alice.balance}.00!`);
    console.log("\nBackward Causal Chain:");
    console.log("  [Crash / Corruption] test/concurrency.test.ts:74 (AssertionError: balance >= 0)");
    console.log("         ▲");
    console.log("  [Propagation 2]     src/services/audit.ts:19 (async gap tick interleaving)");
    console.log("         ▲");
    console.log("  [Propagation 1]     src/services/transfer.ts:38 (fromAccount.balance < amount check on stale state)");
    console.log("         ▲");
    console.log("  [Infection Origin]  src/services/transfer.ts:27 (executeTransfer non-atomic read-modify-write)");
    process.exit(1);
  } else {
    console.log("\n✅ Transfer synchronization intact.");
    process.exit(0);
  }
}

main();
