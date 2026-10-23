import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';

import { contentRoot } from './cli/paths';
import { findDuplicates } from './dupes';
import { loadContent } from './load';

const temps: string[] = [];
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

it('finds one word under two ids across content and the plan', () => {
  const root = mkdtempSync(join(tmpdir(), 'dupes-'));
  temps.push(root);
  // One course is enough (copying all of them takes long).
  cpSync(join(contentRoot, 'courses/zh'), join(root, 'courses/zh'), { recursive: true });
  const lesson = JSON.parse(readFileSync(join(root, 'courses/zh/lessons/zh-A1-01.json'), 'utf8'));
  const word = lesson.items.find((i: { kind?: string }) => !i.kind || i.kind === 'word' || i.kind === 'phrase');
  mkdirSync(join(root, '_plan'), { recursive: true });
  // A planned lesson that is not written yet.
  writeFileSync(
    join(root, '_plan/zh-CF.json'),
    JSON.stringify({ target: 'zh', stages: [{ units: [{ lessons: [{ id: 'zh-F17-01', items: [{ ...word, id: `${word.id}-again` }] }] }] }] }),
  );
  // Real content and plans may hold other duplicates while they are being written; look for ours.
  const ours = findDuplicates(loadContent(root), root).find((d) => d.ids.some((x) => x.id === `${word.id}-again`));
  expect(ours?.ids.map((x) => x.id)).toEqual([word.id, `${word.id}-again`]);
  expect(ours?.ids[1].where).toBe('plan zh-F17-01');
});
