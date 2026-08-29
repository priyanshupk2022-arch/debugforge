/**
 * Transfer Service
 * 
 * Orchestrates balance transfers and debit/credit operations between accounts.
 */

import { AccountStore } from '../wallet/account';
import { AuditLogger } from './audit';
import { TransferRequest, TransferResult } from '../types';

export class TransferService {
  constructor(
    private accountStore: AccountStore,
    private auditLogger: AuditLogger
  ) {}

  /**
   * Execute fund transfer between accounts.
   * 
   * INFECTION ORIGIN (Root Cause):
   * This method performs a non-atomic read-modify-write operation across
   * asynchronous I/O ticks without acquiring a mutex or transaction lock.
   * Concurrent requests read stale balances and overdraw accounts into negative balances.
   */
  async executeTransfer(request: TransferRequest): Promise<TransferResult> {
    // 1. Read: Fetch source account
    const fromAccount = await this.accountStore.getAccount(request.fromAccountId);
    if (!fromAccount) {
      throw new Error(`Source account '${request.fromAccountId}' not found`);
    }

    // 2. Check: Verify sufficient balance
    if (fromAccount.balance < request.amount) {
      return {
        transferId: request.transferId,
        status: 'REJECTED',
        fromBalance: fromAccount.balance,
        toBalance: 0,
        error: `Insufficient funds: balance is ${fromAccount.balance}, requested ${request.amount}`,
        timestamp: Date.now(),
      };
    }

    // 3. Asynchronous Gap: Non-atomic I/O allows concurrent ticks to interleave
    await this.auditLogger.logAsyncTransfer(request);

    // 4. Stale Write: Mutates balance based on stale read
    fromAccount.balance = fromAccount.balance - request.amount;
    fromAccount.updatedAt = Date.now();
    await this.accountStore.saveAccount(fromAccount);

    // 5. Update destination account if specified
    if (request.toAccountId) {
      const toAccount = await this.accountStore.getAccount(request.toAccountId);
      if (toAccount) {
        toAccount.balance = toAccount.balance + request.amount;
        toAccount.updatedAt = Date.now();
        await this.accountStore.saveAccount(toAccount);
      }
    }

    return {
      transferId: request.transferId,
      status: 'SUCCESS',
      fromBalance: fromAccount.balance,
      toBalance: 0,
      timestamp: Date.now(),
    };
  }

  async executeBatch(requests: TransferRequest[]): Promise<TransferResult[]> {
    return Promise.all(requests.map(req => this.executeTransfer(req)));
  }
}
