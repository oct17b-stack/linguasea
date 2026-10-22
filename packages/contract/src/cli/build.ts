import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { buildBundle } from '../build';
import { loadContent } from '../load';
import { validate } from '../validate';
import { bundleFile, contentRoot } from './paths';

const loaded = loadContent(contentRoot);
const problems = validate(loaded);
if (problems.length) {
  for (const p of problems) console.error(`${p.file}: ${p.message}`);
  console.error('\ncontent has problems; run `npm run validate`');
  process.exit(1);
}

const draft = JSON.stringify(buildBundle(loaded, ''));
const version = createHash('sha256').update(draft).digest('hex').slice(0, 12);
mkdirSync(dirname(bundleFile), { recursive: true });
writeFileSync(bundleFile, JSON.stringify(buildBundle(loaded, version)) + '\n');
const audio = [...loaded.targets].flatMap(([target, t]) => (t.audio ? [`${target} ${Object.keys(t.audio).length}`] : []));
console.log(`wrote ${bundleFile} (version ${version}${audio.length ? `; audio clips: ${audio.join(', ')}` : ''})`);
