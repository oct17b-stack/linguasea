import pg from 'pg';

import type { Db } from './pg-store';

/** Production database: a pg pool; transactions run on one pooled client. */
export function pgDb(connectionString: string): Db & { end(): Promise<void> } {
  const pool = new pg.Pool({ connectionString });
  return {
    query: (sql, params) => pool.query(sql, params as unknown[]) as never,
    async transaction(work) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const result = await work({ query: (sql, params) => client.query(sql, params as unknown[]) as never });
        await client.query('commit');
        return result;
      } catch (e) {
        await client.query('rollback');
        throw e;
      } finally {
        client.release();
      }
    },
    exec: (sql) => pool.query(sql),
    end: () => pool.end(),
  };
}
