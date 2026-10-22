import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';

import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { L1, Target, type Bundle } from '@linguasea/contract';
import { dayKey, emptyProgress, mergeProgress, type Progress } from '@linguasea/core';
import Fastify, { type FastifyRequest } from 'fastify';
import { z } from 'zod';

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

export const DEFAULT_QUOTAS: Quotas = {
  pronunciationFree: 10,
  pronunciationPremium: 200,
  tutorFree: 6,
  tutorPremium: 150,
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
  now?: () => Date;
  logger?: boolean;
  /** Requests per minute per client IP. */
  rateLimit?: number;
};

const ProgressBody = z.object({
  version: z.literal(1),
  completed: z.record(z.string(), z.string()),
  cards: z.record(z.string(), z.looseObject({ due: z.string(), reps: z.number() })),
  xp: z.number().int().min(0),
  streak: z.object({ count: z.number().int().min(0), lastDay: z.string().optional() }),
});

/** RevenueCat events that leave the subscription active until expiration_at_ms. */
const ACTIVE_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE']);

const RevenueCatBody = z.object({
  event: z.looseObject({
    type: z.string(),
    app_user_id: z.string(),
    expiration_at_ms: z.number().nullable().optional(),
    event_timestamp_ms: z.number().optional(),
  }),
});

const MAX_RECORDING_BYTES = 2 * 1024 * 1024;

const TutorBody = z.object({
  target: Target,
  l1: L1.default('th'),
  unitId: z.string().max(20),
  history: z
    .array(z.object({ role: z.enum(['tutor', 'learner']), text: z.string().max(300) }))
    .max(40),
});

/** Older turns are dropped beyond this; the scenario keeps the conversation on track. */
const TUTOR_HISTORY = 24;

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

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
  now = () => new Date(),
  logger = false,
  rateLimit: perMinute = 300,
}: Options) {
  const app = Fastify({ logger, trustProxy: true });

  app.register(rateLimit, { max: perMinute, timeWindow: '1 minute' });
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

  async function account(req: FastifyRequest): Promise<Account | undefined> {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    return token ? store.accountByTokenHash(sha256(token)) : undefined;
  }

  async function isPremium(id: string) {
    const until = await store.getPremiumUntil(id);
    return !!until && until > now();
  }

  app.get('/health', async () => ({ ok: true }));

  // Anonymous account per install, so progress syncs before sign-in exists.
  // Apple / Google / LINE sign-in will attach to this account later.
  app.post('/v1/accounts', { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } }, async (_req, reply) => {
    const token = randomBytes(32).toString('base64url');
    const acc: Account = { id: randomUUID(), tokenHash: sha256(token), createdAt: now().toISOString() };
    await store.createAccount(acc);
    return reply.code(201).send({ id: acc.id, token });
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
  app.put('/v1/progress', async (req, reply) => {
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

  // RevenueCat is told our account id as its app_user_id (Purchases.logIn).
  app.post('/v1/webhooks/revenuecat', { config: { rateLimit: false } }, async (req, reply) => {
    if (!revenueCatAuth || !sameSecret(req.headers.authorization ?? '', revenueCatAuth)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
    const body = RevenueCatBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid event' });
    const { type, app_user_id, expiration_at_ms, event_timestamp_ms } = body.data.event;
    const eventAt = new Date(event_timestamp_ms ?? now().getTime());
    let result: string = 'ignored';
    if (ACTIVE_EVENTS.has(type) && expiration_at_ms) {
      result = await store.applyEntitlement(app_user_id, new Date(expiration_at_ms), eventAt);
    } else if (type === 'EXPIRATION') {
      result = await store.applyEntitlement(app_user_id, new Date(expiration_at_ms ?? eventAt.getTime()), eventAt);
    }
    // CANCELLATION only stops renewal; access continues until EXPIRATION.
    // Unknown users are acknowledged (200) so RevenueCat does not retry forever.
    if (result === 'unknown-account') req.log.warn({ app_user_id, type }, 'subscription event for unknown account');
    return { ok: true, result };
  });

  /** Reads a recording upload: text fields first, then the file `audio`. Undefined when the upload is too large. */
  async function readRecording(req: FastifyRequest) {
    const fields: Record<string, string> = {};
    let audio: Buffer | undefined;
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file') audio = await part.toBuffer();
        else fields[part.fieldname] = String(part.value);
      }
    } catch {
      return undefined;
    }
    return { fields, audio };
  }

  /** Counts one use against today's allowance (higher for subscribers); the limit when it is used up. */
  async function overQuota(id: string, key: 'pronunciation' | 'tutor'): Promise<number | undefined> {
    const premium = await isPremium(id);
    const limit =
      key === 'pronunciation'
        ? premium ? quotas.pronunciationPremium : quotas.pronunciationFree
        : premium ? quotas.tutorPremium : quotas.tutorFree;
    return (await store.useQuota(id, dayKey(now()), key, limit)) ? undefined : limit;
  }

  // Multipart: fields `target` and `text` (what the learner was asked to say), then file `audio`.
  app.post('/v1/pronunciation', async (req, reply) => {
    const acc = await account(req);
    if (!acc) return reply.code(401).send({ error: 'unauthorized' });
    if (!assessor) return reply.code(503).send({ error: 'pronunciation scoring is not configured' });

    const upload = await readRecording(req);
    if (!upload) return reply.code(413).send({ error: 'recording too large' });
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

    const upload = await readRecording(req);
    if (!upload) return reply.code(413).send({ error: 'recording too large' });
    const t = Target.safeParse(upload.fields.target);
    if (!t.success || !upload.audio?.length) return reply.code(400).send({ error: 'need target and audio' });
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
      .map((l) => (l.role === 'learner' ? { ...l, text: redactPersonalInfo(l.text) } : l));
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

  return app;
}
