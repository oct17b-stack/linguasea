import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { buildBundle } from './build';
import { contentRoot } from './cli/paths';
import { loadContent } from './load';
import { validate } from './validate';

const temps: string[] = [];
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

/**
 * A scratch copy of the real content that a test can break: only the given courses (with their
 * explanation layers), since copying and validating all of them takes a long time.
 */
function copy(...targets: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'content-'));
  temps.push(dir);
  for (const t of targets) cpSync(join(contentRoot, 'courses', t), join(dir, 'courses', t), { recursive: true });
  for (const l1 of readdirSync(join(contentRoot, 'l1'))) {
    const from = join(contentRoot, 'l1', l1);
    for (const f of ['meta.json', 'ui.json']) cpSync(join(from, f), join(dir, 'l1', l1, f));
    for (const t of targets) if (existsSync(join(from, t))) cpSync(join(from, t), join(dir, 'l1', l1, t), { recursive: true });
    // Only the copied courses can be released.
    edit(join(dir, 'l1', l1, 'meta.json'), (m) => {
      if (Array.isArray(m.released)) m.released = m.released.filter((t: string) => targets.includes(t));
    });
  }
  return dir;
}

function edit(file: string, change: (json: any) => void) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  change(json);
  writeFileSync(file, JSON.stringify(json));
}

const messages = (root: string) => validate(loadContent(root)).map((p) => `${p.file}: ${p.message}`);

const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
/** First vocabulary item of a real lesson, so tests do not depend on the exact words. */
const firstWord = (root: string, target: string, lesson: string) =>
  read(join(root, `courses/${target}/lessons/${lesson}.json`)).items.find(
    (i: { kind?: string }) => !i.kind || i.kind === 'word' || i.kind === 'phrase',
  );

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
    const root = copy('zh');
    rmSync(join(root, 'courses/zh/lessons/zh-B1-01.json'));
    expect(messages(root)).toContain('courses/zh/course.json: lesson zh-B1-01 has no file');
  });

  it('catches an item id reused with a different text', () => {
    const root = copy('zh');
    const word = firstWord(root, 'zh', 'zh-A1-01');
    edit(join(root, 'courses/zh/lessons/zh-B1-01.json'), (l) => {
      l.items.push({ ...word, text: `${word.text}吗` });
    });
    expect(messages(root).some((m) => m.includes(`${word.id} differs from zh-A1-01`))).toBe(true);
  });

  it('catches two items read differently that would share one audio clip', () => {
    const root = copy('zh');
    const word = firstWord(root, 'zh', 'zh-A1-01');
    edit(join(root, 'courses/zh/lessons/zh-B1-01.json'), (l) => {
      l.items.push({ id: 'zh.homograph', text: word.text, reading: `${word.reading}x` });
    });
    expect(messages(root).some((m) => m.includes(`item zh.homograph (${word.reading}x) says "${word.text}" like ${word.id}`))).toBe(true);
    edit(join(root, 'courses/zh/lessons/zh-B1-01.json'), (l) => {
      l.items.at(-1).say = '龘';
    });
    expect(messages(root).some((m) => m.includes('share one audio clip'))).toBe(false);
  });

  it('checks that declared homonyms are taught and written and read the same', () => {
    const root = copy('zh');
    const a = firstWord(root, 'zh', 'zh-A1-01');
    const b = firstWord(root, 'zh', 'zh-B1-01');
    edit(join(root, 'courses/zh/course.json'), (c) => {
      c.homonyms = [[a.id, b.id], [a.id, 'zh.not-taught']];
    });
    expect(messages(root)).toEqual([
      `courses/zh/course.json: homonyms ${a.id}, ${b.id} are not written and read the same`,
      'courses/zh/course.json: homonyms: zh.not-taught not taught in any lesson',
    ]);
  });

  it('catches an exercise on a word the lesson does not teach', () => {
    const root = copy('ja');
    const other = firstWord(root, 'ja', 'ja-B1-01');
    edit(join(root, 'courses/ja/lessons/ja-A1-01.json'), (l) => {
      l.exercises = [...(l.exercises ?? []), { type: 'speak', item: other.id }];
    });
    expect(messages(root)).toContain(
      `courses/ja/lessons/ja-A1-01.json: exercise uses ${other.id}, which is not taught in this lesson`,
    );
  });

  it('catches a missing explanation in a released course', () => {
    const root = copy('ko');
    const word = firstWord(root, 'ko', 'ko-A1-01');
    const lines = read(join(root, 'courses/ko/lessons/ko-A1-01.json')).dialogue.length;
    edit(join(root, 'l1/th/ko/lessons/ko-A1-01.json'), (g) => {
      delete g.items[word.id];
      g.dialogue.push('เกิน');
    });
    const m = messages(root);
    expect(m).toContain(`l1/th/ko/lessons/ko-A1-01.json: missing gloss for ${word.id}`);
    expect(m).toContain(`l1/th/ko/lessons/ko-A1-01.json: dialogue has ${lines + 1} translations for ${lines} lines`);
  });

  it('catches a lesson without explanation in a released course', () => {
    const root = copy('en');
    rmSync(join(root, 'l1/th/en/lessons/en-B1-01.json'));
    expect(messages(root)).toContain('l1/th/en: released but lesson en-B1-01 has no explanation');
  });

  it('requires every L1 to have the same UI keys as Thai', () => {
    const root = copy('en');
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
    const root = copy('en');
    edit(join(root, 'courses/en/lessons/en-A1-01.json'), (l) => {
      l.items[0].id = 'Hello';
    });
    expect(messages(root).some((m) => m.startsWith('courses/en/lessons/en-A1-01.json: items.0.id'))).toBe(true);
  });
});

