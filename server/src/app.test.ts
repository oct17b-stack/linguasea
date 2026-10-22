import assert from 'node:assert/strict';
import { test } from 'node:test';

import { completeLesson, emptyProgress } from '@linguasea/core';

import { buildServer } from './app';
import { MemoryStore } from './store';

const NOW = new Date('2026-10-22T09:00:00Z');

async function setup() {
  const app = buildServer({ store: new MemoryStore(), revenueCatAuth: 'Bearer hook-secret', now: () => NOW });
  const res = await app.inject({ method: 'POST', url: '/v1/accounts' });
  assert.equal(res.statusCode, 201);
  const { id, token } = res.json() as { id: string; token: string };
  return { app, id, auth: { authorization: `Bearer ${token}` } };
}

test('progress needs a valid token', async () => {
  const { app } = await setup();
  const res = await app.inject({ method: 'GET', url: '/v1/progress', headers: { authorization: 'Bearer nope' } });
  assert.equal(res.statusCode, 401);
});

test('progress from two devices is merged, not overwritten', async () => {
  const { app, auth } = await setup();
  const phone = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true }, NOW);
  const tablet = completeLesson(emptyProgress(), 'ko-A1-01', { 'ko.annyeonghaseyo': true }, NOW);
  await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: phone });
  const res = await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: tablet });
  assert.deepEqual(Object.keys(res.json().completed).sort(), ['ko-A1-01', 'zh-A1-01']);
  const get = await app.inject({ method: 'GET', url: '/v1/progress', headers: auth });
  assert.deepEqual(get.json(), res.json());
});

test('rejects malformed progress', async () => {
  const { app, auth } = await setup();
  const res = await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: { xp: -1 } });
  assert.equal(res.statusCode, 400);
});

test('RevenueCat webhook turns premium on and off', async () => {
  const { app, id, auth } = await setup();
  const hook = (type: string, expiration_at_ms?: number, secret = 'Bearer hook-secret') =>
    app.inject({
      method: 'POST',
      url: '/v1/webhooks/revenuecat',
      headers: { authorization: secret },
      payload: { event: { type, app_user_id: id, expiration_at_ms } },
    });
  const premium = async () => (await app.inject({ url: '/v1/entitlements', headers: auth })).json().premium;

  assert.equal(await premium(), false);
  assert.equal((await hook('INITIAL_PURCHASE', NOW.getTime() + 86_400_000, 'Bearer wrong')).statusCode, 401);
  assert.equal(await premium(), false);

  await hook('INITIAL_PURCHASE', NOW.getTime() + 86_400_000);
  assert.equal(await premium(), true);
  await hook('CANCELLATION');
  assert.equal(await premium(), true, 'cancelling keeps access until the period ends');
  await hook('EXPIRATION');
  assert.equal(await premium(), false);
});
