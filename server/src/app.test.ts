import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { completeLesson, emptyProgress } from '@linguasea/core';

import { buildServer, type Options } from './app';
import type { Assessor, Score } from './pronunciation';
import { MemoryStore } from './store';

const NOW = new Date('2026-10-22T09:00:00Z');

const SCORE: Score = {
  status: 'ok',
  overall: 87,
  accuracy: 90,
  fluency: 85,
  completeness: 100,
  recognized: '你好',
  words: [{ word: '你好', accuracy: 90 }],
};

async function setup(options: Partial<Options> = {}) {
  const app = buildServer({ store: new MemoryStore(), revenueCatAuth: 'Bearer hook-secret', now: () => NOW, ...options });
  const res = await app.inject({ method: 'POST', url: '/v1/accounts' });
  assert.equal(res.statusCode, 201);
  const { id, token } = res.json() as { id: string; token: string };
  return { app, id, auth: { authorization: `Bearer ${token}` } };
}

/** A multipart body like the app sends: text fields, then the recording. */
function multipart(fields: Record<string, string>, audio?: Buffer) {
  const boundary = '----linguasea-test';
  const parts: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }
  if (audio) {
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="rec.m4a"\r\nContent-Type: audio/mp4\r\n\r\n`),
      audio,
      Buffer.from('\r\n'),
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
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

test('deleting my data removes the account', async () => {
  const { app, auth } = await setup();
  await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: emptyProgress() });
  assert.equal((await app.inject({ method: 'DELETE', url: '/v1/accounts/me', headers: auth })).statusCode, 204);
  assert.equal((await app.inject({ url: '/v1/progress', headers: auth })).statusCode, 401);
});

test('answers CORS preflight for the web app', async () => {
  const { app } = await setup();
  const res = await app.inject({ method: 'OPTIONS', url: '/v1/progress' });
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['access-control-allow-origin'], '*');
  assert.match(String(res.headers['access-control-allow-headers']), /authorization/);
});

test('RevenueCat webhook turns premium on and off, in event order', async () => {
  const { app, id, auth } = await setup();
  const hook = (type: string, at: number, expiration_at_ms?: number, secret = 'Bearer hook-secret', user = id) =>
    app.inject({
      method: 'POST',
      url: '/v1/webhooks/revenuecat',
      headers: { authorization: secret },
      payload: { event: { type, app_user_id: user, expiration_at_ms, event_timestamp_ms: NOW.getTime() + at } },
    });
  const premium = async () => (await app.inject({ url: '/v1/entitlements', headers: auth })).json().premium;
  const DAY = 86_400_000;

  assert.equal(await premium(), false);
  assert.equal((await hook('INITIAL_PURCHASE', 1, NOW.getTime() + DAY, 'Bearer wrong')).statusCode, 401);
  assert.equal(await premium(), false);

  await hook('INITIAL_PURCHASE', 1, NOW.getTime() + DAY);
  assert.equal(await premium(), true);
  await hook('CANCELLATION', 2);
  assert.equal(await premium(), true, 'cancelling keeps access until the period ends');
  await hook('EXPIRATION', 4, NOW.getTime() - 1);
  assert.equal(await premium(), false);
  // A renewal that happened before the expiration but arrived late must not revive access.
  assert.equal((await hook('RENEWAL', 3, NOW.getTime() + 30 * DAY)).json().result, 'stale');
  assert.equal(await premium(), false);
  // Purchases by users we do not know are acknowledged so RevenueCat stops retrying.
  const unknown = await hook('INITIAL_PURCHASE', 5, NOW.getTime() + DAY, 'Bearer hook-secret', '$RCAnonymousID:abc');
  assert.equal(unknown.statusCode, 200);
  assert.equal(unknown.json().result, 'unknown-account');
});

test('pronunciation: scores a recording through the assessor', async () => {
  const calls: unknown[] = [];
  const assessor: Assessor = { assess: async (input) => (calls.push(input), SCORE) };
  const { app, auth } = await setup({ assessor });
  const body = multipart({ target: 'zh', text: '你好' }, Buffer.from('fake-audio'));
  const res = await app.inject({ method: 'POST', url: '/v1/pronunciation', headers: { ...auth, ...body.headers }, payload: body.payload });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), SCORE);
  assert.deepEqual(calls, [{ audio: Buffer.from('fake-audio'), text: '你好', target: 'zh' }]);
});

test('pronunciation: validates input, needs scoring configured, and enforces the daily quota', async () => {
  const assessor: Assessor = { assess: async () => SCORE };
  const { app, auth } = await setup({ assessor, quotas: { pronunciationFree: 2, pronunciationPremium: 5, tutorFree: 1, tutorPremium: 1 } });
  const send = (fields: Record<string, string>, audio?: Buffer) => {
    const body = multipart(fields, audio);
    return app.inject({ method: 'POST', url: '/v1/pronunciation', headers: { ...auth, ...body.headers }, payload: body.payload });
  };
  const audio = Buffer.from('x');
  assert.equal((await send({ target: 'xx', text: 'hi' }, audio)).statusCode, 400);
  assert.equal((await send({ target: 'en', text: 'hi' })).statusCode, 400);
  assert.equal((await send({ target: 'en', text: 'hi' }, audio)).statusCode, 200);
  assert.equal((await send({ target: 'en', text: 'hi' }, audio)).statusCode, 200);
  const limited = await send({ target: 'en', text: 'hi' }, audio);
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.json().limit, 2);

  const off = await setup();
  const body = multipart({ target: 'en', text: 'hi' }, audio);
  const res = await off.app.inject({ method: 'POST', url: '/v1/pronunciation', headers: { ...off.auth, ...body.headers }, payload: body.payload });
  assert.equal(res.statusCode, 503);
});

test('serves legal pages and generated audio', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'static-'));
  mkdirSync(join(dir, 'legal'));
  mkdirSync(join(dir, 'audio/zh'), { recursive: true });
  writeFileSync(join(dir, 'legal/privacy-th.html'), '<h1>นโยบายความเป็นส่วนตัว</h1>');
  writeFileSync(join(dir, 'audio/zh/abc.mp3'), 'ID3');
  const { app } = await setup({ legalDir: join(dir, 'legal'), audioDir: join(dir, 'audio') });
  const page = await app.inject({ url: '/legal/privacy-th.html' });
  assert.equal(page.statusCode, 200);
  assert.match(page.body, /นโยบาย/);
  const clip = await app.inject({ url: '/audio/zh/abc.mp3' });
  assert.equal(clip.statusCode, 200);
  assert.match(String(clip.headers['cache-control']), /immutable/);
});

test('transcribe: turns a voice answer into text', async () => {
  const { app, auth } = await setup({ transcriber: { transcribe: async ({ target }) => `heard ${target}` } });
  const body = multipart({ target: 'ko' }, Buffer.from('x'));
  const res = await app.inject({ method: 'POST', url: '/v1/transcribe', headers: { ...auth, ...body.headers }, payload: body.payload });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { text: 'heard ko' });
});
