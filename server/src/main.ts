import { buildServer } from './app';
import { MemoryStore } from './store';

// TODO(db): switch to the PostgreSQL store before any real users; MemoryStore loses data on restart.
const app = buildServer({
  store: new MemoryStore(),
  revenueCatAuth: process.env.REVENUECAT_WEBHOOK_AUTH || undefined,
  logger: true,
});

await app.listen({ port: Number(process.env.PORT ?? 8080), host: '0.0.0.0' });
