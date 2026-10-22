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

  async createAccount(a: Account) {
    await this.db.query('insert into accounts (id, token_hash, created_at) values ($1, $2, $3)', [
      a.id,
      a.tokenHash,
      a.createdAt,
    ]);
  }

  async accountByTokenHash(tokenHash: string) {
    const { rows } = await this.db.query<{ id: string; token_hash: string; created_at: Date }>(
      'select id, token_hash, created_at from accounts where token_hash = $1',
      [tokenHash],
    );
    const r = rows[0];
    return r ? { id: r.id, tokenHash: r.token_hash, createdAt: new Date(r.created_at).toISOString() } : undefined;
  }

  async deleteAccount(id: string) {
    await this.db.query('delete from accounts where id = $1', [id]);
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
