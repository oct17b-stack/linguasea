import { fileURLToPath } from 'node:url';

import { DEFAULT_QUOTAS, type Quotas } from './app';
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
  contentDir: string;
  audioDir: string;
  publicDir: string;
  quotas: Quotas;
};

const repoPath = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url));

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();
  return {
    port: positiveInt(env.PORT, 8080),
    databaseUrl: env.DATABASE_URL?.trim() || undefined,
    azureSpeech: key && region ? { key, region } : undefined,
    revenueCatAuth: env.REVENUECAT_WEBHOOK_AUTH?.trim() || undefined,
    tutor: env.ANTHROPIC_API_KEY?.trim() ? { model: env.TUTOR_MODEL?.trim() || DEFAULT_TUTOR_MODEL } : undefined,
    contentDir: env.CONTENT_DIR?.trim() || repoPath('content'),
    audioDir: env.AUDIO_DIR?.trim() || repoPath('content/audio'),
    publicDir: env.PUBLIC_DIR?.trim() || repoPath('server/public'),
    quotas: {
      pronunciationFree: positiveInt(env.PRONUNCIATION_FREE_PER_DAY, DEFAULT_QUOTAS.pronunciationFree),
      pronunciationPremium: positiveInt(env.PRONUNCIATION_PREMIUM_PER_DAY, DEFAULT_QUOTAS.pronunciationPremium),
      tutorFree: positiveInt(env.TUTOR_FREE_PER_DAY, DEFAULT_QUOTAS.tutorFree),
      tutorPremium: positiveInt(env.TUTOR_PREMIUM_PER_DAY, DEFAULT_QUOTAS.tutorPremium),
    },
  };
}
