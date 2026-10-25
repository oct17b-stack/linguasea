import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { completeLesson, emptyProgress } from '@linguasea/core';

import { buildServer, type Options } from './app';
import { consoleMailer, createMailer, ResendMailer, type LoginCodeMail, type Mailer } from './mail';
import { PgStore } from './pg-store';
import type { Assessor, Score } from './pronunciation';
import { MemoryStore, type Store } from './store';
import { testDb } from './test-db';

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

test('takes the progress of a learner far into all four courses (over 1 MB)', async () => {
  const { app, auth } = await setup();
  const card = { due: '2026-11-20T09:00:00.000Z', stability: 31.26219, difficulty: 5.312345, elapsed_days: 12, scheduled_days: 31, learning_steps: 0, reps: 7, lapses: 1, state: 2, last_review: '2026-10-20T09:00:00.000Z' };
  const progress = emptyProgress();
  for (const t of ['zh', 'en', 'ja', 'ko']) for (let i = 0; i < 3500; i++) progress.cards[`${t}.word-${i}`] = card;
  const payload = JSON.stringify(progress);
  assert.ok(payload.length > 2_500_000);
  const res = await app.inject({ method: 'PUT', url: '/v1/progress', headers: { ...auth, 'content-type': 'application/json' }, payload });
  assert.equal(res.statusCode, 200);
  assert.equal(Object.keys(res.json().cards).length, 14_000);
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

test('serves the website, legal pages and generated audio', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'static-'));
  mkdirSync(join(dir, 'public/legal'), { recursive: true });
  mkdirSync(join(dir, 'audio/zh'), { recursive: true });
  writeFileSync(join(dir, 'public/index.html'), '<h1>LinguaSEA</h1>');
  writeFileSync(join(dir, 'public/legal/privacy-th.html'), '<h1>นโยบายความเป็นส่วนตัว</h1>');
  writeFileSync(join(dir, 'audio/zh/abc.mp3'), 'ID3');
  const { app } = await setup({ publicDir: join(dir, 'public'), audioDir: join(dir, 'audio') });
  assert.match((await app.inject({ url: '/' })).body, /LinguaSEA/);
  const page = await app.inject({ url: '/legal/privacy-th.html' });
  assert.equal(page.statusCode, 200);
  assert.match(page.body, /นโยบาย/);
  assert.equal((await app.inject({ url: '/health' })).statusCode, 200);
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

/** Captures sign-in mails instead of sending them. */
function mailbox() {
  const sent: LoginCodeMail[] = [];
  const mailer: Mailer = { sendLoginCode: async (mail) => void sent.push(mail) };
  return { mailer, sent, last: () => sent.at(-1)!.code };
}

/** A server with sign-in mail captured and a clock the test can move. */
async function signInSetup(options: Partial<Options> = {}) {
  const box = mailbox();
  const clock = { now: NOW };
  const s = await setup({ mailer: box.mailer, now: () => clock.now, ...options });
  const start = (email: string, headers: Record<string, string> = {}) =>
    s.app.inject({ method: 'POST', url: '/v1/auth/email/start', headers, payload: { email, l1: 'th' } });
  const verify = (email: string, code: string, headers: Record<string, string> = {}) =>
    s.app.inject({ method: 'POST', url: '/v1/auth/email/verify', headers, payload: { email, code } });
  /** Start + verify; returns the new session's auth header and body. */
  const signIn = async (email: string, headers: Record<string, string> = {}) => {
    assert.equal((await start(email)).statusCode, 204);
    const res = await verify(email, box.last(), headers);
    assert.equal(res.statusCode, 200, res.body);
    const body = res.json() as { id: string; token: string; email: string };
    return { ...body, auth: { authorization: `Bearer ${body.token}` } };
  };
  const me = async (auth: Record<string, string>) => s.app.inject({ url: '/v1/accounts/me', headers: auth });
  const anonymous = async () => {
    const res = await s.app.inject({ method: 'POST', url: '/v1/accounts' });
    const { id, token } = res.json() as { id: string; token: string };
    return { id, auth: { authorization: `Bearer ${token}` } };
  };
  return { ...s, box, clock, start, verify, signIn, me, anonymous };
}

test('email sign-in on a fresh install creates an account with the email', async () => {
  const { start, verify, box, me } = await signInSetup();
  assert.equal((await start('  Nam@Example.COM ')).statusCode, 204);
  assert.equal(box.sent.length, 1);
  assert.equal(box.sent[0].to, 'nam@example.com');
  assert.equal(box.sent[0].l1, 'th');
  assert.match(box.last(), /^\d{6}$/);
  const res = await verify('nam@example.com', box.last());
  assert.equal(res.statusCode, 200);
  const { id, token, email } = res.json();
  assert.equal(email, 'nam@example.com');
  const profile = await me({ authorization: `Bearer ${token}` });
  assert.deepEqual(profile.json(), { id, email: 'nam@example.com', premium: false, premiumUntil: null });
});

test('accounts/me needs a token and shows anonymous accounts without email', async () => {
  const { me, auth, id } = await signInSetup();
  assert.equal((await me({})).statusCode, 401);
  assert.deepEqual((await me(auth)).json(), { id, email: null, premium: false, premiumUntil: null });
});

test('signing in keeps an anonymous install\'s account; the old token keeps working', async () => {
  const { signIn, id, auth, me, app } = await signInSetup();
  await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true }, NOW) });
  const session = await signIn('nam@example.com', auth);
  assert.equal(session.id, id);
  assert.notEqual(session.auth.authorization, auth.authorization);
  assert.equal((await me(auth)).json().email, 'nam@example.com');
  const progress = await app.inject({ url: '/v1/progress', headers: session.auth });
  assert.deepEqual(Object.keys(progress.json().completed), ['zh-A1-01']);
});

