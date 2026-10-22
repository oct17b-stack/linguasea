import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { completeLesson, emptyProgress, mergeProgress } from '@linguasea/core';

import { PgStore } from './pg-store';
import { MemoryStore, type Store } from './store';
import { testDb } from './test-db';

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
      await store.createAccount({ id: 'acc-1', tokenHash: 'hash-1', createdAt: NOW.toISOString() });
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

    test('deleting an account removes its data', async () => {
      const store = await withAccount();
      await store.updateProgress('acc-1', () => emptyProgress());
      await store.applyEntitlement('acc-1', later(1000), NOW);
      await store.deleteAccount('acc-1');
      assert.equal(await store.accountByTokenHash('hash-1'), undefined);
      assert.equal(await store.getProgress('acc-1'), undefined);
      assert.equal(await store.getPremiumUntil('acc-1'), undefined);
    });
  });
}
