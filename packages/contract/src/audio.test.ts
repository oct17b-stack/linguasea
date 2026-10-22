import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { buildBundle } from './build';
import { loadContent } from './load';
import { validate } from './validate';

// A one-lesson course of its own: the real content is rewritten all the time.
const FILES: Record<string, object> = {
  'courses/zh/course.json': {
    target: 'zh',
    voice: 'zh-CN',
    reading: 'pinyin',
    stages: [{ id: 'A', cefr: 'pre-A1', free: true, units: [{ id: 'zh-A1', lessons: ['zh-A1-01'] }] }],
  },
  'courses/zh/lessons/zh-A1-01.json': {
    id: 'zh-A1-01',
    target: 'zh',
    stage: 'A',
    minutes: 5,
    items: [{ id: 'zh.ni-hao', text: '你好', reading: 'nǐ hǎo' }],
    exercises: [{ type: 'speak', item: 'zh.ni-hao' }],
  },
  'l1/th/meta.json': { l1: 'th', name: 'ไทย', released: ['zh'] },
  'l1/th/ui.json': {},
  'l1/th/zh/course.json': { target: 'zh', name: 'จีน', stages: { A: { title: 'A' } }, units: { 'zh-A1': { title: 'ทักทาย' } } },
  'l1/th/zh/lessons/zh-A1-01.json': { lesson: 'zh-A1-01', title: 'ทักทาย', intro: 'ทักทาย', items: { 'zh.ni-hao': { meaning: 'สวัสดี' } } },
};

const temps: string[] = [];
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

function content(extra: Record<string, object | string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'content-audio-'));
  temps.push(root);
  for (const [path, data] of Object.entries({ ...FILES, ...extra })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), typeof data === 'string' ? data : JSON.stringify(data));
  }
  return root;
}

describe('audio manifest', () => {
  it('goes into the bundle as courses[target].audio', () => {
    const manifest = { 'item|你好': 'zh/58512371f159b3f8.mp3' };
    const loaded = loadContent(content({ 'audio/zh/manifest.json': manifest }));
    expect(validate(loaded)).toEqual([]);
    expect(buildBundle(loaded, 'test').l1s.th!.courses.zh!.audio).toEqual(manifest);
  });

  it('is optional: without one the app falls back to device speech', () => {
    const loaded = loadContent(content());
    expect(validate(loaded)).toEqual([]);
    expect(buildBundle(loaded, 'test').l1s.th!.courses.zh).not.toHaveProperty('audio');
  });

  it('is reported when broken instead of being dropped silently', () => {
    const messages = (extra: Record<string, object | string>) =>
      validate(loadContent(content(extra))).map((p) => `${p.file}: ${p.message}`);
    expect(messages({ 'audio/zh/manifest.json': '<<<<<<< HEAD' })[0]).toMatch(/^audio\/zh\/manifest\.json: invalid JSON/);
    expect(messages({ 'audio/zh/manifest.json': { 'item|你好': 3 } })[0]).toMatch(/^audio\/zh\/manifest\.json: item\|你好: /);
  });
});
