import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const contentRoot = join(repoRoot, 'content');
export const bundleFile = join(repoRoot, 'app/src/content/bundle.generated.json');
