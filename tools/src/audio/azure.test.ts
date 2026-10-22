import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  billableChars,
  escapeXml,
  isRegion,
  normalizeRegion,
  retryAfterMs,
  speechSettings,
  ssml,
  synthesize,
  SynthesisError,
  Throttle,
} from './azure';
import type { Voice } from './voices';

const NANAMI: Voice = { lang: 'ja-JP', name: 'ja-JP-NanamiNeural', rate: '-10%' };
const CONFIG = { key: 'test-key', region: 'southeastasia' };
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 1, 2, 3]);

const mp3 = () => new Response(MP3, { status: 200, headers: { 'content-type': 'audio/mpeg' } });
const status = (code: number, headers: Record<string, string> = {}, body = '') => new Response(body, { status: code, headers });

/** fetch that answers with the given responses in order (a thrown Error simulates a network failure). */
function fakeFetch(...answers: (Response | Error)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = answers.shift();
    if (!next) throw new Error('unexpected call');
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { fn, calls };
}

/** A fake clock whose sleep records the wait and moves time on. */
function recorder() {
  const c = {
    now: 0,
    waits: [] as number[],
    sleep: async (ms: number) => {
      c.waits.push(ms);
      c.now += ms;
    },
  };
  return c;
}

const netError = (code: string) => Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(code), { code }) });

describe('SSML', () => {
  it('escapes the five XML specials and drops characters XML cannot carry', () => {
    expect(escapeXml(`Tom & Jerry <3 "hi" it's`)).toBe('Tom &amp; Jerry &lt;3 &quot;hi&quot; it&apos;s');
    expect(escapeXml('a\u0007b\u0000c\td\ne')).toBe('abc\td\ne');
    expect(escapeXml('x\uD800y 😀')).toBe('xy 😀');
    expect(escapeXml('&amp;')).toBe('&amp;amp;');
  });

  it('wraps the text in speak / voice / prosody', () => {
    expect(ssml(NANAMI, 'こんにちは & <b>')).toBe(
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">' +
        '<voice name="ja-JP-NanamiNeural"><prosody rate="-10%">こんにちは &amp; &lt;b&gt;</prosody></voice></speak>',
    );
  });

  it('counts billable characters like Azure: Han twice, prosody markup included', () => {
    const markup = '<prosody rate="-10%"></prosody>'.length;
    expect(billableChars(NANAMI, 'ありがとう')).toBe(markup + 5);
    expect(billableChars(NANAMI, '日本')).toBe(markup + 4);
    expect(billableChars({ rate: '0%' }, 'Hi!')).toBe('<prosody rate="0%"></prosody>'.length + 3);
  });
});

