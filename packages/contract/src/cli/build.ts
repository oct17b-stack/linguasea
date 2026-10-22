import { createHash } from 'node:crypto';
import { relative } from 'node:path';

import { writeAppContent } from '../app-content';
import { buildBundle } from '../build';
import { loadContent } from '../load';
import { validate } from '../validate';
import { appContentDir, contentRoot, repoRoot } from './paths';

const loaded = loadContent(contentRoot);
const problems = validate(loaded);
if (problems.length) {
  for (const p of problems) console.error(`${p.file}: ${p.message}`);
  console.error('\ncontent has problems; run `npm run validate`');
  process.exit(1);
}

const draft = JSON.stringify(buildBundle(loaded, ''));
const version = createHash('sha256').update(draft).digest('hex').slice(0, 12);
const written = writeAppContent(buildBundle(loaded, version), appContentDir);

const kb = (bytes: number) => `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
const audio = [...loaded.targets].flatMap(([target, t]) => (t.audio ? [`${target} ${Object.keys(t.audio).length}`] : []));
console.log(`wrote ${relative(repoRoot, appContentDir)}/ (version ${version}${audio.length ? `; audio clips: ${audio.join(', ')}` : ''})`);
for (const { file, bytes } of written) console.log(`  ${file.padEnd(16)} ${kb(bytes).padStart(10)}`);
console.log(`  ${'total'.padEnd(16)} ${kb(written.reduce((n, f) => n + f.bytes, 0)).padStart(10)}`);
