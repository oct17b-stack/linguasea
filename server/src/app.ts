import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { emptyProgress, mergeProgress, type Progress } from '@linguasea/core';
import Fastify, { type FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { Account, Store } from './store';

export type Options = {
  store: Store;
  /** Expected Authorization header on RevenueCat webhooks. Webhooks are refused when unset. */
  revenueCatAuth?: string;
  now?: () => Date;
  logger?: boolean;
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
  }),
});

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(sha256(a));
  const y = Buffer.from(sha256(b));
  return timingSafeEqual(x, y);
}

export function buildServer({ store, revenueCatAuth, now = () => new Date(), logger = false }: Options) {
  const app = Fastify({ logger });

  async function account(req: FastifyRequest): Promise<Account | undefined> {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    return token ? store.accountByTokenHash(sha256(token)) : undefined;
  }

  app.get('/health', async () => ({ ok: true }));

  // Anonymous account per install, so progress syncs before sign-in exists.
  // Apple / Google / LINE sign-in will attach to this account later.
  app.post('/v1/accounts', async (_req, reply) => {
    const token = randomBytes(32).toString('base64url');
    const acc: Account = { id: randomUUID(), tokenHash: sha256(token), createdAt: now().toISOString() };
    await store.createAccount(acc);
    return reply.code(201).send({ id: acc.id, token });
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
    const merged = mergeProgress(body.data as Progress, (await store.getProgress(acc.id)) ?? emptyProgress());
    await store.putProgress(acc.id, merged);
    return merged;
  });

  app.get('/v1/entitlements', async (req, reply) => {
    const acc = await account(req);
    if (!acc) return reply.code(401).send({ error: 'unauthorized' });
    const until = await store.getPremiumUntil(acc.id);
    return { premium: !!until && until > now(), premiumUntil: until?.toISOString() ?? null };
  });

  // RevenueCat is told our account id as its app_user_id (Purchases.logIn).
  app.post('/v1/webhooks/revenuecat', async (req, reply) => {
    if (!revenueCatAuth || !sameSecret(req.headers.authorization ?? '', revenueCatAuth)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
    const body = RevenueCatBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'invalid event' });
    const { type, app_user_id, expiration_at_ms } = body.data.event;
    if (ACTIVE_EVENTS.has(type) && expiration_at_ms) {
      await store.setPremiumUntil(app_user_id, new Date(expiration_at_ms));
    } else if (type === 'EXPIRATION') {
      await store.setPremiumUntil(app_user_id, now());
    }
    // CANCELLATION only stops renewal; access continues until EXPIRATION.
    return { ok: true };
  });

  return app;
}
