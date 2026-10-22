import type { Progress } from '@linguasea/core';

export type Account = { id: string; tokenHash: string; createdAt: string };

export type EntitlementResult = 'applied' | 'stale' | 'unknown-account';

/**
 * Persistence boundary. MemoryStore is for development and tests;
 * production uses PgStore (pg-store.ts) with the tables in db/schema.sql.
 */
export interface Store {
  createAccount(account: Account): Promise<void>;
  accountByTokenHash(tokenHash: string): Promise<Account | undefined>;
  /** Removes the account and everything stored for it (progress, subscription state, usage). */
  deleteAccount(accountId: string): Promise<void>;

  getProgress(accountId: string): Promise<Progress | undefined>;
  /** Read-modify-write without lost updates when two devices sync at once. */
  updateProgress(accountId: string, change: (current: Progress | undefined) => Progress): Promise<Progress>;

  /** Subscription end; undefined = never subscribed. */
  getPremiumUntil(accountId: string): Promise<Date | undefined>;
  /**
   * Records the subscription end from a store event. Events can arrive out of order,
   * so one older than the last applied event is ignored ("stale").
   */
  applyEntitlement(accountId: string, until: Date, eventAt: Date): Promise<EntitlementResult>;

  /** Counts one use of `key` today; false (and not counted) once `limit` is reached. */
  useQuota(accountId: string, day: string, key: string, limit: number): Promise<boolean>;
}

export class MemoryStore implements Store {
  private accounts = new Map<string, Account>();
  private byToken = new Map<string, Account>();
  private progress = new Map<string, Progress>();
  private premium = new Map<string, { until: Date; eventAt: Date }>();
  private usage = new Map<string, number>();

  async createAccount(a: Account) {
    this.accounts.set(a.id, a);
    this.byToken.set(a.tokenHash, a);
  }
  async accountByTokenHash(tokenHash: string) {
    return this.byToken.get(tokenHash);
  }
  async deleteAccount(id: string) {
    const a = this.accounts.get(id);
    if (a) this.byToken.delete(a.tokenHash);
    this.accounts.delete(id);
    this.progress.delete(id);
    this.premium.delete(id);
    for (const key of this.usage.keys()) if (key.startsWith(`${id}|`)) this.usage.delete(key);
  }
  async getProgress(id: string) {
    return this.progress.get(id);
  }
  async updateProgress(id: string, change: (current: Progress | undefined) => Progress) {
    const next = change(this.progress.get(id));
    this.progress.set(id, next);
    return next;
  }
  async getPremiumUntil(id: string) {
    return this.premium.get(id)?.until;
  }
  async applyEntitlement(id: string, until: Date, eventAt: Date): Promise<EntitlementResult> {
    if (!this.accounts.has(id)) return 'unknown-account';
    const current = this.premium.get(id);
    if (current && current.eventAt > eventAt) return 'stale';
    this.premium.set(id, { until, eventAt });
    return 'applied';
  }
  async useQuota(id: string, day: string, key: string, limit: number) {
    const k = `${id}|${day}|${key}`;
    const used = this.usage.get(k) ?? 0;
    if (used >= limit) return false;
    this.usage.set(k, used + 1);
    return true;
  }
}
