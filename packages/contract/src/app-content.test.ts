import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { coursesModule, writeAppContent } from './app-content';
import { buildBundle, splitBundle } from './build';
import { courseKey, type BundleIndex, type CourseBundle } from './bundle';
import { loadContent } from './load';
import { validate } from './validate';

// Two small courses of their own (the real content is rewritten all the time).
const lesson = (id: string, target: string, stage: string, itemId: string, text: string) => ({
  id,
  target,
  stage,
  minutes: 5,
  items: [{ id: itemId, text, reading: text }],
  exercises: [{ type: 'speak', item: itemId }],
});
const gloss = (id: string, itemId: string) => ({ lesson: id, title: `บท ${id}`, intro: 'บทนำ', items: { [itemId]: { meaning: 'ความหมาย' } } });

const FILES: Record<string, object> = {
  'courses/zh/course.json': {
    target: 'zh',
    voice: 'zh-CN',
    reading: 'pinyin',
    stages: [
      { id: 'A', cefr: 'pre-A1', exam: 'HSK 1', free: true, units: [{ id: 'zh-A1', lessons: ['zh-A1-01', 'zh-A1-02'] }] },
      { id: 'B', cefr: 'A1', units: [{ id: 'zh-B1', lessons: ['zh-B1-01'] }, { id: 'zh-B2', lessons: ['zh-B2-01'] }] },
    ],
  },
  'courses/zh/lessons/zh-A1-01.json': lesson('zh-A1-01', 'zh', 'A', 'zh.ni-hao', '你好'),
  'courses/zh/lessons/zh-A1-02.json': lesson('zh-A1-02', 'zh', 'A', 'zh.xie-xie', '谢谢'),
  'courses/zh/lessons/zh-B1-01.json': lesson('zh-B1-01', 'zh', 'B', 'zh.yi', '一'),
  'courses/zh/lessons/zh-B2-01.json': lesson('zh-B2-01', 'zh', 'B', 'zh.er', '二'),
  'courses/en/course.json': {
    target: 'en',
    voice: 'en-US',
    reading: 'IPA',
    stages: [{ id: 'A', cefr: 'pre-A1', free: true, units: [{ id: 'en-A1', lessons: ['en-A1-01'] }] }],
  },
  'courses/en/lessons/en-A1-01.json': lesson('en-A1-01', 'en', 'A', 'en.hello', 'hello'),
  'audio/zh/manifest.json': { 'item|你好': 'zh/58512371f159b3f8.mp3' },
  'l1/th/meta.json': { l1: 'th', name: 'ไทย', released: ['zh', 'en'] },
  'l1/th/ui.json': { 'home.title': 'เรียน{language}' },
  'l1/th/zh/course.json': {
    target: 'zh',
    name: 'ภาษาจีน',
    stages: { A: { title: 'เริ่มต้น' }, B: { title: 'พื้นฐาน' } },
    units: { 'zh-A1': { title: 'ทักทาย' }, 'zh-B1': { title: 'ตัวเลข' }, 'zh-B2': { title: 'เวลา' } },
  },
  'l1/th/zh/lessons/zh-A1-01.json': gloss('zh-A1-01', 'zh.ni-hao'),
  'l1/th/zh/lessons/zh-A1-02.json': gloss('zh-A1-02', 'zh.xie-xie'),
  'l1/th/zh/lessons/zh-B1-01.json': gloss('zh-B1-01', 'zh.yi'),
  'l1/th/zh/lessons/zh-B2-01.json': gloss('zh-B2-01', 'zh.er'),
  'l1/th/en/course.json': { target: 'en', name: 'ภาษาอังกฤษ', stages: { A: { title: 'เริ่มต้น' } }, units: { 'en-A1': { title: 'ทักทาย' } } },
  'l1/th/en/lessons/en-A1-01.json': gloss('en-A1-01', 'en.hello'),
};

const temps: string[] = [];
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

function bundle() {
  const root = temp('content-split-');
  for (const [path, data] of Object.entries(FILES)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(data));
  }
  const loaded = loadContent(root);
  expect(validate(loaded)).toEqual([]);
  return buildBundle(loaded, 'v1');
}

describe('app content split', () => {
  it('keeps buildBundle whole and splits it into an index and one file per course', () => {
    const b = bundle();
    const { index, courses } = splitBundle(b);
    expect(courses.map((c) => c.key).sort()).toEqual(['th-en', 'th-zh']);
    expect(courses.find((c) => c.key === courseKey('th', 'zh'))!.course).toBe(b.l1s.th!.courses.zh);
    expect(index.version).toBe('v1');
    expect(index.l1s.th).toMatchObject({ l1: 'th', name: 'ไทย', ui: { 'home.title': 'เรียน{language}' } });
    expect(index.l1s.th!.courses.zh).toEqual({
      target: 'zh',
      name: 'ภาษาจีน',
      voice: 'zh-CN',
      reading: 'pinyin',
      stages: [
        { id: 'A', title: 'เริ่มต้น', cefr: 'pre-A1', exam: 'HSK 1', free: true, units: 1, lessons: 2 },
        { id: 'B', title: 'พื้นฐาน', cefr: 'A1', free: false, units: 2, lessons: 2 },
      ],
      lessons: 4,
    });
  });

  it('writes index.json, the course files and lazy loaders, replacing an earlier build', () => {
    const dir = temp('generated-');
    writeFileSync(join(dir, 'th-ko.json'), '{}'); // a course that is no longer released
    writeFileSync(join(dir, 'README.md'), 'kept');
    const b = bundle();
    const written = writeAppContent(b, dir);

    expect(readdirSync(dir).sort()).toEqual(['README.md', 'courses.ts', 'index.json', 'th-en.json', 'th-zh.json']);
    expect(written.map((f) => f.file).sort()).toEqual(['courses.ts', 'index.json', 'th-en.json', 'th-zh.json']);
    expect(written.every((f) => f.bytes > 0)).toBe(true);

    const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')) as BundleIndex;
    expect(JSON.stringify(index)).not.toContain('"lessons":{'); // no lesson content at startup
    const zh = JSON.parse(readFileSync(join(dir, 'th-zh.json'), 'utf8')) as CourseBundle;
    expect(zh).toEqual(JSON.parse(JSON.stringify(b.l1s.th!.courses.zh)));
    expect(zh.audio).toEqual({ 'item|你好': 'zh/58512371f159b3f8.mp3' });
    expect(existsSync(join(dir, 'th-ko.json'))).toBe(false);
  });

  it('generates loaders whose requires only run when called', () => {
    const src = coursesModule(['th-zh', 'th-en']);
    expect(src).toContain("'th-en': () => require('./th-en.json') as CourseBundle,");
    expect(src).toContain("'th-zh': () => require('./th-zh.json') as CourseBundle,");
    // Every require is inside an arrow function, none at module level.
    expect(src.match(/require\(/g)).toHaveLength(2);
    expect(src.split('\n').filter((l) => l.includes('require(') && !l.includes('() => require('))).toEqual([]);
    expect(src.indexOf("'th-en'")).toBeLessThan(src.indexOf("'th-zh'"));
  });
});
