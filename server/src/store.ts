import type { Progress } from '@linguasea/core';

/** `email` is set once the learner signs in (trimmed, lower-case); anonymous accounts have none. */
export type Account = { id: string; createdAt: string; email?: string };

export type EntitlementResult = 'applied' | 'stale' | 'unknown-account';

/** A pending email sign-in: the 6-digit code is stored hashed, never as sent. */
export type LoginCode = { codeHash: string; expiresAt: Date; attempts: number };

/**
 * Persistence boundary. MemoryStore is for development and tests;
 * production uses PgStore (pg-store.ts) with the tables in db/schema.sql.
 */
export interface Store {
  /** New account with its first device token. Fails if the email is already used. */
  createAccount(account: Account, tokenHash: string): Promise<void>;
  accountByTokenHash(tokenHash: string): Promise<Account | undefined>;
  accountByEmail(email: string): Promise<Account | undefined>;
  /** Gives an anonymous account its email; false when the account already has one or the email is taken. */
  setEmail(accountId: string, email: string): Promise<boolean>;
  /** Another device token for the account (one per device; older ones stay valid). */
  addToken(accountId: string, tokenHash: string): Promise<void>;
  revokeToken(tokenHash: string): Promise<void>;
  /** Removes the account and everything stored for it (tokens, email and pending codes, progress, subscription state, usage). */
  deleteAccount(accountId: string): Promise<void>;
  /**
   * Folds account `fromId` into `intoId` and deletes `fromId`: progress is combined with `merge(from, into)`,
   * the later subscription end of the two is kept. `fromId` stays an alias of `intoId`
   * (store events can keep arriving for the old id).
   */
  mergeAccounts(fromId: string, intoId: string, merge: (from: Progress, into: Progress | undefined) => Progress): Promise<void>;
  /** The account an id now stands for: itself, or the account it was merged into. */
  resolveAccountId(id: string): Promise<string>;
  /** Notes that the account was used (at most one write a day per account). */
  touchAccount(accountId: string, now: Date): Promise<void>;
  /** Deletes accounts not used since `before`; returns how many. */
  deleteInactive(before: Date): Promise<number>;

  /** Stores the code for the email, replacing any earlier one (attempts start at 0). */
  saveLoginCode(email: string, codeHash: string, expiresAt: Date): Promise<void>;
  getLoginCode(email: string): Promise<LoginCode | undefined>;
  /** Counts a guess (atomically, before it is checked); returns the attempts so far (0 when there is no code). */
  failLoginCode(email: string): Promise<number>;
  /** Removes the code; true only for the one caller that removed it (a code works once). */
  takeLoginCode(email: string): Promise<boolean>;
  /** Deletes codes that expired before `now`. */
  purgeLoginCodes(now: Date): Promise<number>;

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
  private tokens = new Map<string, string>(); // token hash → account id
  private emails = new Map<string, string>(); // email → account id
  private codes = new Map<string, LoginCode>();
  private progress = new Map<string, Progress>();
  private premium = new Map<string, { until: Date; eventAt: Date }>();
  private usage = new Map<string, number>();
  private lastSeen = new Map<string, Date>();
  private aliases = new Map<string, string>(); // merged account id → surviving account id

  async createAccount(a: Account, tokenHash: string) {
    if (this.accounts.has(a.id)) throw new Error('account exists');
    if (a.email && this.emails.has(a.email)) throw new Error('email already used');
    this.accounts.set(a.id, { ...a });
    if (a.email) this.emails.set(a.email, a.id);
    this.tokens.set(tokenHash, a.id);
    this.lastSeen.set(a.id, new Date(a.createdAt));
  }
  async touchAccount(id: string, now: Date) {
    if (this.accounts.has(id)) this.lastSeen.set(id, now);
  }
  async deleteInactive(before: Date) {
    const stale = [...this.lastSeen].filter(([, at]) => at < before).map(([id]) => id);
    for (const id of stale) await this.deleteAccount(id);
    return stale.length;
  }
  async accountByTokenHash(tokenHash: string) {
    const id = this.tokens.get(tokenHash);
    const a = id ? this.accounts.get(id) : undefined;
    return a && { ...a };
  }
  async accountByEmail(email: string) {
    const id = this.emails.get(email);
    const a = id ? this.accounts.get(id) : undefined;
    return a && { ...a };
  }
  async setEmail(id: string, email: string) {
    const a = this.accounts.get(id);
    if (!a || a.email || this.emails.has(email)) return false;
    a.email = email;
    this.emails.set(email, id);
    return true;
  }
  async addToken(id: string, tokenHash: string) {
    if (!this.accounts.has(id)) throw new Error('unknown account');
    this.tokens.set(tokenHash, id);
  }
  async revokeToken(tokenHash: string) {
    this.tokens.delete(tokenHash);
  }
  async deleteAccount(id: string) {
    const a = this.accounts.get(id);
    if (a?.email) {
      this.emails.delete(a.email);
      this.codes.delete(a.email);
    }
    for (const [hash, owner] of this.tokens) if (owner === id) this.tokens.delete(hash);
    for (const [old, owner] of this.aliases) if (owner === id) this.aliases.delete(old);
    this.accounts.delete(id);
    this.progress.delete(id);
    this.premium.delete(id);
    this.lastSeen.delete(id);
    for (const key of this.usage.keys()) if (key.startsWith(`${id}|`)) this.usage.delete(key);
  }
  async mergeAccounts(fromId: string, intoId: string, merge: (from: Progress, into: Progress | undefined) => Progress) {
    if (!this.accounts.has(fromId) || !this.accounts.has(intoId)) throw new Error('unknown account');
    const from = this.progress.get(fromId);
    if (from) this.progress.set(intoId, merge(from, this.progress.get(intoId)));
    const a = this.premium.get(fromId);
    const b = this.premium.get(intoId);
    if (a && (!b || a.until > b.until)) this.premium.set(intoId, a);
    for (const [old, owner] of this.aliases) if (owner === fromId) this.aliases.set(old, intoId);
    await this.deleteAccount(fromId);
    this.aliases.set(fromId, intoId);
  }
  async resolveAccountId(id: string) {
    return this.aliases.get(id) ?? id;
  }
  async saveLoginCode(email: string, codeHash: string, expiresAt: Date) {
    this.codes.set(email, { codeHash, expiresAt, attempts: 0 });
  }
  async getLoginCode(email: string) {
    const c = this.codes.get(email);
    return c && { ...c };
  }
  async failLoginCode(email: string) {
    const c = this.codes.get(email);
    if (!c) return 0;
    c.attempts += 1;
    return c.attempts;
  }
  async takeLoginCode(email: string) {
    return this.codes.delete(email);
  }
  async purgeLoginCodes(now: Date) {
    let removed = 0;
    for (const [email, c] of this.codes) if (c.expiresAt < now) (this.codes.delete(email), removed++);
    return removed;
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
