import type { Target } from '@linguasea/contract';
import type { Progress } from '@linguasea/core';

import { API_URL } from '@/lib/config';
import { secureStore } from '@/lib/secure-store';

/**
 * Client for the LinguaSEA server (server/src/app.ts). Everything here is optional: without
 * EXPO_PUBLIC_API_URL nothing is called and the app works offline. Calls throw on network
 * errors; callers treat that as "try again on the next sync", never as something to show.
 */
export const apiEnabled = !!API_URL;

/** Anonymous account made per install (sign-in with Apple / Google / LINE attaches to it later). */
export type Account = { id: string; token: string };

export type Entitlements = { premium: boolean; premiumUntil: string | null };

export type WordScore = { word: string; accuracy: number; error?: string };

export type PronunciationScore = {
  /** "no-speech": nothing usable was heard (all scores 0). */
  status: 'ok' | 'no-speech';
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  recognized: string;
  words: WordScore[];
};

export type ScoreResult =
  | { kind: 'scored'; score: PronunciationScore }
  /** Daily quota used up (premium accounts get a higher one). */
  | { kind: 'limit'; limit?: number }
  /** No server, or scoring is not configured on it (503). */
  | { kind: 'unavailable' }
  /** No connection / timed out. */
  | { kind: 'offline' }
  | { kind: 'failed' };

/** A recording to upload: a Blob on web, a file on disk ({ uri, name, type }) in the apps. */
export type RecordingFile = { blob: Blob; name: string } | { uri: string; name: string; type: string };

const ACCOUNT_KEY = 'linguasea.account';
const TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 30_000;

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`server answered ${status}`);
  }
}

// ---------- account ----------

/** undefined = not read from storage yet. */
let account: Account | null | undefined;
let creating: Promise<Account> | undefined;
const accountListeners = new Set<(account: Account | null) => void>();

function isAccount(x: unknown): x is Account {
  const a = x as Account | null;
  return !!a && typeof a.id === 'string' && !!a.id && typeof a.token === 'string' && !!a.token;
}

/** Called when an account is created or forgotten (purchases log in with our account id). */
export function onAccountChange(listener: (account: Account | null) => void): () => void {
  accountListeners.add(listener);
  return () => accountListeners.delete(listener);
}