test('a second device signs in to the same email and gets the merged progress and premium', async () => {
  const { app, signIn, anonymous, me, id, auth } = await signInSetup();
  const DAY = 86_400_000;
  // Phone: learns Chinese, subscribes, signs in.
  await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true }, NOW) });
  await app.inject({
    method: 'POST',
    url: '/v1/webhooks/revenuecat',
    headers: { authorization: 'Bearer hook-secret' },
    payload: { event: { type: 'INITIAL_PURCHASE', app_user_id: id, expiration_at_ms: NOW.getTime() + 30 * DAY, event_timestamp_ms: NOW.getTime() } },
  });
  const phone = await signIn('nam@example.com', auth);

  // Web: learned Korean anonymously, then signs in with the same email.
  const web = await anonymous();
  await app.inject({ method: 'PUT', url: '/v1/progress', headers: web.auth, payload: completeLesson(emptyProgress(), 'ko-A1-01', { 'ko.annyeonghaseyo': true }, NOW) });
  const session = await signIn('NAM@example.com', web.auth);
  assert.equal(session.id, id);
  assert.equal(session.email, 'nam@example.com');

  const progress = await app.inject({ url: '/v1/progress', headers: session.auth });
  assert.deepEqual(Object.keys(progress.json().completed).sort(), ['ko-A1-01', 'zh-A1-01']);
  const profile = (await me(session.auth)).json();
  assert.equal(profile.premium, true);
  assert.equal(profile.premiumUntil, new Date(NOW.getTime() + 30 * DAY).toISOString());
  // The web install's anonymous account is gone; the phone stays signed in.
  assert.equal((await me(web.auth)).statusCode, 401);
  assert.equal((await me(phone.auth)).json().id, id);
});

test('signing in without a token on another device returns the same account', async () => {
  const { signIn } = await signInSetup();
  const first = await signIn('nam@example.com');
  const second = await signIn('nam@example.com');
  assert.equal(second.id, first.id);
  assert.notEqual(second.token, first.token);
});

test('wrong codes, too many attempts, a replaced code and an expired code are refused', async () => {
  const { start, verify, box, clock } = await signInSetup();
  const email = 'nam@example.com';
  assert.equal((await start(email)).statusCode, 204);
  const code = box.last();
  const wrong = code === '000000' ? '111111' : '000000';
  const bad = await verify(email, wrong);
  assert.equal(bad.statusCode, 400);
  assert.deepEqual(bad.json(), { error: 'invalid code' });
  for (let i = 0; i < 4; i++) await verify(email, wrong);
  assert.deepEqual((await verify(email, code)).json(), { error: 'invalid code' }, 'five wrong guesses burn the code');

  await start(email);
  const replaced = box.last();
  await start(email);
  if (replaced !== box.last()) assert.equal((await verify(email, replaced)).statusCode, 400, 'a new code replaces the old one');
  assert.equal((await verify(email, box.last())).statusCode, 200);
  assert.equal((await verify(email, box.last())).statusCode, 400, 'a code works once');

  await start(email);
  clock.now = new Date(NOW.getTime() + 10 * 60_000 + 1);
  const expired = await verify(email, box.last());
  assert.equal(expired.statusCode, 400);
  assert.deepEqual(expired.json(), { error: 'code expired' });
  assert.deepEqual((await verify('nobody@example.com', '123456')).json(), { error: 'invalid code' });
});

