import { buildBundle, loadContent, validate } from '@linguasea/contract/node';

import { buildServer } from './app';
import { readConfig } from './config';
import { pgDb } from './pg';
import { migrate, PgStore } from './pg-store';
import { AzureAssessor } from './pronunciation';
import { MemoryStore, type Store } from './store';
import { ClaudeTutor } from './tutor';

const config = readConfig();

let store: Store;
if (config.databaseUrl) {
  const db = pgDb(config.databaseUrl);
  await migrate(db);
  store = new PgStore(db);
} else {
  console.warn('DATABASE_URL is not set: using in-memory storage (data is lost on restart).');
  store = new MemoryStore();
}

const loaded = loadContent(config.contentDir);
const problems = validate(loaded);
if (problems.length) console.warn(`content has ${problems.length} problem(s); run npm run validate`);
const bundle = buildBundle(loaded, 'server');

if (!config.tutor) console.warn('ANTHROPIC_API_KEY not set: the AI tutor is off.');
if (!config.azureSpeech) console.warn('AZURE_SPEECH_KEY/AZURE_SPEECH_REGION not set: pronunciation scoring is off.');
if (!config.revenueCatAuth) console.warn('REVENUECAT_WEBHOOK_AUTH not set: subscription webhooks are refused.');

const speech = config.azureSpeech ? new AzureAssessor(config.azureSpeech) : undefined;

const app = buildServer({
  store,
  revenueCatAuth: config.revenueCatAuth,
  assessor: speech,
  transcriber: speech,
  tutor: config.tutor ? new ClaudeTutor(undefined, config.tutor.model) : undefined,
  bundle,
  quotas: config.quotas,
  audioDir: config.audioDir,
  publicDir: config.publicDir,
  logger: true,
});

await app.listen({ port: config.port, host: '0.0.0.0' });
