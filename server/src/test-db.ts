// Test helper: a real PostgreSQL (PGlite, in-process WASM) behind the same Db interface as production.
import { PGlite } from '@electric-sql/pglite';

import { migrate, type Db } from './pg-store';

export async function testDb(): Promise<Db> {
  const pg = new PGlite();
  const db: Db = {
    query: (sql, params) => pg.query(sql, params) as never,
    transaction: (work) => pg.transaction((tx) => work({ query: (sql, params) => tx.query(sql, params) as never })),
    exec: (sql) => pg.exec(sql),
  };
  await migrate(db);
  return db;
}