describe('exercises', () => {
  it('rejects a wrong answer of another kind or one that sounds the same', () => {
    const root = copy('zh');
    const word = firstWord(root, 'zh', 'zh-A1-01');
    edit(join(root, 'courses/zh/lessons/zh-A1-01.json'), (l) => {
      l.items.push({ id: 'zh.test-he', text: '他测', reading: 'tā cè' }, { id: 'zh.test-she', text: '她测', reading: 'tā cè' });
      l.items.push({ id: 'zh.test-ma1', kind: 'syllable', text: 'mā测', reading: 'mā cè', say: '妈' });
      l.exercises = [
        { type: 'listen-text', item: 'zh.test-he', options: ['zh.test-she'] },
        { type: 'choose-meaning', item: word.id, options: ['zh.test-ma1'] },
      ];
    });
    edit(join(root, 'l1/th/zh/lessons/zh-A1-01.json'), (g) => {
      g.items['zh.test-he'] = { meaning: 'เขา (ผู้ชาย) ทดสอบ' };
      g.items['zh.test-she'] = { meaning: 'เขา (ผู้หญิง) ทดสอบ' };
      g.items['zh.test-ma1'] = { meaning: 'เสียง 1 ทดสอบ' };
    });
    const m = messages(root);
    expect(m).toContain('courses/zh/lessons/zh-A1-01.json: listen-text on zh.test-he: option zh.test-she sounds the same ("tā cè")');
    expect(m).toContain(`courses/zh/lessons/zh-A1-01.json: choose-meaning option zh.test-ma1 is a syllable, not like ${word.id}`);
  });

  it('gives sound items a listening question by default', async () => {
    const { lessonExercises } = await import('./exercises');
    const { Lesson } = await import('./schema');
    const lesson = Lesson.parse({
      id: 'ko-A2-01',
      target: 'ko',
      stage: 'A',
      minutes: 5,
      items: [
        { id: 'ko.ga', kind: 'syllable', text: '가', reading: 'ga' },
        { id: 'ko.na', kind: 'syllable', text: '나', reading: 'na' },
      ],
    });
    expect(lessonExercises(lesson).map((e) => `${e.type} ${e.item}`)).toEqual([
      'listen-text ko.ga',
      'choose-meaning ko.ga',
      'listen-text ko.na',
      'choose-meaning ko.na',
      'speak ko.ga',
      'speak ko.na',
    ]);
  });
});

describe('readers', () => {
  function addReader(root: string, gloss: Record<string, unknown> = {}) {
    edit(join(root, 'courses/zh/course.json'), (c) => {
      c.stages.find((s: { id: string }) => s.id === 'B').units.find((u: { id: string }) => u.id === 'zh-B1').lessons.push('zh-B1-r09');
    });
    writeFileSync(
      join(root, 'courses/zh/lessons/zh-B1-r09.json'),
      JSON.stringify({
        id: 'zh-B1-r09',
        kind: 'reader',
        target: 'zh',
        stage: 'B',
        minutes: 10,
        items: [{ id: 'zh.test-shi-chang', text: '市场', reading: 'shìchǎng' }],
        passage: [[{ text: '妈妈去市场。', reading: 'Māma qù shìchǎng.' }]],
        questions: [{ answer: 2 }],
      }),
    );
    writeFileSync(
      join(root, 'l1/th/zh/lessons/zh-B1-r09.json'),
      JSON.stringify({
        lesson: 'zh-B1-r09',
        title: 'ไปตลาด',
        intro: 'อ่านเรื่องสั้น',
        items: { 'zh.test-shi-chang': { meaning: 'ตลาด (ทดสอบ)' } },
        passage: [['แม่ไปตลาด']],
        questions: [{ prompt: 'ใครไปตลาด', options: ['พ่อ', 'แม่'] }],
        ...gloss,
      }),
    );
  }

  it('checks the passage translation shape and the answer index', () => {
    const root = copy('zh');
    addReader(root, { passage: [['แม่ไปตลาด', 'เกิน']] });
    const m = messages(root);
    expect(m).toContain('l1/th/zh/lessons/zh-B1-r09.json: passage translations [2] do not match the passage\'s paragraphs/sentences [1]');
    expect(m).toContain('l1/th/zh/lessons/zh-B1-r09.json: question 1: answer 2 but only 2 options');
  });

  it('accepts a well-formed reader', () => {
    const root = copy('zh');
    addReader(root, { questions: [{ prompt: 'ใครไปตลาด', options: ['พ่อ', 'แม่', 'น้อง'] }] });
    expect(messages(root).filter((m) => m.includes('zh-B1-r09'))).toEqual([]);
  });
});