test('email sign-in rejects malformed emails', async () => {
  const { start, verify, box } = await signInSetup();
  for (const email of ['', 'not-an-email', 'a@', `${'x'.repeat(250)}@example.com`]) {
    const res = await start(email);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.json(), { error: 'invalid email' });
  }
  assert.equal((await verify('nope', '123456')).statusCode, 400);
  assert.equal(box.sent.length, 0);
});

test('logout revokes only the token used', async () => {
  const { app, signIn, me } = await signInSetup();
  const phone = await signIn('nam@example.com');
  const web = await signIn('nam@example.com');
  assert.equal((await app.inject({ method: 'POST', url: '/v1/auth/logout', headers: web.auth })).statusCode, 204);
  assert.equal((await me(web.auth)).statusCode, 401);
  assert.equal((await me(phone.auth)).statusCode, 200);
});

test('deleting my data frees the email so it can sign up again', async () => {
  const { app, signIn, me } = await signInSetup();
  const first = await signIn('nam@example.com');
  const other = await signIn('nam@example.com');
  assert.equal((await app.inject({ method: 'DELETE', url: '/v1/accounts/me', headers: first.auth })).statusCode, 204);
  assert.equal((await me(other.auth)).statusCode, 401, 'every device of the account is signed out');
  const again = await signIn('nam@example.com');
  assert.notEqual(again.id, first.id);
  assert.equal((await me(again.auth)).json().email, 'nam@example.com');
});

test('limits sign-in codes per email and per IP each hour', async () => {
  const { start, clock } = await signInSetup();
  for (let i = 0; i < 5; i++) assert.equal((await start('nam@example.com')).statusCode, 204);
  assert.equal((await start('nam@example.com')).statusCode, 429);
  assert.equal((await start('other@example.com')).statusCode, 204);
  clock.now = new Date(NOW.getTime() + 3_600_001);
  assert.equal((await start('nam@example.com')).statusCode, 204, 'the window moves on');

  const ip = await signInSetup();
  const from = (n: number) => ({ 'x-forwarded-for': `203.0.113.${n}` });
  for (let i = 0; i < 20; i++) assert.equal((await ip.start(`learner${i}@example.com`, from(1))).statusCode, 204);
  assert.equal((await ip.start('learner20@example.com', from(1))).statusCode, 429);
  assert.equal((await ip.start('learner20@example.com', from(2))).statusCode, 204);
});

test('email sign-in answers 503 when mail is not configured (production)', async () => {
  assert.equal(createMailer({ production: true }), undefined);
  assert.equal(createMailer({ production: false }), consoleMailer);
  assert.ok(createMailer({ production: true, resend: { apiKey: 're_x', from: 'LinguaSEA <login@example.com>' } }) instanceof ResendMailer);
  const { app } = await setup({ mailer: createMailer({ production: true }) });
  const res = await app.inject({ method: 'POST', url: '/v1/auth/email/start', payload: { email: 'nam@example.com' } });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.json(), { error: 'email sign-in is not configured' });
});

test('development prints the code as one [mail] line on stdout', async () => {
  const { app } = await setup({ mailer: consoleMailer });
  const lines: string[] = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array, ...rest: never[]) => {
    if (String(chunk).startsWith('[mail]')) lines.push(String(chunk));
    return write(chunk, ...rest);
  }) as typeof process.stdout.write;
  try {
    const res = await app.inject({ method: 'POST', url: '/v1/auth/email/start', payload: { email: 'Nam@Example.com' } });
    assert.equal(res.statusCode, 204);
  } finally {
    process.stdout.write = write;
  }
  assert.equal(lines.length, 1);
  const code = /^\[mail\] login code for nam@example\.com: (\d{6})\n$/.exec(lines[0])?.[1];
  assert.ok(code, lines[0]);
  const verify = await app.inject({ method: 'POST', url: '/v1/auth/email/verify', payload: { email: 'nam@example.com', code } });
  assert.equal(verify.statusCode, 200);
});