describe('synthesize', () => {
  it('posts SSML to the regional endpoint with key, format and user agent', async () => {
    const { fn, calls } = fakeFetch(mp3());
    expect(await synthesize(CONFIG, NANAMI, 'はい', { fetch: fn })).toEqual(MP3);
    expect(calls).toHaveLength(1);
    const { url, init } = calls[0];
    expect(url).toBe('https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Ocp-Apim-Subscription-Key': 'test-key',
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'linguasea-audio-tool',
    });
    expect(init.body).toBe(ssml(NANAMI, 'はい'));
  });

  it('retries a 429 after Retry-After and pauses the other workers too', async () => {
    const clock = recorder();
    const throttle = new Throttle(() => clock.now);
    const pause = vi.spyOn(throttle, 'pause');
    const { fn, calls } = fakeFetch(status(429, { 'retry-after': '3' }), mp3());
    const retried: string[] = [];
    const data = await synthesize(CONFIG, NANAMI, 'はい', {
      fetch: fn,
      sleep: clock.sleep,
      throttle,
      onRetry: (problem, ms) => retried.push(`${problem} ${ms}`),
    });
    expect(data).toEqual(MP3);
    expect(calls).toHaveLength(2);
    expect(clock.waits).toEqual([3000]);
    expect(pause).toHaveBeenCalledWith(3000);
    expect(retried).toEqual(['Azure answered 429 3000']);
  });

  it('makes every worker wait out a shared pause', async () => {
    const clock = recorder();
    const throttle = new Throttle(() => clock.now);
    throttle.pause(3000);
    clock.now = 1000;
    await throttle.wait(clock.sleep);
    await throttle.wait(clock.sleep);
    expect(clock.waits).toEqual([2000]);
  });

  it('backs off exponentially on 5xx and network errors', async () => {
    const { fn, calls } = fakeFetch(status(503), netError('ECONNRESET'), status(500), mp3());
    const { waits, sleep } = recorder();
    expect(await synthesize(CONFIG, NANAMI, 'はい', { fetch: fn, sleep })).toEqual(MP3);
    expect(calls).toHaveLength(4);
    expect(waits).toEqual([1000, 2000, 4000]);
  });

  it('gives up after the retries and stops the run', async () => {
    const { fn, calls } = fakeFetch(status(429), status(429), status(429));
    const { sleep } = recorder();
    const error = await synthesize(CONFIG, NANAMI, 'はい', { fetch: fn, sleep, retries: 2 }).catch((e) => e);
    expect(error).toBeInstanceOf(SynthesisError);
    expect(error.fatal).toBe(true);
    expect(error.message).toBe('Azure answered 429; gave up after 3 attempts');
    expect(calls).toHaveLength(3);
  });

  it('fails one clip on 400 without retrying, and the whole run on a bad key', async () => {
    const bad = fakeFetch(status(400, {}, 'SSML is invalid'));
    const e400 = await synthesize(CONFIG, NANAMI, 'はい', { fetch: bad.fn }).catch((e) => e);
    expect(e400).toMatchObject({ fatal: false, message: 'Azure answered 400 (SSML is invalid)' });
    expect(bad.calls).toHaveLength(1);

    const denied = fakeFetch(status(401));
    const e401 = await synthesize(CONFIG, NANAMI, 'はい', { fetch: denied.fn }).catch((e) => e);
    expect(e401.fatal).toBe(true);
    expect(e401.message).toMatch(/^Azure answered 401: check AZURE_SPEECH_KEY/);
    expect(e401.message).not.toContain('test-key');
    expect(denied.calls).toHaveLength(1);
  });

  it('stops at once when the region host does not exist', async () => {
    const { fn, calls } = fakeFetch(netError('ENOTFOUND'));
    const error = await synthesize({ ...CONFIG, region: 'nowhere' }, NANAMI, 'はい', { fetch: fn }).catch((e) => e);
    expect(error.fatal).toBe(true);
    expect(error.message).toMatch(/^cannot resolve nowhere\.tts\.speech\.microsoft\.com: check AZURE_SPEECH_REGION/);
    expect(calls).toHaveLength(1);
  });

  it('rejects an empty or non-audio answer for that clip only', async () => {
    const empty = await synthesize(CONFIG, NANAMI, 'はい', { fetch: fakeFetch(status(200, { 'content-type': 'audio/mpeg' })).fn }).catch((e) => e);
    expect(empty).toMatchObject({ fatal: false, message: 'Azure sent an empty clip' });
    const html = await synthesize(CONFIG, NANAMI, 'はい', {
      fetch: fakeFetch(status(200, { 'content-type': 'text/html' }, '<html>')).fn,
    }).catch((e) => e);
    expect(html).toMatchObject({ fatal: false, message: 'Azure sent text/html instead of audio' });
  });
});

describe('retryAfterMs', () => {
  it('reads seconds or an HTTP date, capped at two minutes', () => {
    const now = Date.parse('2026-10-22T10:00:00Z');
    expect(retryAfterMs('5')).toBe(5000);
    expect(retryAfterMs('Thu, 22 Oct 2026 10:00:07 GMT', now)).toBe(7000);
    expect(retryAfterMs('9999')).toBe(120_000);
    expect(retryAfterMs('soon')).toBeUndefined();
    expect(retryAfterMs(null)).toBeUndefined();
  });
});

describe('settings', () => {
  it('takes the key from the environment, else from the first .env file that has it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'audio-env-'));
    try {
      const server = join(dir, 'server.env');
      writeFileSync(server, '# comment\nAZURE_SPEECH_KEY=from-file\nAZURE_SPEECH_REGION= southeastasia \n');
      const files = [server, join(dir, 'missing.env')];
      expect(speechSettings({}, files)).toEqual({
        key: { value: 'from-file', source: server },
        region: { value: 'southeastasia', source: server },
      });
      expect(speechSettings({ AZURE_SPEECH_KEY: 'from-env' }, files).key).toEqual({ value: 'from-env', source: 'environment' });
      expect(speechSettings({ AZURE_SPEECH_KEY: '  ' }, [])).toEqual({ key: undefined, region: undefined });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts the region as the portal shows it', () => {
    expect(normalizeRegion(' Southeast Asia ')).toBe('southeastasia');
    expect(isRegion('southeastasia')).toBe(true);
    expect(isRegion('southeastasia.api.cognitive.microsoft.com')).toBe(false);
  });
});
