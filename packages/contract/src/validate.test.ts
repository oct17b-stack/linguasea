import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { buildBundle } from './build';
import { contentRoot } from './cli/paths';
import { loadContent } from './load';
import { validate } from './validate';

const temps: string[] = [];
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

/** A scratch copy of the real content that a test can break. */
function copy(): string {
  const dir = mkdtempSync(join(tmpdir(), 'content-'));
  temps.push(dir);
  cpSync(contentRoot, dir, { recursive: true });
  return dir;
}

function edit(file: string, change: (json: any) => void) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  change(json);
  writeFileSync(file, JSON.stringify(json));
}

const messages = (root: string) => validate(loadContent(root)).map((p) => `${p.file}: ${p.message}`);

describe('content', () => {
  it('the real content has no problems', () => {
    expect(messages(contentRoot)).toEqual([]);
  });

  it('bundles all four courses for Thai learners', () => {
    const bundle = buildBundle(loadContent(contentRoot), 'test');
    expect(Object.keys(bundle.l1s.th!.courses).sort()).toEqual(['en', 'ja', 'ko', 'zh']);
  });
});

describe('validate', () => {
  it('catches a lesson listed in the course but missing', () => {
    const root = copy();
    rmSync(join(root, 'courses/zh/lessons/zh-B1-01.json'));
    expect(messages(root)).toContain('courses/zh/course.json: lesson zh-B1-01 has no file');
  });

  it('catches an item id reused with a different text', () => {
    const root = copy();
    edit(join(root, 'courses/zh/lessons/zh-B1-01.json'), (l) => {
      l.items.push({ id: 'zh.ni-hao', text: '您好', reading: 'nín hǎo' });
    });
    expect(messages(root).some((m) => m.includes('zh.ni-hao differs from zh-A1-01'))).toBe(true);
  });

  it('catches an exercise on a word the lesson does not teach', () => {
    const root = copy();
    edit(join(root, 'courses/ja/lessons/ja-A1-01.json'), (l) => {
      l.exercises.push({ type: 'speak', item: 'ja.ichi' });
    });
    expect(messages(root)).toContain(
      'courses/ja/lessons/ja-A1-01.json: exercise uses ja.ichi, which is not taught in this lesson',
    );
  });

  it('catches a missing explanation in a released course', () => {
    const root = copy();
    edit(join(root, 'l1/th/ko/lessons/ko-A1-01.json'), (g) => {
      delete g.items['ko.gamsahamnida'];
      g.dialogue.pop();
    });
    const m = messages(root);
    expect(m).toContain('l1/th/ko/lessons/ko-A1-01.json: missing gloss for ko.gamsahamnida');
    expect(m).toContain('l1/th/ko/lessons/ko-A1-01.json: dialogue has 5 translations for 6 lines');
  });

  it('catches a lesson without explanation in a released course', () => {
    const root = copy();
    rmSync(join(root, 'l1/th/en/lessons/en-B1-01.json'));
    expect(messages(root)).toContain('l1/th/en: released but lesson en-B1-01 has no explanation');
  });

  it('requires every L1 to have the same UI keys as Thai', () => {
    const root = copy();
    cpSync(join(root, 'l1/th'), join(root, 'l1/vi'), { recursive: true });
    edit(join(root, 'l1/vi/meta.json'), (m) => {
      m.l1 = 'vi';
      m.released = [];
    });
    edit(join(root, 'l1/vi/ui.json'), (u) => {
      delete u['home.title'];
    });
    expect(messages(root)).toContain('l1/vi/ui.json: missing key "home.title"');
  });

  it('reports schema errors with the field path', () => {
    const root = copy();
    edit(join(root, 'courses/en/lessons/en-A1-01.json'), (l) => {
      l.items[0].id = 'Hello';
    });
    expect(messages(root).some((m) => m.startsWith('courses/en/lessons/en-A1-01.json: items.0.id'))).toBe(true);
  });
});