test('Resend mailer sends the Thai code email', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fakeFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response('{"id":"1"}', { status: 200 });
  }) as unknown as typeof fetch;
  await new ResendMailer('re_key', 'LinguaSEA <login@example.com>', fakeFetch).sendLoginCode({ to: 'nam@example.com', code: '042137', l1: 'th' });
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal((calls[0].init.headers as Record<string, string>).authorization, 'Bearer re_key');
  const body = JSON.parse(String(calls[0].init.body));
  assert.deepEqual(body.to, ['nam@example.com']);
  assert.equal(body.from, 'LinguaSEA <login@example.com>');
  assert.match(body.subject, /042137/);
  assert.match(body.text, /042137[\s\S]*10 นาที/);

  const failing = (async () => new Response('bad', { status: 422 })) as unknown as typeof fetch;
  await assert.rejects(new ResendMailer('k', 'f', failing).sendLoginCode({ to: 'a@b.co', code: '1', l1: 'th' }));
  // A failed send is reported to the app.
  const { app } = await setup({ mailer: new ResendMailer('k', 'f', failing) });
  const res = await app.inject({ method: 'POST', url: '/v1/auth/email/start', payload: { email: 'nam@example.com' } });
  assert.equal(res.statusCode, 502);
});

test('serves the web app under /app/ with SPA fallback and caching', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'web-'));
  mkdirSync(join(dir, '_expo/static/js/web'), { recursive: true });
  writeFileSync(join(dir, 'index.html'), '<div id="root"></div>');
  writeFileSync(join(dir, 'favicon.ico'), 'ico');
  writeFileSync(join(dir, '_expo/static/js/web/entry-abc123.js'), 'console.log(1)');
  const { app } = await setup({ webDir: dir });

  const index = await app.inject({ url: '/app/' });
  assert.equal(index.statusCode, 200);
  assert.match(index.body, /root/);
  assert.equal(index.headers['cache-control'], 'no-cache');

  const route = await app.inject({ url: '/app/lesson/zh-A1-01?x=1' });
  assert.equal(route.statusCode, 200);
  assert.match(route.body, /root/);
  assert.match(String(route.headers['content-type']), /text\/html/);
  assert.equal(route.headers['cache-control'], 'no-cache');

  const js = await app.inject({ url: '/app/_expo/static/js/web/entry-abc123.js' });
  assert.equal(js.statusCode, 200);
  assert.match(String(js.headers['cache-control']), /immutable/);
  assert.equal((await app.inject({ url: '/app/_expo/static/js/web/missing.js' })).statusCode, 404, 'missing bundles are not HTML');
  assert.match(String((await app.inject({ url: '/app/favicon.ico' })).headers['cache-control']), /max-age=3600/);

  const bare = await app.inject({ url: '/app' });
  assert.equal(bare.statusCode, 302);
  assert.equal(bare.headers.location, '/app/');
  assert.equal((await app.inject({ url: '/v1/nothing' })).statusCode, 404);

  // Without a web build nothing is served there.
  const off = await setup({ webDir: join(dir, 'missing') });
  assert.equal((await off.app.inject({ url: '/app/lesson/x' })).statusCode, 404);
});

