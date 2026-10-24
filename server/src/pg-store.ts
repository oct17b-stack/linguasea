import { readFileSync } from 'node:fs';

import type { Progress } from '@linguasea/core';

import type { Account, EntitlementResult, Store } from './store';

export type Queryable = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
};

/** A database connection that can also run a transaction (pg.Pool in production, PGlite in tests). */
export type Db = Queryable & {
  transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T>;
  /** Runs a script of several statements without parameters. */
  exec(sql: string): Promise<unknown>;
};

export async function migrate(db: Db) {
  await db.exec(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
}

export class PgStore implements Store {
  constructor(private db: Db) {}

  async createAccount(a: Account, tokenHash: string) {
    await this.db.transaction(async (tx) => {
      await tx.query('insert into accounts (id, email, created_at, last_seen_at) values ($1, $2, $3, $3)', [
        a.id,
        a.email ?? null,
        a.createdAt,
      ]);
      await tx.query('insert into tokens (token_hash, account_id, created_at) values ($1, $2, $3)', [tokenHash, a.id, a.createdAt]);
    });
  }

  private async findAccount(where: string, value: string): Promise<Account | undefined> {
    const { rows } = await this.db.query<{ id: string; email: string | null; created_at: Date }>(
      `select a.id, a.email, a.created_at from accounts a ${where}`,
      [value],
    );
    const r = rows[0];
    if (!r) return undefined;
    const acc: Account = { id: r.id, createdAt: new Date(r.created_at).toISOString() };
    if (r.email) acc.email = r.email;
    return acc;
  }

  async accountByTokenHash(tokenHash: string) {
    return this.findAccount('join tokens t on t.account_id = a.id where t.token_hash = $1', tokenHash);
  }

  async accountByEmail(email: string) {
    return this.findAccount('where a.email = $1', email);
  }

  async setEmail(id: string, email: string) {
    try {
      const { rows } = await this.db.query(
        `update accounts set email = $2 where id = $1 and email is null
           and not exists (select 1 from accounts where email = $2)
         returning 1`,
        [id, email],
      );
      return rows.length > 0;
    } catch (e) {
      // Another request took the email between the check and the update.
      if ((e as { code?: string }).code === '23505') return false;
      throw e;
    }
  }

  async addToken(id: string, tokenHash: string) {
    await this.db.query('insert into tokens (token_hash, account_id) values ($1, $2)', [tokenHash, id]);
  }

  async revokeToken(tokenHash: string) {
    await this.db.query('delete from tokens where token_hash = $1', [tokenHash]);
  }

  async deleteAccount(id: string) {
    await this.db.transaction(async (tx) => {
      await tx.query('delete from login_codes where email = (select email from accounts where id = $1)', [id]);
      // Tokens, progress, entitlements and usage go with the account (on delete cascade).
      await tx.query('delete from accounts where id = $1', [id]);
    });
  }

  async mergeAccounts(fromId: string, intoId: string, merge: (from: Progress, into: Progress | undefined) => Progress) {
    await this.db.transaction(async (tx) => {
      const { rows: found } = await tx.query<{ id: string }>('select id from accounts where id = any($1) for update', [[fromId, intoId]]);
      if (found.length !== 2) throw new Error('unknown account');
      const { rows: progress } = await tx.query<{ account_id: string; data: Progress }>(
        'select account_id, data from progress where account_id = any($1) for update',
        [[fromId, intoId]],
      );
      const from = progress.find((r) => r.account_id === fromId)?.data;
      if (from) {
        const next = merge(from, progress.find((r) => r.account_id === intoId)?.data);
        await tx.query(
          `insert into progress (account_id, data, updated_at) values ($1, $2, now())
           on conflict (account_id) do update set data = excluded.data, updated_at = now()`,
          [intoId, JSON.stringify(next)],
        );
      }
      // Keep the later subscription end of the two.
      await tx.query(
        `insert into entitlements (account_id, premium_until, event_at)
           select $2, premium_until, event_at from entitlements where account_id = $1
         on conflict (account_id) do update
           set premium_until = excluded.premium_until, event_at = excluded.event_at, updated_at = now()
           where entitlements.premium_until < excluded.premium_until`,
        [fromId, intoId],
      );
      await tx.query('delete from accounts where id = $1', [fromId]);
    });
  }

  async saveLoginCode(email: string, codeHash: string, expiresAt: Date) {
    await this.db.query(
      `insert into login_codes (email, code_hash, expires_at, attempts) values ($1, $2, $3, 0)
       on conflict (email) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`,
      [email, codeHash, expiresAt.toISOString()],
    );
  }

  async getLoginCode(email: string) {
    const { rows } = await this.db.query<{ code_hash: string; expires_at: Date; attempts: number }>(
      'select code_hash, expires_at, attempts from login_codes where email = $1',
      [email],
    );
    const r = rows[0];
    return r ? { codeHash: r.code_hash, expiresAt: new Date(r.expires_at), attempts: r.attempts } : undefined;
  }

  async failLoginCode(email: string) {
    const { rows } = await this.db.query<{ attempts: number }>(
      'update login_codes set attempts = attempts + 1 where email = $1 returning attempts',
      [email],
    );
    return rows[0]?.attempts ?? 0;
  }

  async takeLoginCode(email: string) {
    const { rows } = await this.db.query('delete from login_codes where email = $1 returning 1', [email]);
    return rows.length > 0;
  }

  async purgeLoginCodes(now: Date) {
    const { rows } = await this.db.query('delete from login_codes where expires_at < $1 returning 1', [now.toISOString()]);
    return rows.length;
  }

  async touchAccount(id: string, now: Date) {
    await this.db.query(
      `update accounts set last_seen_at = $2 where id = $1 and last_seen_at < $2::timestamptz - interval '1 day'`,
      [id, now.toISOString()],
    );
  }

  async deleteInactive(before: Date) {
    const { rows } = await this.db.query<{ n: number }>(
      `with gone as (delete from accounts where last_seen_at < $1 returning email),
            codes as (delete from login_codes where email in (select email from gone))
       select count(*)::int as n from gone`,
      [before.toISOString()],
    );
    return rows[0]?.n ?? 0;
  }

  async getProgress(id: string) {
    const { rows } = await this.db.query<{ data: Progress }>('select data from progress where account_id = $1', [id]);
    return rows[0]?.data;
  }

  async updateProgress(id: string, change: (current: Progress | undefined) => Progress) {
    return this.db.transaction(async (tx) => {
      const { rows } = await tx.query<{ data: Progress }>(
        'select data from progress where account_id = $1 for update',
        [id],
      );
      const next = change(rows[0]?.data);
      await tx.query(
        `insert into progress (account_id, data, updated_at) values ($1, $2, now())
         on conflict (account_id) do update set data = excluded.data, updated_at = now()`,
        [id, JSON.stringify(next)],
      );
      return next;
    });
  }

  async getPremiumUntil(id: string) {
    const { rows } = await this.db.query<{ premium_until: Date }>(
      'select premium_until from entitlements where account_id = $1',
      [id],
    );
    return rows[0] ? new Date(rows[0].premium_until) : undefined;
  }

  async applyEntitlement(id: string, until: Date, eventAt: Date): Promise<EntitlementResult> {
    const { rows: found } = await this.db.query('select 1 from accounts where id = $1', [id]);
    if (!found.length) return 'unknown-account';
    const { rows } = await this.db.query(
      `insert into entitlements (account_id, premium_until, event_at) values ($1, $2, $3)
       on conflict (account_id) do update
         set premium_until = excluded.premium_until, event_at = excluded.event_at, updated_at = now()
         where entitlements.event_at <= excluded.event_at
       returning 1`,
      [id, until.toISOString(), eventAt.toISOString()],
    );
    return rows.length ? 'applied' : 'stale';
  }

  async useQuota(id: string, day: string, key: string, limit: number) {
    const { rows } = await this.db.query(
      `insert into usage (account_id, day, key, count) values ($1, $2, $3, 1)
       on conflict (account_id, day, key) do update set count = usage.count + 1
         where usage.count < $4
       returning count`,
      [id, day, key, limit],
    );
    return rows.length > 0 && limit > 0;
  }
}
