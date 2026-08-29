/**
 * Data contracts and type definitions for race-condition-app fixture.
 */

export interface Account {
  id: string;
  holder: string;
  balance: number;
  currency: string;
  updatedAt: number;
}

export interface TransferRequest {
  transferId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface TransferResult {
  transferId: string;
  status: 'SUCCESS' | 'REJECTED';
  fromBalance: number;
  toBalance: number;
  error?: string;
  timestamp: number;
}

export interface AuditLog {
  id: string;
  transferId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  loggedAt: number;
}