test('RevenueCat events for an account merged on sign-in reach the account it went into', async () => {
  const { app, signIn, anonymous, me } = await signInSetup();
  const DAY = 86_400_000;
  const phone = await signIn('nam@example.com');
  // The web install bought as an anonymous account, then signed in: it is merged into the phone's account.
  const web = await anonymous();
  const hook = (event: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', headers: { authorization: 'Bearer hook-secret' }, payload: { event } });
  await hook({ type: 'INITIAL_PURCHASE', app_user_id: web.id, expiration_at_ms: NOW.getTime() + DAY, event_timestamp_ms: NOW.getTime() });
  await signIn('nam@example.com', web.auth);
  assert.equal((await me(phone.auth)).json().premiumUntil, new Date(NOW.getTime() + DAY).toISOString());

  const renewal = await hook({ type: 'RENEWAL', app_user_id: web.id, expiration_at_ms: NOW.getTime() + 31 * DAY, event_timestamp_ms: NOW.getTime() + 1 });
  assert.equal(renewal.json().result, 'applied');
  assert.equal((await me(phone.auth)).json().premiumUntil, new Date(NOW.getTime() + 31 * DAY).toISOString());
  assert.equal((await hook({ type: 'RENEWAL', event_timestamp_ms: NOW.getTime() })).statusCode, 400, 'needs app_user_id');
});

test('RevenueCat TRANSFER moves the subscription to our surviving account', async () => {
  const { app, anonymous, signIn, me, clock, id: oldId, auth: oldAuth } = await signInSetup();
  const DAY = 86_400_000;
  const hook = (event: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', headers: { authorization: 'Bearer hook-secret' }, payload: { event } });
  // Bought on an old install, then "restore purchases" on a new install that signed in.
  await hook({ type: 'INITIAL_PURCHASE', app_user_id: oldId, expiration_at_ms: NOW.getTime() + 30 * DAY, event_timestamp_ms: NOW.getTime() });
  const fresh = await anonymous();
  const session = await signIn('nam@example.com', fresh.auth);
  const res = await hook({ type: 'TRANSFER', transferred_from: [oldId], transferred_to: [fresh.id], event_timestamp_ms: NOW.getTime() + 1 });
  assert.deepEqual(res.json(), { ok: true, result: 'applied' });
  clock.now = new Date(NOW.getTime() + 60_000);
  const now = (await me(session.auth)).json();
  assert.equal(now.premium, true);
  assert.equal(now.premiumUntil, new Date(NOW.getTime() + 30 * DAY).toISOString());
  assert.equal((await me(oldAuth)).json().premium, false, 'the account it left loses it');

  // Transfers between ids that are now the same account, or to ids we do not know, change nothing.
  const anon = await anonymous();
  await signIn('nam@example.com', anon.auth);
  assert.equal((await hook({ type: 'TRANSFER', transferred_from: [anon.id], transferred_to: [session.id], event_timestamp_ms: NOW.getTime() + 2 })).json().result, 'ignored');
  assert.equal((await me(session.auth)).json().premium, true);
  assert.equal((await hook({ type: 'TRANSFER', transferred_from: ['$RCAnonymousID:x'], transferred_to: ['$RCAnonymousID:y'] })).statusCode, 200);
});

test('rate limits reach the API, with the client IP taken from the trusted proxy hop only', async () => {
  const { app } = await setup({ rateLimit: 4 });
  // Four API requests a minute, then 429 (with CORS, so the web app can read it).
  for (let i = 0; i < 4; i++) assert.equal((await app.inject({ url: '/v1/entitlements' })).statusCode, 401);
  const limited = await app.inject({ url: '/v1/entitlements' });
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers['access-control-allow-origin'], '*');
  assert.equal((await app.inject({ url: '/health' })).statusCode, 200, 'only /v1/ is limited');

  // New accounts: 20 an hour per client. A client cannot reset its count by writing its own X-Forwarded-For
  // entries: the platform proxy appends the real address and only that last hop is trusted.
  const accounts = buildServer({ store: new MemoryStore() });
  const create = (xff: string) => accounts.inject({ method: 'POST', url: '/v1/accounts', headers: { 'x-forwarded-for': xff } });
  for (let i = 0; i < 20; i++) assert.equal((await create(`10.0.0.${i}, 198.51.100.7`)).statusCode, 201);
  assert.equal((await create('10.9.9.9, 198.51.100.7')).statusCode, 429);
  assert.equal((await create('198.51.100.8')).statusCode, 201, 'another client is counted on its own');

  // With no proxy in front, the header is ignored altogether.
  const direct = buildServer({ store: new MemoryStore(), trustProxy: 0 });
  for (let i = 0; i < 20; i++) await direct.inject({ method: 'POST', url: '/v1/accounts', headers: { 'x-forwarded-for': `10.0.1.${i}` } });
  assert.equal((await direct.inject({ method: 'POST', url: '/v1/accounts', headers: { 'x-forwarded-for': '10.0.2.1' } })).statusCode, 429);
});

for (const [name, makeStore] of [
  ['MemoryStore', async () => new MemoryStore()],
  ['PgStore', async () => new PgStore(await testDb())],
] as [string, () => Promise<Store>][]) {
  test(`${name}: a burst of guesses sent at once cannot get past the five-attempt limit`, async () => {
    // Database answers take a while (as over a network), so the guesses really overlap.
    const store = await makeStore();
    const slow = <A extends unknown[], R>(f: (...a: A) => Promise<R>) => async (...a: A) => {
      const result = await f(...a);
      await new Promise((r) => setTimeout(r, 30));
      return result;
    };
    store.getLoginCode = slow(store.getLoginCode.bind(store));
    store.failLoginCode = slow(store.failLoginCode.bind(store));
    const { start, verify, box } = await signInSetup({ store, rateLimit: 1000 });
    assert.equal((await start('nam@example.com')).statusCode, 204);
    const code = box.last();
    const wrong = [...Array(12).keys()].map((i) => String((Number(code) + 1 + i) % 1_000_000).padStart(6, '0'));
    // From many addresses so the per-IP limit does not stop them first; the right code comes last.
    const results = await Promise.all([...wrong, code].map((c, i) => verify('nam@example.com', c, { 'x-forwarded-for': `203.0.113.${i}` })));
    assert.deepEqual(new Set(results.map((r) => r.statusCode)), new Set([400]));
    assert.equal((await verify('nam@example.com', code)).statusCode, 400, 'the code is burnt');
    // Within the limit, the fifth try still signs in.
    await start('nam@example.com');
    const fresh = box.last();
    for (const c of wrong.slice(0, 4)) await verify('nam@example.com', c === fresh ? '999999x' : c);
    assert.equal((await verify('nam@example.com', fresh)).statusCode, 200);
  });
}

test("sign-in: email casing and spaces do not matter; a used code or another email's code does not work", async () => {
  const { start, verify, box, signIn } = await signInSetup();
  await start('nam@example.com');
  const code = box.last();
  const res = await verify('  NAM@Example.com ', ` ${code} `);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().email, 'nam@example.com');
  assert.equal((await verify('nam@example.com', code)).statusCode, 400, 'used once');
  await start('a@example.com');
  const forA = box.last();
  await start('b@example.com');
  if (forA !== box.last()) assert.equal((await verify('b@example.com', forA)).statusCode, 400, "another email's code");
  // A signed-in device that signs in to a second email moves there without merging the first account.
  const first = await signIn('first@example.com');
  const second = await signIn('second@example.com', first.auth);
  assert.notEqual(second.id, first.id);
});

