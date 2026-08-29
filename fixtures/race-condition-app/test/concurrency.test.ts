/**
 * Test Suite: Account Concurrency & Race Condition Reproduction
 * 
 * Demonstrates:
 * 1. Safe sequential transfers behaving as expected.
 * 2. Deterministic race condition failure under high concurrency with non-atomic read-modify-write.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createTransferApp } from '../src/index';

describe('Race Condition App - Concurrency & Balance Integrity Suite', () => {
  test('Sequential Transfers: handles serialized transfers correctly without overdraft', async () => {
    const app = createTransferApp([
      { id: 'acc_alice', holder: 'Alice', balance: 100, currency: 'USD', updatedAt: Date.now() },
      { id: 'acc_bob', holder: 'Bob', balance: 0, currency: 'USD', updatedAt: Date.now() },
    ]);

    // 1st transfer of $50
    const tx1 = await app.transferService.executeTransfer({
      transferId: 'tx_seq_1',
      fromAccountId: 'acc_alice',
      toAccountId: 'acc_bob',
      amount: 50,
    });
    assert.strictEqual(tx1.status, 'SUCCESS');

    // 2nd transfer of $50
    const tx2 = await app.transferService.executeTransfer({
      transferId: 'tx_seq_2',
      fromAccountId: 'acc_alice',
      toAccountId: 'acc_bob',
      amount: 50,
    });
    assert.strictEqual(tx2.status, 'SUCCESS');

    // 3rd transfer of $50 should fail due to insufficient funds
    const tx3 = await app.transferService.executeTransfer({
      transferId: 'tx_seq_3',
      fromAccountId: 'acc_alice',
      toAccountId: 'acc_bob',
      amount: 50,
    });
    assert.strictEqual(tx3.status, 'REJECTED');

    const alice = await app.accountStore.getAccount('acc_alice');
    const bob = await app.accountStore.getAccount('acc_bob');

    assert.strictEqual(alice.balance, 0, 'Alice balance should be exactly 0');
    assert.strictEqual(bob.balance, 100, 'Bob balance should be exactly 100');
  });

  test('Concurrent Race Condition: High concurrency transfer requests must not corrupt account balance', async () => {
    const app = createTransferApp([
      { id: 'acc_alice', holder: 'Alice', balance: 100, currency: 'USD', updatedAt: Date.now() },
      { id: 'acc_bob', holder: 'Bob', balance: 0, currency: 'USD', updatedAt: Date.now() },
    ]);

    // Dispatch 20 concurrent transfer requests of $50 each
    // Since Alice only has $100, EXACTLY 2 transfers must succeed and 18 must be rejected.
    const concurrentRequests = Array.from({ length: 20 }, (_, idx) => ({
      transferId: `tx_conc_${idx + 1}`,
      fromAccountId: 'acc_alice',
      toAccountId: 'acc_bob',
      amount: 50,
    }));

    // Execute concurrently
    const results = await app.transferService.executeBatch(concurrentRequests);

    const successfulTransfers = results.filter(r => r.status === 'SUCCESS').length;
    const rejectedTransfers = results.filter(r => r.status === 'REJECTED').length;
    const alice = await app.accountStore.getAccount('acc_alice');

    // BUG REPRODUCTION ASSERTIONS:
    // In the un-synchronized implementation, all 20 requests read balance = 100 concurrently,
    // all 20 pass validation, and all 20 subtract $50, causing balance to drop to -$900!
    assert.ok(
      alice.balance >= 0,
      `Account balance must never drop below zero! Expected >= 0, got ${alice.balance}`
    );

    assert.strictEqual(
      successfulTransfers,
      2,
      `Exactly 2 transfers of $50 must succeed from a $100 balance (got ${successfulTransfers} successes, ${rejectedTransfers} rejections)`
    );
  });
});
