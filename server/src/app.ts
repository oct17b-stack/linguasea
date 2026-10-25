import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { L1, Target, type Bundle } from '@linguasea/contract';
import { dayKey, emptyProgress, mergeProgress, type Progress } from '@linguasea/core';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { z } from 'zod';

import { LOGIN_CODE_MINUTES, type Mailer } from './mail';
import { AssessError, type Assessor, type Transcriber } from './pronunciation';
import { buildScenario } from './scenarios';
import type { Account, Store } from './store';
import { redactPersonalInfo, TutorError, type Tutor } from './tutor';

export type Quotas = {
  pronunciationFree: number;
  pronunciationPremium: number;
  /** AI tutor turns per day (voice input counts against the same allowance). */
  tutorFree: number;
  tutorPremium: number;
};

/** Accounts unused this long are deleted with everything stored for them (privacy policy). */
export const INACTIVE_ACCOUNT_DAYS = 730;

export const DEFAULT_QUOTAS: Quotas = {
  pronunciationFree: 10,
  pronunciationPremium: 200,
  tutorFree: 6,
  tutorPremium: 30,
};

export type Options = {
  store: Store;
  /** Expected Authorization header on RevenueCat webhooks. Webhooks are refused when unset. */
  revenueCatAuth?: string;
  /** Pronunciation scoring; the endpoint answers 503 when absent. */
  assessor?: Assessor;
  /** Speech to text for talking to the tutor; 503 when absent. */
  transcriber?: Transcriber;
  /** AI conversation partner; 503 when absent. */
  tutor?: Tutor;
  /** Course content, for building tutor scenarios. */
  bundle?: Bundle;
  quotas?: Quotas;
  /** Generated audio (tools/audio) served at /audio/. */
  audioDir?: string;
  /** Public website (landing and support pages, /legal/ policies) served at /. */
  publicDir?: string;
  /** Web build of the app (`expo export --platform web`) served at /app/. */
  webDir?: string;
  /** Delivers email sign-in codes; sign-in answers 503 when absent. */
  mailer?: Mailer;
  now?: () => Date;
  logger?: boolean;
  /** API requests per minute per client IP. */
  rateLimit?: number;
  /**
   * Reverse proxies in front of the server (load balancer, platform router). The client IP that rate
   * limits key on is read from X-Forwarded-For only this many hops deep; anything a client writes into
   * the header beyond that is ignored. Default 1 (one platform proxy); 0 when clients connect directly.
   */
  trustProxy?: number;
};

const ProgressBody = z.object({
  version: z.literal(1),
  completed: z.record(z.string(), z.string()),
  cards: z.record(z.string(), z.looseObject({ due: z.string(), reps: z.number() })),
  xp: z.number().int().min(0),
  streak: z.object({ count: z.number().int().min(0), lastDay: z.string().optional() }),
});

/** RevenueCat events that leave the subscription active until expiration_at_ms. */
const ACTIVE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
  // The store moved the end date (e.g. Apple/Google extended it), RevenueCat granted access during a
  // store outage, or a refund was reversed: all carry the new end in expiration_at_ms.
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'REFUND_REVERSED',
]);

/** Milliseconds since 1970 that make a valid Date (anything else would be an "Invalid Date"). */
const EpochMs = z.number().int().min(0).max(8.64e15);

const RevenueCatBody = z.object({
  event: z.looseObject({
    type: z.string(),
    app_user_id: z.string().optional(),
    // TRANSFER events: the subscription moved from these app user ids to those.
    transferred_from: z.array(z.string()).optional(),
    transferred_to: z.array(z.string()).optional(),
    expiration_at_ms: EpochMs.nullable().optional(),
    event_timestamp_ms: EpochMs.optional(),
  }),
});

const MAX_RECORDING_BYTES = 2 * 1024 * 1024;
const MAX_PROGRESS_BYTES = 8 * 1024 * 1024;

const TutorBody = z.object({
  target: Target,
  l1: L1.default('th'),
  unitId: z.string().max(20),
  history: z
    .array(z.object({ role: z.enum(['tutor', 'learner']), text: z.string().max(300) }))
    .max(40),
});

/** Trimmed and lower-cased, so one address is one account however it is typed. */
const Email = z.string().trim().toLowerCase().max(254).pipe(z.email());

const StartBody = z.object({ email: Email, l1: L1.catch('th') });
const VerifyBody = z.object({ email: Email, code: z.string().trim().max(20) });

/** Email sign-in limits: codes sent per email and per client IP in an hour, wrong guesses per code. */
const CODES_PER_EMAIL = 5;
const CODES_PER_IP = 20;
const CODE_ATTEMPTS = 5;
const HOUR = 3_600_000;

