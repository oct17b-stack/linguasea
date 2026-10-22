// Test helper: a small content tree in a temp folder (the real content is rewritten all the time).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const course = (target: string, lessons: string[]) => ({
  target,
  voice: target,
  reading: 'test',
  stages: [{ id: 'A', cefr: 'pre-A1', free: true, units: [{ id: `${target}-A1`, lessons }] }],
});

const lesson = (id: string, items: object[], dialogue: [string, string][]) => ({
  id,
  target: id.slice(0, 2),
  stage: 'A',
  minutes: 5,
  items,
  dialogue: dialogue.map(([speaker, text]) => ({ speaker, text, reading: 'x' })),
  // Explicit exercises keep the tiny courses free of validator problems (standard sets need 4 words).
  exercises: [{ type: 'speak', item: (items[0] as { id: string }).id }],
});

export const FILES: Record<string, object> = {
  'courses/zh/course.json': course('zh', ['zh-A1-01', 'zh-A1-02']),
  'courses/zh/lessons/zh-A1-01.json': lesson(
    'zh-A1-01',
    [
      { id: 'zh.ni-hao', text: '你好', reading: 'nǐ hǎo' },
      { id: 'zh.ma1', kind: 'syllable', text: 'mā', reading: 'mā', say: '妈' },
    ],
    [
      ['a', '你好！'],
      ['b', '你好！'],
    ],
  ),
  'courses/zh/lessons/zh-A1-02.json': lesson(
    'zh-A1-02',
    [
      { id: 'zh.ni-hao', text: '你好', reading: 'nǐ hǎo' },
      { id: 'zh.xie-xie', text: '谢谢', reading: 'xièxie' },
    ],
    [
      ['a', '谢谢！'],
      ['b', '不客气。'],
      ['a', '你好！'],
    ],
  ),
  'courses/en/course.json': course('en', ['en-A1-01']),
  'courses/en/lessons/en-A1-01.json': lesson(
    'en-A1-01',
    [
      { id: 'en.hello', text: 'Hello', reading: 'həˈloʊ' },
      { id: 'en.rock-and-roll', kind: 'phrase', text: 'rock & roll', reading: 'ˈrɑk ən ˈroʊl' },
    ],
    [
      ['a', "Hi, I'm Nam."],
      ['b', 'Nice to meet you.'],
    ],
  ),
};

/** Writes FILES (plus `extra`) into a fresh temp folder; call cleanup() afterwards. */
export function makeContent(extra: Record<string, object | string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'audio-content-'));
  const write = (path: string, data: object | string | Uint8Array) => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, typeof data === 'string' || data instanceof Uint8Array ? data : JSON.stringify(data, null, 2));
  };
  for (const [path, data] of Object.entries({ ...FILES, ...extra })) write(path, data);
  return { root, audio: join(root, 'audio'), write, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