test('RevenueCat: refunds end access, extensions and temporary grants extend it, bad timestamps are refused', async () => {
  const { app, id, auth } = await setup();
  const DAY = 86_400_000;
  let at = 0;
  const hook = (type: string, extra: Record<string, unknown> = {}) =>
    app.inject({
      method: 'POST',
      url: '/v1/webhooks/revenuecat',
      headers: { authorization: 'Bearer hook-secret' },
      payload: { event: { type, app_user_id: id, event_timestamp_ms: NOW.getTime() + ++at, ...extra } },
    });
  const entitlement = async () => (await app.inject({ url: '/v1/entitlements', headers: auth })).json();
  const day = (n: number) => new Date(NOW.getTime() + n * DAY).toISOString();

  await hook('INITIAL_PURCHASE', { expiration_at_ms: NOW.getTime() + 30 * DAY });
  // An unsubscribe keeps the period end.
  assert.equal((await hook('CANCELLATION', { cancel_reason: 'UNSUBSCRIBE', expiration_at_ms: NOW.getTime() + 30 * DAY })).json().result, 'applied');
  assert.equal((await entitlement()).premiumUntil, day(30));
  await hook('UNCANCELLATION', { expiration_at_ms: NOW.getTime() + 30 * DAY });
  assert.equal((await hook('SUBSCRIPTION_EXTENDED', { expiration_at_ms: NOW.getTime() + 40 * DAY })).json().result, 'applied');
  assert.equal((await entitlement()).premiumUntil, day(40));
  // A refund comes as a CANCELLATION whose expiration is the refund time: access ends now.
  await hook('CANCELLATION', { cancel_reason: 'CUSTOMER_SUPPORT', expiration_at_ms: NOW.getTime() - 1 });
  assert.equal((await entitlement()).premium, false);
  await hook('REFUND_REVERSED', { expiration_at_ms: NOW.getTime() + 40 * DAY });
  assert.equal((await entitlement()).premium, true);
  await hook('TEMPORARY_ENTITLEMENT_GRANT', { expiration_at_ms: NOW.getTime() + 50 * DAY });
  assert.equal((await entitlement()).premiumUntil, day(50));
  // Informational events leave it alone.
  for (const type of ['BILLING_ISSUE', 'SUBSCRIPTION_PAUSED', 'TEST', 'SOMETHING_NEW']) {
    assert.equal((await hook(type, { expiration_at_ms: NOW.getTime() })).json().result, 'ignored', type);
  }
  assert.equal((await entitlement()).premiumUntil, day(50));

  for (const bad of [{ expiration_at_ms: 1e20 }, { event_timestamp_ms: 1e20 }, { expiration_at_ms: -5 }, { expiration_at_ms: '2026' }]) {
    assert.equal((await hook('RENEWAL', bad)).statusCode, 400, JSON.stringify(bad));
  }
  const noAuth = await app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', payload: { event: { type: 'RENEWAL', app_user_id: id } } });
  assert.equal(noAuth.statusCode, 401);
  const unset = await setup({ revenueCatAuth: undefined });
  const refused = await unset.app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', headers: { authorization: '' }, payload: {} });
  assert.equal(refused.statusCode, 401, 'webhooks are refused when no secret is configured');
});

