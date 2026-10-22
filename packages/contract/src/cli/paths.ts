import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const contentRoot = join(repoRoot, 'content');
/** Where `npm run content` writes the app's content: index.json, one JSON per course, courses.ts. */
export const appContentDir = join(repoRoot, 'app/src/content/generated');
