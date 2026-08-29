/**
 * Account Store & Repository
 * 
 * Manages persisted account balances and ledger state.
 */

import { Account } from '../types';

export class AccountStore {
  private accounts: Map<string, Account> = new Map();

  constructor(initialAccounts: Account[] = []) {
    for (const acc of initialAccounts) {
      this.accounts.set(acc.id, { ...acc });
    }
  }

  async getAccount(id: string): Promise<Account | null> {
    // Simulate non-blocking async DB/cache fetch delay
    await new Promise(resolve => setTimeout(resolve, 2));
    const acc = this.accounts.get(id);
    if (!acc) return null;
    return { ...acc };
  }

  async saveAccount(account: Account): Promise<void> {
    // Simulate non-blocking async DB write delay
    await new Promise(resolve => setTimeout(resolve, 2));
    this.accounts.set(account.id, { ...account });
  }

  reset(accounts: Account[] = []): void {
    this.accounts.clear();
    for (const acc of accounts) {
      this.accounts.set(acc.id, { ...acc });
    }
  }

  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values()).map(a => ({ ...a }));
  }
}