test('transcribe: has a daily allowance and refuses uploads that are not multipart', async () => {
  const { app, auth } = await setup({
    transcriber: { transcribe: async () => 'hi' },
    quotas: { pronunciationFree: 1, pronunciationPremium: 1, tutorFree: 2, tutorPremium: 10 },
  });
  const send = () => {
    const body = multipart({ target: 'en' }, Buffer.from('x'));
    return app.inject({ method: 'POST', url: '/v1/transcribe', headers: { ...auth, ...body.headers }, payload: body.payload });
  };
  for (let i = 0; i < 4; i++) assert.equal((await send()).statusCode, 200, 'two voice answers per tutor turn');
  const limited = await send();
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.json().limit, 4);
  const json = await app.inject({ method: 'POST', url: '/v1/transcribe', headers: auth, payload: { target: 'en' } });
  assert.equal(json.statusCode, 400);
  const big = multipart({ target: 'en' }, Buffer.alloc(2 * 1024 * 1024 + 1));
  const tooLarge = await app.inject({ method: 'POST', url: '/v1/transcribe', headers: { ...auth, ...big.headers }, payload: big.payload });
  assert.equal(tooLarge.statusCode, 413);
});

test('pronunciation: a recording the scorer cannot read answers 502 without internals', async () => {
  const assessor: Assessor = {
    assess: async () => {
      throw new Error('ffmpeg exited 1: /tmp/rec-abc/in: Invalid data found when processing input');
    },
  };
  const { app, auth } = await setup({ assessor });
  const body = multipart({ target: 'en', text: 'hi' }, Buffer.from('not audio'));
  const res = await app.inject({ method: 'POST', url: '/v1/pronunciation', headers: { ...auth, ...body.headers }, payload: body.payload });
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.json(), { error: 'scoring failed' });
});

test('unexpected failures answer 500 without internal details', async () => {
  const store = new MemoryStore();
  store.getProgress = async () => {
    throw new Error('connect ECONNREFUSED db.internal:5432 (password authentication failed for user linguasea)');
  };
  const { app, auth } = await setup({ store });
  const res = await app.inject({ url: '/v1/progress', headers: auth });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.json(), { error: 'internal error' });
  const bad = await app.inject({ method: 'PUT', url: '/v1/progress', headers: { ...auth, 'content-type': 'application/json' }, payload: '{nope' });
  assert.equal(bad.statusCode, 400, 'client errors keep their message');
});

test("progress: stale writes keep the newer card, accounts never see each other's data, bad shapes are refused", async () => {
  const { app, auth } = await setup();
  const other = (await app.inject({ method: 'POST', url: '/v1/accounts' })).json() as { token: string };
  const otherAuth = { authorization: `Bearer ${other.token}` };
  const first = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': false }, NOW);
  const later = completeLesson(first, 'zh-A1-02', { 'zh.ni-hao': true }, new Date(NOW.getTime() + 86_400_000));
  await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: later });
  // A device that was offline sends its older copy of the card.
  const res = await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload: first });
  assert.deepEqual(res.json().cards['zh.ni-hao'], later.cards['zh.ni-hao']);
  assert.equal(res.json().xp, later.xp);
  assert.deepEqual((await app.inject({ url: '/v1/progress', headers: otherAuth })).json(), emptyProgress());

  for (const payload of [
    { ...emptyProgress(), version: 2 },
    { ...emptyProgress(), xp: 1.5 },
    { ...emptyProgress(), cards: { 'zh.x': { reps: 1 } } },
    { ...emptyProgress(), completed: { 'zh-A1-01': 5 } },
    [],
  ]) {
    assert.equal((await app.inject({ method: 'PUT', url: '/v1/progress', headers: auth, payload })).statusCode, 400, JSON.stringify(payload));
  }
  const proto = await app.inject({
    method: 'PUT',
    url: '/v1/progress',
    headers: { ...auth, 'content-type': 'application/json' },
    payload: '{"version":1,"completed":{},"cards":{"__proto__":{"due":"x","reps":1}},"xp":0,"streak":{"count":0}}',
  });
  assert.equal(proto.statusCode, 400);
  const huge = await app.inject({
    method: 'PUT',
    url: '/v1/progress',
    headers: { ...auth, 'content-type': 'application/json' },
    payload: ' '.repeat(9 * 1024 * 1024),
  });
  assert.equal(huge.statusCode, 413);
});