export async function currentAccount(): Promise<Account | null> {
  if (account === undefined) {
    try {
      const raw = await secureStore.get(ACCOUNT_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      account = isAccount(parsed) ? parsed : null;
    } catch {
      account = null;
    }
  }
  return account;
}

/** The account, created on first use (lazily: only once there is something to sync or score). */
async function ensureAccount(): Promise<Account> {
  const existing = await currentAccount();
  if (existing) return existing;
  creating ??= (async () => {
    try {
      const res = await send('/v1/accounts', { method: 'POST' });
      if (res.status !== 201) throw new HttpError(res.status);
      const body: unknown = await res.json();
      if (!isAccount(body)) throw new HttpError(res.status);
      const created = { id: body.id, token: body.token };
      account = created;
      await secureStore.set(ACCOUNT_KEY, JSON.stringify(created)).catch(() => {});
      accountListeners.forEach((l) => l(created));
      return created;
    } finally {
      creating = undefined;
    }
  })();
  return creating;
}

export async function forgetAccount(): Promise<void> {
  account = null;
  await secureStore.remove(ACCOUNT_KEY).catch(() => {});
  accountListeners.forEach((l) => l(null));
}

// ---------- transport ----------

async function send(path: string, init: RequestInit = {}, timeout = TIMEOUT_MS): Promise<Response> {
  if (!API_URL) throw new Error('no server configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function withToken(init: RequestInit, token: string): RequestInit {
  return { ...init, headers: { ...(init.headers as Record<string, string> | undefined), authorization: `Bearer ${token}` } };
}

/**
 * Authenticated request. A 401 means the server no longer knows this install (account deleted
 * elsewhere, development server restarted): the token is dropped and, when `create` is set,
 * a fresh account is made and the request sent once more. Undefined when there is no account.
 */
async function authed(path: string, init: RequestInit, opts: { create: boolean; timeout?: number }): Promise<Response | undefined> {
  const acc = opts.create ? await ensureAccount() : await currentAccount();
  if (!acc) return undefined;
  const res = await send(path, withToken(init, acc.token), opts.timeout);
  if (res.status !== 401) return res;
  if (account?.token === acc.token) await forgetAccount();
  if (!opts.create) return undefined;
  const fresh = await ensureAccount();
  return send(path, withToken(init, fresh.token), opts.timeout);
}

// ---------- endpoints ----------

function isProgress(x: unknown): x is Progress {
  const p = x as Progress | null;
  return (
    !!p &&
    p.version === 1 &&
    typeof p.completed === 'object' &&
    p.completed !== null &&
    typeof p.cards === 'object' &&
    p.cards !== null &&
    typeof p.xp === 'number' &&
    typeof p.streak === 'object' &&
    p.streak !== null &&
    typeof p.streak.count === 'number'
  );
}

/** Sends this device's progress; the server merges it with its copy and returns the result to adopt. */
export async function syncProgress(local: Progress): Promise<Progress> {
  const res = await authed(
    '/v1/progress',
    { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(local) },
    { create: true },
  );
  if (!res?.ok) throw new HttpError(res?.status ?? 0);
  const body: unknown = await res.json();
  if (!isProgress(body)) throw new HttpError(res.status);
  return body;
}

/** Subscription state known to the server (RevenueCat webhooks). Undefined while there is no account. */
export async function fetchEntitlements(): Promise<Entitlements | undefined> {
  if (!apiEnabled) return undefined;
  const res = await authed('/v1/entitlements', {}, { create: false });
  if (!res) return undefined;
  if (!res.ok) throw new HttpError(res.status);
  const body = (await res.json()) as Partial<Entitlements> | null;
  return {
    premium: body?.premium === true,
    premiumUntil: typeof body?.premiumUntil === 'string' ? body.premiumUntil : null,
  };
}

/** "Delete my data": removes the server account with everything stored for it, then the token. */
export async function deleteAccount(): Promise<void> {
  const acc = await currentAccount();
  if (acc && apiEnabled) {
    const res = await send('/v1/accounts/me', withToken({ method: 'DELETE' }, acc.token));
    // 401: the server has already forgotten this account, which is what we want.
    if (!res.ok && res.status !== 401) throw new HttpError(res.status);
  }
  await forgetAccount();
}

const score100 = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 0);

function parseScore(x: unknown): PronunciationScore | undefined {
  const b = x as Record<string, unknown> | null;
  if (!b || (b.status !== 'ok' && b.status !== 'no-speech')) return undefined;
  const words = Array.isArray(b.words)
    ? b.words.flatMap((w: unknown): WordScore[] => {
        const r = w as Record<string, unknown> | null;
        if (!r || typeof r.word !== 'string') return [];
        return [{ word: r.word, accuracy: score100(r.accuracy), ...(typeof r.error === 'string' ? { error: r.error } : {}) }];
      })
    : [];
  return {
    status: b.status,
    overall: score100(b.overall),
    accuracy: score100(b.accuracy),
    fluency: score100(b.fluency),
    completeness: score100(b.completeness),
    recognized: typeof b.recognized === 'string' ? b.recognized : '',
    words,
  };
}

/** Pronunciation scoring of one recording against the text the learner was asked to say. */
export async function scorePronunciation(input: { target: Target; text: string; audio: RecordingFile }): Promise<ScoreResult> {
  if (!apiEnabled) return { kind: 'unavailable' };
  const form = new FormData();
  form.append('target', input.target);
  form.append('text', input.text);
  if ('blob' in input.audio) form.append('audio', input.audio.blob, input.audio.name);
  // React Native streams { uri, name, type } parts straight from the file.
  else form.append('audio', input.audio as unknown as Blob);

  let res: Response | undefined;
  try {
    res = await authed('/v1/pronunciation', { method: 'POST', body: form }, { create: true, timeout: UPLOAD_TIMEOUT_MS });
  } catch (e) {
    return e instanceof HttpError ? { kind: 'failed' } : { kind: 'offline' };
  }
  if (!res) return { kind: 'failed' };
  if (res.status === 503) return { kind: 'unavailable' };
  if (res.status === 429) {
    const body = (await res.json().catch(() => null)) as { limit?: unknown } | null;
    return { kind: 'limit', limit: typeof body?.limit === 'number' ? body.limit : undefined };
  }
  if (!res.ok) return { kind: 'failed' };
  const score = parseScore(await res.json().catch(() => null));
  return score ? { kind: 'scored', score } : { kind: 'failed' };
}

// ---------- static files ----------

/** Generated speech clip, `path` as listed in the content bundle's `audio` map. */
export function audioUrl(path: string): string | undefined {
  return API_URL ? `${API_URL}/audio/${path.split('/').map(encodeURIComponent).join('/')}` : undefined;
}

/** Privacy policy / terms page, in Thai or English. Undefined without a server. */
export function legalUrl(page: 'privacy' | 'terms', lang: 'th' | 'en'): string | undefined {
  return API_URL ? `${API_URL}/legal/${page}-${lang}.html` : undefined;
}
