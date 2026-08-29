/**
 * Audit Logger Service
 * 
 * Records asynchronous audit trails and compliance logs for financial transfers.
 */

import { TransferRequest, AuditLog } from '../types';

export class AuditLogger {
  private logs: AuditLog[] = [];

  /**
   * Log transfer asynchronously.
   * Simulates non-blocking async network/disk I/O latency.
   */
  async logAsyncTransfer(request: TransferRequest): Promise<void> {
    // 8ms simulated I/O delay allows concurrent requests to interleave
    await new Promise(resolve => setTimeout(resolve, 8));
    
    this.logs.push({
      id: `audit_${Math.random().toString(36).substring(2, 9)}`,
      transferId: request.transferId,
      fromAccountId: request.fromAccountId,
      toAccountId: request.toAccountId,
      amount: request.amount,
      loggedAt: Date.now(),
    });
  }

  getLogs(): AuditLog[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}
