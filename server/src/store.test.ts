import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { completeLesson, emptyProgress, mergeProgress, type Progress } from '@linguasea/core';

import { migrate, PgStore } from './pg-store';
import { MemoryStore, type Store } from './store';
import { emptyTestDb, testDb } from './test-db';

const NOW = new Date('2026-10-22T09:00:00Z');
const later = (ms: number) => new Date(NOW.getTime() + ms);

// Both stores must behave the same; MemoryStore stands in for PostgreSQL in other tests.
const stores: [string, () => Promise<Store>][] = [
  ['MemoryStore', async () => new MemoryStore()],
  ['PgStore', async () => new PgStore(await testDb())],
];

for (const [name, make] of stores) {
  describe(name, () => {
    async function withAccount() {
      const store = await make();
      await store.createAccount({ id: 'acc-1', createdAt: NOW.toISOString() }, 'hash-1');
      return store;
    }

    test('finds accounts by token hash', async () => {
      const store = await withAccount();
      assert.equal((await store.accountByTokenHash('hash-1'))?.id, 'acc-1');
      assert.equal(await store.accountByTokenHash('nope'), undefined);
    });

    test('merges concurrent progress updates without losing either', async () => {
      const store = await withAccount();
      const a = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true }, NOW);
      const b = completeLesson(emptyProgress(), 'ja-A1-01', { 'ja.konnichiwa': true }, NOW);
      await Promise.all([
        store.updateProgress('acc-1', (cur) => mergeProgress(a, cur ?? emptyProgress())),
        store.updateProgress('acc-1', (cur) => mergeProgress(b, cur ?? emptyProgress())),
      ]);
      const saved = await store.getProgress('acc-1');
      assert.deepEqual(Object.keys(saved!.completed).sort(), ['ja-A1-01', 'zh-A1-01']);
    });

    test('ignores subscription events older than the last applied one', async () => {
      const store = await withAccount();
      assert.equal(await store.applyEntitlement('acc-1', later(30 * 86_400_000), later(2000)), 'applied');
      assert.equal(await store.applyEntitlement('acc-1', NOW, later(1000)), 'stale');
      assert.deepEqual(await store.getPremiumUntil('acc-1'), later(30 * 86_400_000));
      assert.equal(await store.applyEntitlement('someone-else', NOW, NOW), 'unknown-account');
    });

    test('daily quota stops at the limit and resets the next day', async () => {
      const store = await withAccount();
      const results = [];
      for (let i = 0; i < 4; i++) results.push(await store.useQuota('acc-1', '2026-10-22', 'pronunciation', 3));
      assert.deepEqual(results, [true, true, true, false]);
      assert.equal(await store.useQuota('acc-1', '2026-10-23', 'pronunciation', 3), true);
    });

    test('a refunded use can be used again, but never below zero', async () => {
      const store = await withAccount();
      assert.equal(await store.useQuota('acc-1', '2026-10-22', 'tutor', 1), true);
      assert.equal(await store.useQuota('acc-1', '2026-10-22', 'tutor', 1), false);
      await store.refundQuota('acc-1', '2026-10-22', 'tutor');
      await store.refundQuota('acc-1', '2026-10-22', 'tutor');
      await store.refundQuota('acc-1', '2026-10-21', 'tutor');
      assert.equal(await store.useQuota('acc-1', '2026-10-22', 'tutor', 1), true);
      assert.equal(await store.useQuota('acc-1', '2026-10-22', 'tutor', 1), false);
    });

    test('deletes accounts that have not been used for a long time', async () => {
      const store = await withAccount();
      await store.createAccount({ id: 'acc-2', createdAt: NOW.toISOString() }, 'hash-2');
      await store.touchAccount('acc-2', later(400 * 86_400_000));
      assert.equal(await store.deleteInactive(later(365 * 86_400_000)), 1);
      assert.equal(await store.accountByTokenHash('hash-1'), undefined);
      assert.equal((await store.accountByTokenHash('hash-2'))?.id, 'acc-2');
    });

    test('deleting an account removes its data', async () => {
      const store = await withAccount();
      await store.addToken('acc-1', 'hash-1b');
      assert.equal(await store.setEmail('acc-1', 'nam@example.com'), true);
      await store.saveLoginCode('nam@example.com', 'code', later(600_000));
      await store.updateProgress('acc-1', () => emptyProgress());
      await store.applyEntitlement('acc-1', later(1000), NOW);
      await store.deleteAccount('acc-1');
      assert.equal(await store.accountByTokenHash('hash-1'), undefined);
      assert.equal(await store.accountByTokenHash('hash-1b'), undefined);
      assert.equal(await store.accountByEmail('nam@example.com'), undefined);
      assert.equal(await store.getLoginCode('nam@example.com'), undefined);
      assert.equal(await store.getProgress('acc-1'), undefined);
      assert.equal(await store.getPremiumUntil('acc-1'), undefined);
      // The email is free again.
      await store.createAccount({ id: 'acc-3', createdAt: NOW.toISOString(), email: 'nam@example.com' }, 'hash-3');
      assert.equal((await store.accountByEmail('nam@example.com'))?.id, 'acc-3');
    });

    test('an account has a token per device; revoking one keeps the others', async () => {
      const store = await withAccount();
      await store.addToken('acc-1', 'hash-1b');
      assert.equal((await store.accountByTokenHash('hash-1b'))?.id, 'acc-1');
      await store.revokeToken('hash-1');
      assert.equal(await store.accountByTokenHash('hash-1'), undefined);
      assert.equal((await store.accountByTokenHash('hash-1b'))?.id, 'acc-1');
    });

    test('an email belongs to one account', async () => {
      const store = await withAccount();
      assert.equal((await store.accountByTokenHash('hash-1'))?.email, undefined);
      assert.equal(await store.setEmail('acc-1', 'nam@example.com'), true);
      assert.deepEqual(await store.accountByTokenHash('hash-1'), { id: 'acc-1', createdAt: NOW.toISOString(), email: 'nam@example.com' });
      assert.equal((await store.accountByEmail('nam@example.com'))?.id, 'acc-1');
      assert.equal(await store.setEmail('acc-1', 'other@example.com'), false, 'an account keeps its email');
      await store.createAccount({ id: 'acc-2', createdAt: NOW.toISOString() }, 'hash-2');
      assert.equal(await store.setEmail('acc-2', 'nam@example.com'), false, 'the email is taken');
      await assert.rejects(store.createAccount({ id: 'acc-3', createdAt: NOW.toISOString(), email: 'nam@example.com' }, 'hash-3'));
      assert.equal(await store.accountByEmail('nobody@example.com'), undefined);
    });

    test('login codes: replaced by a new one, counted wrong guesses, used once, purged when expired', async () => {
      const store = await make();
      await store.saveLoginCode('nam@example.com', 'first', later(600_000));
      assert.equal(await store.failLoginCode('nam@example.com'), 1);
      assert.equal(await store.failLoginCode('nam@example.com'), 2);
      await store.saveLoginCode('nam@example.com', 'second', later(600_000));
      assert.deepEqual(await store.getLoginCode('nam@example.com'), { codeHash: 'second', expiresAt: later(600_000), attempts: 0 });
      assert.equal(await store.failLoginCode('nobody@example.com'), 0);
      assert.equal(await store.takeLoginCode('nam@example.com'), true);
      assert.equal(await store.takeLoginCode('nam@example.com'), false);
      await store.saveLoginCode('old@example.com', 'x', later(-1));
      await store.saveLoginCode('new@example.com', 'y', later(600_000));
      assert.equal(await store.purgeLoginCodes(NOW), 1);
      assert.equal(await store.getLoginCode('old@example.com'), undefined);
      assert.ok(await store.getLoginCode('new@example.com'));
    });

    test('rate-limit events: counted per key within the window, refused at the limit, purged', async () => {
      const store = await make();
      const since = later(-3_600_000);
      assert.equal(await store.countEvent('ip:a', 2, since, NOW), true);
      assert.equal(await store.countEvent('ip:a', 2, since, later(1)), true);
      assert.equal(await store.countEvent('ip:a', 2, since, later(2)), false, 'the third is refused');
      assert.equal(await store.countEvent('ip:b', 2, since, later(2)), true, 'other keys count on their own');
      assert.equal(await store.countEvent('ip:a', 2, later(1), later(3)), true, 'older events drop out of the window');
      const together = await Promise.all([1, 2, 3].map((i) => store.countEvent('email:x', 2, since, later(i))));
      assert.equal(together.filter(Boolean).length, 2, 'requests at the same time cannot all take the last slot');
      assert.equal(await store.purgeEvents(later(2)), 3);
      assert.equal(await store.countEvent('ip:a', 2, since, later(4)), true, 'one left after purging');
      assert.equal(await store.countEvent('ip:a', 2, since, later(5)), false);
    });

    test('merging folds progress and the later subscription into the other account', async () => {
      const store = await withAccount();
      await store.createAccount({ id: 'acc-2', createdAt: NOW.toISOString(), email: 'nam@example.com' }, 'hash-2');
      const a = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true }, NOW);
      const b = completeLesson(emptyProgress(), 'ja-A1-01', { 'ja.konnichiwa': true }, NOW);
      await store.updateProgress('acc-1', () => a);
      await store.updateProgress('acc-2', () => b);
      await store.applyEntitlement('acc-1', later(30 * 86_400_000), NOW);
      await store.applyEntitlement('acc-2', later(86_400_000), NOW);
      await store.useQuota('acc-1', '2026-10-22', 'tutor', 5);
      await store.mergeAccounts('acc-1', 'acc-2', (from, into) => mergeProgress(from, into ?? emptyProgress()));
      assert.deepEqual(Object.keys((await store.getProgress('acc-2'))!.completed).sort(), ['ja-A1-01', 'zh-A1-01']);
      assert.deepEqual(await store.getPremiumUntil('acc-2'), later(30 * 86_400_000));
      assert.equal(await store.accountByTokenHash('hash-1'), undefined);
      assert.equal(await store.getProgress('acc-1'), undefined);
      assert.equal((await store.accountByTokenHash('hash-2'))?.id, 'acc-2');

      // An earlier subscription end does not shorten the one already there; no progress leaves it as is.
      await store.createAccount({ id: 'acc-3', createdAt: NOW.toISOString() }, 'hash-3');
      await store.applyEntitlement('acc-3', later(1000), NOW);
      await store.mergeAccounts('acc-3', 'acc-2', () => assert.fail('nothing to merge'));
      assert.deepEqual(await store.getPremiumUntil('acc-2'), later(30 * 86_400_000));
      assert.equal(await store.accountByTokenHash('hash-3'), undefined);
    });

    test('a merged account id resolves to the account it went into, also after a second merge', async () => {
      const store = await withAccount();
      await store.createAccount({ id: 'acc-2', createdAt: NOW.toISOString() }, 'hash-2');
      await store.createAccount({ id: 'acc-3', createdAt: NOW.toISOString() }, 'hash-3');
      const merge = (from: Progress, into: Progress | undefined) => mergeProgress(from, into ?? emptyProgress());
      assert.equal(await store.resolveAccountId('acc-1'), 'acc-1');
      await store.mergeAccounts('acc-1', 'acc-2', merge);
      assert.equal(await store.resolveAccountId('acc-1'), 'acc-2');
      await store.mergeAccounts('acc-2', 'acc-3', merge);
      assert.equal(await store.resolveAccountId('acc-1'), 'acc-3');
      assert.equal(await store.resolveAccountId('acc-2'), 'acc-3');
      await store.deleteAccount('acc-3');
      assert.equal(await store.resolveAccountId('acc-1'), 'acc-1', 'deleting the account removes its aliases');
      assert.equal(await store.resolveAccountId('acc-2'), 'acc-2');
    });
  });
}

test('PgStore schema: moves the single token of older accounts into tokens, and can run again', async () => {
  const db = emptyTestDb();
  await db.exec(`
    create table accounts (id text primary key, token_hash text not null unique, created_at timestamptz not null default now());
    insert into accounts (id, token_hash) values ('old-1', 'old-hash');
  `);
  await migrate(db);
  await migrate(db);
  const store = new PgStore(db);
  assert.equal((await store.accountByTokenHash('old-hash'))?.id, 'old-1');
  await store.revokeToken('old-hash');
  await migrate(db);
  assert.equal(await store.accountByTokenHash('old-hash'), undefined, 'a revoked token stays revoked');
});
