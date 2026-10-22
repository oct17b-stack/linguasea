import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { OUTPUT_FORMAT, type Voice } from './voices';

// ---------- SSML ----------

// Characters XML 1.0 cannot carry: C0 controls other than tab/LF/CR, U+FFFE/U+FFFF, unpaired surrogates.
const NOT_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

/** Escapes text for XML content and attribute values, dropping characters XML does not allow. */
export function escapeXml(text: string): string {
  return text.replace(NOT_XML, '').replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

function prosody(rate: string): [open: string, close: string] {
  return [`<prosody rate="${escapeXml(rate)}">`, '</prosody>'];
}

/** The SSML document for one clip. */
export function ssml(voice: Voice, text: string): string {
  const [open, close] = prosody(voice.rate);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${escapeXml(voice.lang)}">` +
    `<voice name="${escapeXml(voice.name)}">${open}${escapeXml(text)}${close}</voice></speak>`
  );
}

const HAN = /\p{Script=Han}/u;

/**
 * Characters Azure bills for a clip: the text plus SSML markup other than <speak> and <voice> (our
 * <prosody> tag), with each Han character (Chinese, kanji, hanja) counted twice. Used for estimates only.
 */
export function billableChars(voice: Pick<Voice, 'rate'>, text: string): number {
  const [open, close] = prosody(voice.rate);
  let n = open.length + close.length;
  for (const ch of text) n += HAN.test(ch) ? 2 : 1;
  return n;
}

// ---------- configuration ----------

export type AzureConfig = { key: string; region: string };

/** Region as it appears in Azure URLs: "Southeast Asia" → "southeastasia". */
export function normalizeRegion(region: string): string {
  return region.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function isRegion(region: string): boolean {
  return /^[a-z][a-z0-9]{1,40}$/.test(region);
}

export type Setting = { value: string; source: string };

/**
 * AZURE_SPEECH_KEY / AZURE_SPEECH_REGION from the environment, otherwise from the first of `envFiles`
 * that sets them (server/.env holds the same key for pronunciation scoring). Files are only read.
 */
export function speechSettings(
  env: Record<string, string | undefined>,
  envFiles: string[],
): { key?: Setting; region?: Setting } {
  const files = envFiles.filter((f) => existsSync(f)).map((f) => ({ f, vars: parseEnv(readFileSync(f, 'utf8')) }));
  const pick = (name: string): Setting | undefined => {
    const own = env[name]?.trim();
    if (own) return { value: own, source: 'environment' };
    for (const { f, vars } of files) {
      const value = vars[name]?.trim();
      if (value) return { value, source: f };
    }
    return undefined;
  };
  return { key: pick('AZURE_SPEECH_KEY'), region: pick('AZURE_SPEECH_REGION') };
}

// ---------- synthesis ----------

export const USER_AGENT = 'linguasea-audio-tool';

export function endpoint(region: string): string {
  return `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
}

/** `fatal`: stop the whole run (key, region, service keeps failing). Otherwise only this clip failed. */
export class SynthesisError extends Error {
  constructor(
    message: string,
    readonly fatal: boolean,
  ) {
    super(message);
    this.name = 'SynthesisError';
  }
}

/** One pause shared by all workers: after a 429 nobody sends until the service is ready again. */
export class Throttle {
  private until = 0;

  constructor(private readonly now: () => number = Date.now) {}

  pause(ms: number) {
    this.until = Math.max(this.until, this.now() + ms);
  }

  async wait(sleep: (ms: number) => Promise<void>) {
    const ms = this.until - this.now();
    if (ms > 0) await sleep(ms);
  }
}

export type SynthesizeOptions = {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  throttle?: Throttle;
  /** Retries after 408, 429, 5xx and network errors. */
  retries?: number;
  timeoutMs?: number;
  onRetry?: (problem: string, waitMs: number) => void;
};

const MAX_WAIT_MS = 120_000;
const MAX_BACKOFF_MS = 60_000;

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Retry-After (seconds or an HTTP date) in milliseconds, capped at two minutes. */
export function retryAfterMs(value: string | null, now = Date.now()): number | undefined {
  if (!value?.trim()) return undefined;
  const seconds = Number(value);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  return Number.isFinite(ms) ? Math.min(Math.max(ms, 0), MAX_WAIT_MS) : undefined;
}

async function audioBody(res: Response): Promise<Uint8Array> {
  const type = res.headers.get('content-type') ?? '';
  const data = new Uint8Array(await res.arrayBuffer());
  if (/^(text\/|application\/(json|xml|problem))/i.test(type)) {
    throw new SynthesisError(`Azure sent ${type} instead of audio`, false);
  }
  if (!data.length) throw new SynthesisError('Azure sent an empty clip', false);
  return data;
}

/** Azure AI Speech text-to-speech REST call for one clip; returns the MP3 bytes. */
export async function synthesize(
  config: AzureConfig,
  voice: Voice,
  text: string,
  opts: SynthesizeOptions = {},
): Promise<Uint8Array> {
  const doFetch = opts.fetch ?? fetch;
  const sleep = opts.sleep ?? realSleep;
  const retries = opts.retries ?? 6;
  const url = endpoint(config.region);
  const body = ssml(voice, text);

  for (let attempt = 0; ; attempt++) {
    await opts.throttle?.wait(sleep);
    let problem = '';
    let wait: number | undefined;
    let throttled = false;
    try {
      const res = await doFetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': config.key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
          'User-Agent': USER_AGENT,
        },
        body,
        signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
      });
      if (res.ok) return await audioBody(res);
      const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 200);
      problem = `Azure answered ${res.status}${detail ? ` (${detail})` : ''}`;
      if (res.status === 401 || res.status === 403) {
        throw new SynthesisError(`${problem}: check AZURE_SPEECH_KEY and that AZURE_SPEECH_REGION is the key's region`, true);
      }
      if (res.status === 400) throw new SynthesisError(problem, false);
      if (res.status !== 408 && res.status !== 429 && res.status < 500) throw new SynthesisError(problem, true);
      throttled = res.status === 429;
      wait = retryAfterMs(res.headers.get('retry-after'));
    } catch (e) {
      if (e instanceof SynthesisError) throw e;
      const code = (e as { cause?: { code?: unknown } }).cause?.code;
      if (code === 'ENOTFOUND') {
        const proxy = process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY ? ' (HTTPS_PROXY is set: Node only uses it with NODE_USE_ENV_PROXY=1)' : '';
        throw new SynthesisError(`cannot resolve ${new URL(url).host}: check AZURE_SPEECH_REGION and the network${proxy}`, true);
      }
      problem = `network error: ${(e as Error).message}${typeof code === 'string' ? ` (${code})` : ''}`;
    }
    if (attempt >= retries) throw new SynthesisError(`${problem}; gave up after ${attempt + 1} attempts`, true);
    const ms = wait ?? Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
    if (throttled) opts.throttle?.pause(ms);
    opts.onRetry?.(problem, ms);
    await sleep(ms);
  }
}
