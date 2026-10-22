import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { contentRoot } from './cli/paths';
import { exportSheet, importSheet } from './l10n';
import { loadContent } from './load';
import { validate } from './validate';

const temps: string[] = [];
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('translation sheets', () => {
  it('round-trips a full Thai layer into a new L1 that validates', () => {
    const root = mkdtempSync(join(tmpdir(), 'l10n-'));
    temps.push(root);
    cpSync(contentRoot, root, { recursive: true });

    const sheet = exportSheet(loadContent(root), 'th', 'vi', { translit: true });
    expect(sheet.entries.length).toBeGreaterThan(50);
    expect(sheet.entries.every((e) => e.translation === '')).toBe(true);
    const item = sheet.entries.find((e) => e.key.includes(':item:') && e.key.endsWith(':meaning'))!;
    expect(item.context).toMatch(/\(.+\)/);

    // Pretend a translator filled everything in.
    sheet.name = 'Tiếng Việt';
    for (const e of sheet.entries) e.translation = `vi ${e.source}`;
    const files = importSheet(sheet, loadContent(root));
    for (const [path, json] of files) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), JSON.stringify(json));
    }
    // Release every course for the new language: the validator then demands complete explanations.
    const meta = files.get('l1/vi/meta.json') as { released: string[] };
    writeFileSync(join(root, 'l1/vi/meta.json'), JSON.stringify({ ...meta, released: ['zh', 'en', 'ja', 'ko'] }));

    const loaded = loadContent(root);
    expect(validate(loaded).filter((p) => p.file.startsWith('l1/vi'))).toEqual([]);
    expect(loaded.l1s.get('vi')?.meta.name).toBe('Tiếng Việt');

    // A second export keeps what was already translated.
    const again = exportSheet(loaded, 'th', 'vi');
    expect(again.entries.find((e) => e.key === 'ui:home.title')?.translation).toMatch(/^vi /);
  });
});
