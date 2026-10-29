import { fileURLToPath } from 'node:url';

import { dayIn, DEFAULT_ACCOUNTS_PER_IP, DEFAULT_QUOTA_TIME_ZONE, DEFAULT_QUOTAS, type Quotas } from './app';
import { DEFAULT_TUTOR_MODEL } from './tutor';

/** Everything the server reads from the environment (see .env.example and docs/LAUNCH.md). */
export type Config = {
  port: number;
  /** PostgreSQL connection string; without it data lives in memory and is lost on restart (dev only). */
  databaseUrl?: string;
  azureSpeech?: { key: string; region: string };
  revenueCatAuth?: string;
  /** The AI tutor runs when an Anthropic API key is present (the SDK reads ANTHROPIC_API_KEY itself). */
  tutor?: { model: string };
  /** Email sign-in codes are sent through Resend when both are set. */
  resend?: { apiKey: string; from: string };
  /** NODE_ENV=production: without mail settings email sign-in is off instead of printing codes. */
  production: boolean;
  contentDir: string;
  audioDir: string;
  publicDir: string;
  /** Web build of the app, served at /app/ when the folder exists. */
  webDir: string;
  quotas: Quotas;
  /** IANA time zone whose midnight resets the daily allowances (QUOTA_TIME_ZONE, default Asia/Bangkok). */
  quotaTimeZone: string;
  /** Reverse proxies in front of the server whose X-Forwarded-For entries are trusted (default 1). */
  trustProxy: number;
  /** New accounts per hour per client IP (ACCOUNTS_PER_IP_PER_HOUR, default 20). */
  accountsPerIp: number;
};

const repoPath = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url));

function timeZone(value: string | undefined, fallback: string): string {
  const zone = value?.trim();
  if (!zone) return fallback;
  try {
    dayIn(zone, new Date());
    return zone;
  } catch {
    throw new Error(`QUOTA_TIME_ZONE: unknown time zone "${zone}"`);
  }
}

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();
  const resendKey = env.RESEND_API_KEY?.trim();
  const mailFrom = env.MAIL_FROM?.trim();
  return {
    port: positiveInt(env.PORT, 8080),
    databaseUrl: env.DATABASE_URL?.trim() || undefined,
    azureSpeech: key && region ? { key, region } : undefined,
    revenueCatAuth: env.REVENUECAT_WEBHOOK_AUTH?.trim() || undefined,
    tutor: env.ANTHROPIC_API_KEY?.trim() ? { model: env.TUTOR_MODEL?.trim() || DEFAULT_TUTOR_MODEL } : undefined,
    resend: resendKey && mailFrom ? { apiKey: resendKey, from: mailFrom } : undefined,
    production: env.NODE_ENV === 'production',
    contentDir: env.CONTENT_DIR?.trim() || repoPath('content'),
    audioDir: env.AUDIO_DIR?.trim() || repoPath('content/audio'),
    publicDir: env.PUBLIC_DIR?.trim() || repoPath('server/public'),
    webDir: env.WEB_DIR?.trim() || repoPath('app/dist'),
    trustProxy: positiveInt(env.TRUST_PROXY, 1),
    accountsPerIp: positiveInt(env.ACCOUNTS_PER_IP_PER_HOUR, DEFAULT_ACCOUNTS_PER_IP) || DEFAULT_ACCOUNTS_PER_IP,
    quotaTimeZone: timeZone(env.QUOTA_TIME_ZONE, DEFAULT_QUOTA_TIME_ZONE),
    quotas: {
      pronunciationFree: positiveInt(env.PRONUNCIATION_FREE_PER_DAY, DEFAULT_QUOTAS.pronunciationFree),
      pronunciationPremium: positiveInt(env.PRONUNCIATION_PREMIUM_PER_DAY, DEFAULT_QUOTAS.pronunciationPremium),
      tutorFree: positiveInt(env.TUTOR_FREE_PER_DAY, DEFAULT_QUOTAS.tutorFree),
      tutorPremium: positiveInt(env.TUTOR_PREMIUM_PER_DAY, DEFAULT_QUOTAS.tutorPremium),
    },
  };
}