test('static files: no path traversal, audio content types, JSON 404s', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'static-'));
  mkdirSync(join(dir, 'public'), { recursive: true });
  mkdirSync(join(dir, 'audio/zh'), { recursive: true });
  mkdirSync(join(dir, 'web'), { recursive: true });
  writeFileSync(join(dir, 'public/index.html'), '<h1>LinguaSEA</h1>');
  writeFileSync(join(dir, 'audio/zh/abc.mp3'), 'ID3');
  writeFileSync(join(dir, 'web/index.html'), '<div id="root"></div>');
  writeFileSync(join(dir, 'secret.txt'), 'TOP-SECRET');
  const { app } = await setup({ publicDir: join(dir, 'public'), audioDir: join(dir, 'audio'), webDir: join(dir, 'web') });

  assert.equal((await app.inject({ url: '/audio/zh/abc.mp3' })).headers['content-type'], 'audio/mpeg');
  for (const url of [
    '/audio/../secret.txt',
    '/audio/..%2fsecret.txt',
    '/audio/%2e%2e/secret.txt',
    '/audio/zh/..%2f..%2fsecret.txt',
    '/app/..%2fsecret.txt',
    '/app/%2e%2e/secret.txt',
    '/..%2fsecret.txt',
    '//secret.txt',
  ]) {
    assert.doesNotMatch((await app.inject({ url })).body, /TOP-SECRET/, url);
  }
  const missing = await app.inject({ url: '/audio/zh/missing.mp3' });
  assert.equal(missing.statusCode, 404);
  assert.match(String(missing.headers['content-type']), /json/);
  assert.equal(missing.headers['cache-control'], undefined, 'a 404 is not cached for a year');
});

test('deleting the account removes it everywhere: tokens, progress, subscription, aliases, pending codes', async () => {
  const store = new PgStore(await testDb());
  const { app, signIn, anonymous, start, me } = await signInSetup({ store });
  const hook = (event: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/v1/webhooks/revenuecat', headers: { authorization: 'Bearer hook-secret' }, payload: { event } });
  const anon = await anonymous();
  const progress = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true }, NOW);
  await app.inject({ method: 'PUT', url: '/v1/progress', headers: anon.auth, payload: progress });
  await hook({ type: 'INITIAL_PURCHASE', app_user_id: anon.id, expiration_at_ms: NOW.getTime() + 86_400_000, event_timestamp_ms: NOW.getTime() });
  const phone = await signIn('nam@example.com');
  await signIn('nam@example.com', anon.auth); // merged: anon.id is now an alias
  await start('nam@example.com'); // a pending code
  assert.equal((await me(phone.auth)).json().premium, true);

  assert.equal((await app.inject({ method: 'DELETE', url: '/v1/accounts/me', headers: phone.auth })).statusCode, 204);
  assert.equal((await me(phone.auth)).statusCode, 401);
  const db = (store as unknown as { db: { query(sql: string): Promise<{ rows: { n: number }[] }> } }).db;
  for (const table of ['accounts', 'tokens', 'account_aliases', 'login_codes', 'progress', 'entitlements', 'usage']) {
    // Only the anonymous account setup() made is left.
    const { rows } = await db.query(`select count(*)::int as n from ${table}`);
    assert.equal(rows[0].n, table === 'accounts' || table === 'tokens' ? 1 : 0, table);
  }
  const late = await hook({ type: 'RENEWAL', app_user_id: anon.id, expiration_at_ms: NOW.getTime() + 9e9, event_timestamp_ms: NOW.getTime() + 5 });
  assert.equal(late.json().result, 'unknown-account', 'store events for the deleted account recreate nothing');
});
