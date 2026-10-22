import type { Progress } from '@linguasea/core';

export type Account = { id: string; tokenHash: string; createdAt: string };

/**
 * Persistence boundary. MemoryStore is for development and tests;
 * production uses PostgreSQL with the tables in db/schema.sql.
 */
export interface Store {
  createAccount(account: Account): Promise<void>;
  accountByTokenHash(tokenHash: string): Promise<Account | undefined>;
  getProgress(accountId: string): Promise<Progress | undefined>;
  putProgress(accountId: string, progress: Progress): Promise<void>;
  /** Subscription end; undefined = never subscribed. */
  getPremiumUntil(accountId: string): Promise<Date | undefined>;
  setPremiumUntil(accountId: string, until: Date): Promise<void>;
}

export class MemoryStore implements Store {
  private accounts = new Map<string, Account>();
  private byToken = new Map<string, Account>();
  private progress = new Map<string, Progress>();
  private premium = new Map<string, Date>();

  async createAccount(a: Account) {
    this.accounts.set(a.id, a);
    this.byToken.set(a.tokenHash, a);
  }
  async accountByTokenHash(tokenHash: string) {
    return this.byToken.get(tokenHash);
  }
  async getProgress(id: string) {
    return this.progress.get(id);
  }
  async putProgress(id: string, p: Progress) {
    this.progress.set(id, p);
  }
  async getPremiumUntil(id: string) {
    return this.premium.get(id);
  }
  async setPremiumUntil(id: string, until: Date) {
    this.premium.set(id, until);
  }
}
