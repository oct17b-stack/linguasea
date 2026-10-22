// Translation sheets for opening a new country:
//   npm run l10n -- export --to vi [--from th] [--target zh] [--translit] [--name "Tiếng Việt"]
//     → content/l10n/<to>.json (existing translations kept; fill every "translation")
//   npm run l10n -- import content/l10n/vi.json
//     → content/l1/<to>/… ; then npm run validate, and add targets to meta.json "released" when complete.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { exportSheet, importSheet, type Sheet } from '../l10n';
import { loadContent } from '../load';
import { L1, Target } from '../schema';
import { contentRoot } from './paths';

const [command, ...args] = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

function write(path: string, json: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
}

const loaded = loadContent(contentRoot);

if (command === 'export') {
  const to = L1.parse(flag('to'));
  const from = L1.parse(flag('from') ?? 'th');
  const target = flag('target');
  const sheet = exportSheet(loaded, from, to, {
    targets: target ? [Target.parse(target)] : undefined,
    translit: args.includes('--translit'),
  });
  if (flag('name')) sheet.name = flag('name')!;
  const out = join(contentRoot, 'l10n', `${to}.json`);
  write(out, sheet);
  const missing = sheet.entries.filter((e) => !e.translation).length;
  console.log(`wrote ${out}: ${sheet.entries.length} strings, ${missing} to translate`);
} else if (command === 'import' && args[0]) {
  const sheet = JSON.parse(readFileSync(args[0], 'utf8')) as Sheet;
  const files = importSheet(sheet, loaded);
  for (const [path, json] of files) write(join(contentRoot, path), json);
  console.log(`wrote ${files.size} files under content/l1/${sheet.to}; now run npm run validate`);
} else {
  console.error('usage: l10n export --to <l1> [--from th] [--target zh] [--translit] [--name <name>] | l10n import <sheet.json>');
  process.exit(1);
}