/** Counts events per key over a sliding window (in this process). */
function windowCounter(windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, max: number, at: number): boolean => {
    if (hits.size > 10_000) {
      for (const [k, times] of hits) if (times.every((t) => t <= at - windowMs)) hits.delete(k);
    }
    const recent = (hits.get(key) ?? []).filter((t) => t > at - windowMs);
    const allowed = recent.length < max;
    if (allowed) recent.push(at);
    hits.set(key, recent);
    return allowed;
  };
}

/** Voice answers (speech to text) per tutor turn of the daily allowance, so a learner can re-record. */
const VOICE_ANSWERS_PER_TURN = 2;

/** Older turns are dropped beyond this; the scenario keeps the conversation on track. */
const TUTOR_HISTORY = 24;

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const codeHash = (email: string, code: string) => sha256(`${email}:${code}`);
const newToken = () => randomBytes(32).toString('base64url');

function sameSecret(a: string, b: string): boolean {
  return timingSafeEqual(Buffer.from(sha256(a)), Buffer.from(sha256(b)));
}

export function buildServer({
  store,
  revenueCatAuth,
  assessor,
  transcriber,
  tutor,
  bundle,
  quotas = DEFAULT_QUOTAS,
  audioDir,
  publicDir,
  webDir,
  mailer,
  now = () => new Date(),
  logger = false,
  rateLimit: perMinute = 300,
  trustProxy = 1,
}: Options) {
  // A hop count, not `true`: trusting every hop would take the left-most X-Forwarded-For entry,
  // which the client writes itself, and every per-IP limit could be dodged by changing it.
  const app = Fastify({ logger, trustProxy: (_address: string, hop: number) => hop < trustProxy });

  // Limits the API only: static files (audio clips, the website) are cached and many learners can share
  // one carrier-grade NAT address.
  app.register(rateLimit, { max: perMinute, timeWindow: '1 minute', allowList: (req) => !req.url.startsWith('/v1/') });

  // Unexpected failures (database errors, bugs) are logged; the client gets no internal details.
  app.setErrorHandler((error: { statusCode?: number }, req, reply) => {
    const status = error.statusCode ?? 500;
    if (status < 500) return reply.send(error);
    req.log.error(error);
    return reply.code(status).send({ error: 'internal error' });
  });
  app.register(multipart, { limits: { fileSize: MAX_RECORDING_BYTES, files: 1, fields: 4 } });

  // Apps authenticate with a bearer token, never cookies, so any origin may call the API (web build).
  app.addHook('onRequest', async (req, reply) => {
    reply.header('access-control-allow-origin', '*');
    if (req.method === 'OPTIONS') {
      reply
        .header('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS')
        .header('access-control-allow-headers', 'authorization, content-type')
        .header('access-control-max-age', '86400')
        .code(204)
        .send();
    }
  });

  if (audioDir && existsSync(audioDir)) {
    // File names are content hashes, so clips can be cached forever.
    app.register(fastifyStatic, { root: audioDir, prefix: '/audio/', immutable: true, maxAge: '365d' });
  }
  if (publicDir && existsSync(publicDir)) {
    app.register(fastifyStatic, { root: publicDir, prefix: '/', decorateReply: false, maxAge: '1h' });
  }

  // The web app: hashed bundles under /app/_expo/ never change; index.html must always be fresh.
  const webIndex = webDir && existsSync(join(webDir, 'index.html')) ? join(webDir, 'index.html') : undefined;
  if (webDir && webIndex) {
    const webRoot = resolve(webDir);
    app.register(fastifyStatic, {
      root: webRoot,
      prefix: '/app/',
      decorateReply: false,
      cacheControl: false,
      setHeaders(reply, path) {
        const hashed = relative(webRoot, path).split(sep)[0] === '_expo';
        reply.header(
          'cache-control',
          hashed ? 'public, max-age=31536000, immutable' : path.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
        );
      },
    });
    app.get('/app', (_req, reply) => reply.redirect('/app/'));
  }

  // Routes of the web app (/app/lesson/…) are not files: they get index.html and the app's router takes over.
  app.setNotFoundHandler(async (req, reply) => {
    const path = req.url.split('?')[0];
    if (webIndex && (req.method === 'GET' || req.method === 'HEAD') && path.startsWith('/app/') && !path.startsWith('/app/_expo/')) {
      const html = await readFile(webIndex).catch(() => undefined); // gone while running (rebuilt)
      if (html) return reply.header('cache-control', 'no-cache').type('text/html; charset=utf-8').send(html);
    }
    return reply.code(404).send({ message: `Route ${req.method}:${req.url} not found`, error: 'Not Found', statusCode: 404 });
  });

  // The API is a plugin of its own so that it loads after @fastify/rate-limit: the limits only reach
  // routes declared once that plugin has loaded (routes added straight to `app` here would get none).
  app.register(async (app) => {
    function bearer(req: FastifyRequest): string | undefined {
      return /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    }

    async function account(req: FastifyRequest): Promise<Account | undefined> {
      const token = bearer(req);
      const acc = token ? await store.accountByTokenHash(sha256(token)) : undefined;
      if (acc) await store.touchAccount(acc.id, now());
      return acc;
    }

    async function isPremium(id: string) {
      const until = await store.getPremiumUntil(id);
      return !!until && until > now();
    }

    app.get('/health', async () => ({ ok: true }));

    // Anonymous account per install, so progress syncs before sign-in exists.
    // Apple / Google / LINE sign-in will attach to this account later.
    app.post('/v1/accounts', { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } }, async (_req, reply) => {
      const token = newToken();
      const acc: Account = { id: randomUUID(), createdAt: now().toISOString() };
      await store.createAccount(acc, sha256(token));
      return reply.code(201).send({ id: acc.id, token });
    });

    app.get('/v1/accounts/me', async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      const until = await store.getPremiumUntil(acc.id);
      return {
        id: acc.id,
        email: acc.email ?? null,
        premium: !!until && until > now(),
        premiumUntil: until?.toISOString() ?? null,
      };
    });

    // Email sign-in, step 1: a 6-digit code by email. The answer is the same whether or not the
    // address has an account, so nobody can find out who uses the app.
    const codesSent = windowCounter(HOUR);
    app.post('/v1/auth/email/start', async (req, reply) => {
      const body = StartBody.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'invalid email' });
      if (!mailer) return reply.code(503).send({ error: 'email sign-in is not configured' });
      const { email, l1 } = body.data;
      const at = now().getTime();
      if (!codesSent(`ip:${req.ip}`, CODES_PER_IP, at) || !codesSent(`email:${email}`, CODES_PER_EMAIL, at)) {
        return reply.code(429).send({ error: 'too many codes requested, try again later' });
      }
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await store.saveLoginCode(email, codeHash(email, code), new Date(at + LOGIN_CODE_MINUTES * 60_000));
      try {
        await mailer.sendLoginCode({ to: email, code, l1 });
      } catch (e) {
        req.log.error(e, 'sending the login code failed');
        return reply.code(502).send({ error: 'could not send the email' });
      }
      return reply.code(204).send();
    });

    // Step 2: the code signs this device in. An anonymous install that signs in keeps its progress:
    // it becomes the email's account, or is merged into the account that already has the email.
    app.post('/v1/auth/email/verify', { config: { rateLimit: { max: 60, timeWindow: '1 hour' } } }, async (req, reply) => {
      const body = VerifyBody.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'invalid email' });
      const { email, code } = body.data;
      const pending = await store.getLoginCode(email);
      if (!pending) return reply.code(400).send({ error: 'invalid code' });
      if (pending.expiresAt <= now()) {
        await store.takeLoginCode(email);
        return reply.code(400).send({ error: 'code expired' });
      }
      // Every guess is counted (atomically) before it is compared: counting only wrong ones after the
      // comparison let many guesses sent at once all be compared before the code was burnt.
      const tries = await store.failLoginCode(email);
      if (tries > CODE_ATTEMPTS || !sameSecret(codeHash(email, code), pending.codeHash)) {
        if (tries >= CODE_ATTEMPTS) await store.takeLoginCode(email);
        return reply.code(400).send({ error: 'invalid code' });
      }
      // Two requests with the same code: only the one that removes it signs in.
      if (!(await store.takeLoginCode(email))) return reply.code(400).send({ error: 'invalid code' });

      const current = await account(req);
      let owner = await store.accountByEmail(email);
      if (!owner && current && !current.email) {
        // Lost a race for the email to another device: sign in to that account instead.
        owner = (await store.setEmail(current.id, email)) ? { ...current, email } : await store.accountByEmail(email);
      }
      const token = newToken();
      if (!owner) {
        owner = { id: randomUUID(), createdAt: now().toISOString(), email };
        await store.createAccount(owner, sha256(token));
      } else {
        if (current && current.id !== owner.id && !current.email) {
          await store.mergeAccounts(current.id, owner.id, (from, into) => mergeProgress(from, into ?? emptyProgress()));
        }
        await store.addToken(owner.id, sha256(token));
      }
      await store.touchAccount(owner.id, now());
      return { id: owner.id, token, email };
    });

    // Signs this device out; the account's other devices stay signed in.
    app.post('/v1/auth/logout', async (req, reply) => {
      const token = bearer(req);
      if (token) await store.revokeToken(sha256(token));
      return reply.code(204).send();
    });

    // "Delete my data" (PDPA, App Store guideline 5.1.1(v)).
    app.delete('/v1/accounts/me', async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      await store.deleteAccount(acc.id);
      return reply.code(204).send();
    });

    app.get('/v1/progress', async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      return (await store.getProgress(acc.id)) ?? emptyProgress();
    });

    // The device sends what it has; the server merges and returns the result for the device to adopt.
    // A course has 3,000–3,500 words and each review card is ~220 bytes, so someone far into several
    // courses sends a few MB: more than Fastify's 1 MB default.
    app.put('/v1/progress', { bodyLimit: MAX_PROGRESS_BYTES }, async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      const body = ProgressBody.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'invalid progress' });
      return store.updateProgress(acc.id, (current) => mergeProgress(body.data as Progress, current ?? emptyProgress()));
    });

    app.get('/v1/entitlements', async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      const until = await store.getPremiumUntil(acc.id);
      return { premium: !!until && until > now(), premiumUntil: until?.toISOString() ?? null };
    });

    /**
     * RevenueCat TRANSFER (e.g. "restore purchases" under another account): the subscription moves to our
     * account among transferred_to and ends for the accounts it left. The end date is the event's
     * expiration when given, else the latest one we have recorded for the accounts it came from.
     */
    async function transfer(
      event: { transferred_from?: string[]; transferred_to?: string[]; expiration_at_ms?: number | null },
      eventAt: Date,
    ): Promise<string> {
      const resolve = async (ids: string[] = []) => [...new Set(await Promise.all(ids.map((id) => store.resolveAccountId(id))))];
      const to = await resolve(event.transferred_to);
      const from = (await resolve(event.transferred_from)).filter((id) => !to.includes(id));
      let until = event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined;
      for (const id of from) {
        const u = await store.getPremiumUntil(id);
        if (!event.expiration_at_ms && u && (!until || u > until)) until = u;
      }
      let result = 'ignored';
      if (until) {
        for (const id of to) if ((await store.applyEntitlement(id, until, eventAt)) === 'applied') result = 'applied';
      }
      for (const id of from) if (await store.getPremiumUntil(id)) await store.applyEntitlement(id, eventAt, eventAt);
      return result;
    }

    // RevenueCat is told our account id as its app_user_id (Purchases.logIn).
    app.post('/v1/webhooks/revenuecat', { config: { rateLimit: false } }, async (req, reply) => {
      if (!revenueCatAuth || !sameSecret(req.headers.authorization ?? '', revenueCatAuth)) {
        return reply.code(401).send({ error: 'unauthorized' });
      }
      const body = RevenueCatBody.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'invalid event' });
      const { type, expiration_at_ms, event_timestamp_ms } = body.data.event;
      const eventAt = new Date(event_timestamp_ms ?? now().getTime());
      if (type === 'TRANSFER') return { ok: true, result: await transfer(body.data.event, eventAt) };
      if (!body.data.event.app_user_id) return reply.code(400).send({ error: 'invalid event' });
      // An anonymous account merged into another on sign-in keeps receiving events under its old id.
      const app_user_id = await store.resolveAccountId(body.data.event.app_user_id);
      let result: string = 'ignored';
      if ((ACTIVE_EVENTS.has(type) || type === 'CANCELLATION') && expiration_at_ms) {
        // CANCELLATION: an unsubscribe only stops renewal (expiration_at_ms is still the period end, so
        // access continues until then); a refund moves expiration_at_ms to the refund time and ends it.
        result = await store.applyEntitlement(app_user_id, new Date(expiration_at_ms), eventAt);
      } else if (type === 'EXPIRATION') {
        result = await store.applyEntitlement(app_user_id, new Date(expiration_at_ms ?? eventAt.getTime()), eventAt);
      }
      // Unknown users are acknowledged (200) so RevenueCat does not retry forever.
      if (result === 'unknown-account') req.log.warn({ app_user_id, type }, 'subscription event for unknown account');
      return { ok: true, result };
    });

    /**
     * Reads a recording upload: text fields first, then the file `audio`. On failure, the reply sent:
     * 413 when the upload is over the limits, 400 when it is not a (well-formed) multipart upload.
     */
    async function readRecording(req: FastifyRequest, reply: FastifyReply) {
      const fields: Record<string, string> = {};
      let audio: Buffer | undefined;
      try {
        for await (const part of req.parts()) {
          if (part.type === 'file') audio = await part.toBuffer();
          else fields[part.fieldname] = String(part.value);
        }
      } catch (e) {
        const tooLarge = (e as { statusCode?: number }).statusCode === 413;
        return {
          failed: tooLarge
            ? reply.code(413).send({ error: 'recording too large' })
            : reply.code(400).send({ error: 'expected a multipart upload' }),
        };
      }
      return { fields, audio };
    }

    /** Counts one use against today's allowance (higher for subscribers); the limit when it is used up. */
    async function overQuota(id: string, key: 'pronunciation' | 'tutor' | 'transcribe'): Promise<number | undefined> {
      const premium = await isPremium(id);
      const tutorLimit = premium ? quotas.tutorPremium : quotas.tutorFree;
      const limit =
        key === 'pronunciation'
          ? premium ? quotas.pronunciationPremium : quotas.pronunciationFree
          : key === 'tutor' ? tutorLimit : tutorLimit * VOICE_ANSWERS_PER_TURN;
      return (await store.useQuota(id, dayKey(now()), key, limit)) ? undefined : limit;
    }

    // Multipart: fields `target` and `text` (what the learner was asked to say), then file `audio`.
    app.post('/v1/pronunciation', async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      if (!assessor) return reply.code(503).send({ error: 'pronunciation scoring is not configured' });

      const upload = await readRecording(req, reply);
      if ('failed' in upload) return upload.failed;
      const t = Target.safeParse(upload.fields.target);
      const text = upload.fields.text;
      if (!t.success || !text || text.length > 200 || !upload.audio?.length) {
        return reply.code(400).send({ error: 'need target, text (≤200 chars) and audio' });
      }

      const limit = await overQuota(acc.id, 'pronunciation');
      if (limit !== undefined) return reply.code(429).send({ error: 'daily limit reached', limit });
      try {
        return await assessor.assess({ audio: upload.audio, text, target: t.data });
      } catch (e) {
        req.log.error(e, 'pronunciation assessment failed');
        return reply.code(502).send({ error: e instanceof AssessError ? e.message : 'scoring failed' });
      }
    });

    // Voice answers for the tutor. Multipart: field `target`, then file `audio`.
    app.post('/v1/transcribe', async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      if (!transcriber) return reply.code(503).send({ error: 'speech recognition is not configured' });

      const upload = await readRecording(req, reply);
      if ('failed' in upload) return upload.failed;
      const t = Target.safeParse(upload.fields.target);
      if (!t.success || !upload.audio?.length) return reply.code(400).send({ error: 'need target and audio' });

      // Speech recognition is paid per use: it has a daily allowance like the tutor turns it feeds.
      const limit = await overQuota(acc.id, 'transcribe');
      if (limit !== undefined) return reply.code(429).send({ error: 'daily limit reached', limit });
      try {
        return { text: await transcriber.transcribe({ audio: upload.audio, target: t.data }) };
      } catch (e) {
        req.log.error(e, 'transcription failed');
        return reply.code(502).send({ error: 'recognition failed' });
      }
    });

    // One AI tutor turn. The app keeps the conversation and sends it each time (the server stores none of it).
    app.post('/v1/tutor/turn', async (req, reply) => {
      const acc = await account(req);
      if (!acc) return reply.code(401).send({ error: 'unauthorized' });
      if (!tutor || !bundle) return reply.code(503).send({ error: 'the AI tutor is not configured' });

      const body = TutorBody.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'invalid tutor request' });
      const { target, l1, unitId } = body.data;
      const scenario = buildScenario(bundle, l1, target, unitId);
      if (!scenario) return reply.code(404).send({ error: 'unknown unit' });

      const limit = await overQuota(acc.id, 'tutor');
      if (limit !== undefined) return reply.code(429).send({ error: 'daily limit reached', limit });

      const history = body.data.history
        .slice(-TUTOR_HISTORY)
        // One line each (a newline in a learner line could pass for a line of the tutor's in the
        // transcript), and redacted whichever role they claim: the app sends both.
        .map((l) => ({ ...l, text: redactPersonalInfo(l.text.replace(/\s+/g, ' ').trim()) }));
      try {
        return await tutor.turn(scenario, history);
      } catch (e) {
        req.log.error(e, 'tutor turn failed');
        const busy = e instanceof Error && 'status' in e && (e as { status?: number }).status === 429;
        return reply
          .code(busy ? 503 : 502)
          .send({ error: e instanceof TutorError ? e.message : busy ? 'the tutor is busy, try again shortly' : 'tutor failed' });
      }
    });
  });

  return app;
}
