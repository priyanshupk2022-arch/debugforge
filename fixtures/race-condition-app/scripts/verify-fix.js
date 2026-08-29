#!/usr/bin/env node
/**
 * Verification Script: Race Condition App Fix Oracle
 * 
 * Demonstrates the verified behavior once async mutex / transaction lock is applied.
 */

const { AccountStore, AuditLogger, TransferService } = require('../dist/src/index');

async function main() {
  console.log("================================================================================");
  console.log("  DebugForge Fix Verification: Race Condition App");
  console.log("================================================================================");

  const accountStore = new AccountStore([
    { id: 'acc_alice', holder: 'Alice', balance: 100, currency: 'USD', updatedAt: Date.now() },
    { id: 'acc_bob', holder: 'Bob', balance: 0, currency: 'USD', updatedAt: Date.now() },
  ]);
  const auditLogger = new AuditLogger();

  // Patched Transfer Service with Async Mutex / Serialized Queue
  class PatchedTransferService extends TransferService {
    constructor(accountStore, auditLogger) {
      super(accountStore, auditLogger);
      this.mutexQueue = new Map();
    }

    async executeTransfer(request) {
      // Auto-healed: Serialize transfer execution per source account
      let lock = this.mutexQueue.get(request.fromAccountId) || Promise.resolve();
      
      const operation = lock.then(async () => {
        return super.executeTransfer(request);
      });

      this.mutexQueue.set(request.fromAccountId, operation.catch(() => {}));
      return operation;
    }
  }

  const patchedService = new PatchedTransferService(accountStore, auditLogger);

  console.log("[1] Testing 20 concurrent transfer requests of $50 against Alice ($100)...");
  const requests = Array.from({ length: 20 }, (_, i) => ({
    transferId: `tx_healed_${i + 1}`,
    fromAccountId: 'acc_alice',
    toAccountId: 'acc_bob',
    amount: 50,
  }));

  const results = await Promise.all(requests.map(r => patchedService.executeTransfer(r)));
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const rejected = results.filter(r => r.status === 'REJECTED').length;
  const alice = await accountStore.getAccount('acc_alice');

  console.log(`\nExecution Summary:`);
  console.log(`  Successful Transfers: ${successful} (Expected: 2)`);
  console.log(`  Rejected Transfers:   ${rejected} (Expected: 18)`);
  console.log(`  Alice Final Balance:  $${alice.balance}.00 (Expected: $0.00)`);

  if (successful === 2 && rejected === 18 && alice.balance === 0) {
    console.log("\n🎉 [TRIPLE-LOCK VERIFICATION PASSED] Mutex synchronization verified successfully!");
    process.exit(0);
  } else {
    console.error("\n❌ Verification failed!");
    process.exit(1);
  }
}

main();
