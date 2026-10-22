import { Course, Lesson, LessonGloss, type CourseBundle } from '@linguasea/contract';
import { describe, expect, it } from 'vitest';

import { estimateHours, STUDY_MINUTES } from './hours';
import { coursePath, nodeAccess } from './path';
import { practiceSteps, unitTestPassed, unitTestSteps } from './practice';
import { completeLesson, emptyProgress, recordAnswers } from './progress';
import { buildSteps } from './steps';

/** Unit zh-C1: five lessons (with dialogues) and one reader; stage C is paid. */
function fixture(): CourseBundle {
  const ids = ['zh-C1-01', 'zh-C1-02', 'zh-C1-03', 'zh-C1-r01', 'zh-C1-04'];
  const course = Course.parse({
    target: 'zh',
    voice: 'zh-CN',
    reading: 'pinyin',
    stages: [{ id: 'C', cefr: 'A2', units: [{ id: 'zh-C1', lessons: ids }] }],
  });
  const lessons: CourseBundle['lessons'] = {};
  ids.forEach((id, n) => {
    const reader = id.includes('-r');
    const words = [0, 1, 2].map((k) => ({ id: `zh.w${n}${k}`, text: `词${n}${k}`, reading: `cí${n}${k}` }));
    lessons[id] = {
      lesson: Lesson.parse({
        id,
        kind: reader ? 'reader' : 'lesson',
        target: 'zh',
        stage: 'C',
        minutes: reader ? 12 : 8,
        items: words,
        dialogue: reader ? [] : [0, 1].map((k) => ({ speaker: k ? 'b' : 'a', text: `句${n}${k}。`, reading: `jù${n}${k}.` })),
        passage: reader ? [[{ text: '第一句。', reading: 'dì yī jù.' }, { text: '第二句。', reading: 'dì èr jù.' }], [{ text: '第三句。', reading: 'dì sān jù.' }]] : [],
        questions: reader ? [{ answer: 1 }] : [],
      }),
      gloss: LessonGloss.parse({
        lesson: id,
        title: `บทที่ ${n}`,
        intro: 'บทนำ',
        items: Object.fromEntries(words.map((w) => [w.id, { meaning: `ความหมาย ${w.id}` }])),
        dialogue: reader ? [] : [0, 1].map((k) => `ประโยค ${n}${k}`),
        passage: reader ? [['ประโยคแรก', 'ประโยคที่สอง'], ['ประโยคที่สาม']] : [],
        questions: reader ? [{ prompt: 'ใครไปตลาด', options: ['แม่', 'พ่อ', 'น้อง'] }] : [],
      }),
    };
  });
  return { course, gloss: { target: 'zh', name: 'ภาษาจีน', stages: {}, units: {} }, lessons };
}

describe('course path', () => {
  const course = fixture().course;
  const path = coursePath(course);

  it('puts a practice after every two lessons and a test at the end of the unit', () => {
    expect(path.map((n) => `${n.type}:${n.id}`)).toEqual([
      'lesson:zh-C1-01',
      'lesson:zh-C1-02',
      'practice:zh-C1-p1',
      'lesson:zh-C1-03',
      'reader:zh-C1-r01',
      'practice:zh-C1-p2',
      'lesson:zh-C1-04',
      'test:zh-C1-test',
    ]);
  });

  it('opens practice and tests once what they cover is done, behind the paywall on paid stages', () => {
    const p1 = path.find((n) => n.id === 'zh-C1-p1')!;
    expect(nodeAccess(course, p1, { 'zh-C1-01': 1 }, true)).toBe('locked');
    expect(nodeAccess(course, p1, { 'zh-C1-01': 1, 'zh-C1-02': 1 }, true)).toBe('open');
    expect(nodeAccess(course, p1, { 'zh-C1-01': 1, 'zh-C1-02': 1 }, false)).toBe('premium');
    // Practice never blocks the next lesson.
    const next = path.find((n) => n.id === 'zh-C1-03')!;
    expect(nodeAccess(course, next, { 'zh-C1-01': 1, 'zh-C1-02': 1 }, true)).toBe('open');
  });
});

describe('readers', () => {
  it('show the text, then the glossary, then comprehension questions', () => {
    const steps = buildSteps(fixture(), 'zh-C1-r01', 1);
    expect(steps.map((s) => s.kind).slice(0, 6)).toEqual(['intro', 'read', 'learn', 'learn', 'learn', 'question']);
    const read = steps[1] as Extract<(typeof steps)[number], { kind: 'read' }>;
    expect(read.paragraphs.map((p) => p.map((s) => s.meaning))).toEqual([['ประโยคแรก', 'ประโยคที่สอง'], ['ประโยคที่สาม']]);
    const q = steps[5] as Extract<(typeof steps)[number], { kind: 'question' }>;
    expect(q.choices.find((c) => c.correct)?.label).toBe('พ่อ');
  });
});

describe('practice and unit tests', () => {
  it('practice asks about the covered words, a few earlier ones, sentences by ear and speaking', () => {
    const steps = practiceSteps(fixture(), 'zh-C1-p2', 3);
    const words = steps.flatMap((s) => (s.kind === 'choose' ? [s.word.lesson] : []));
    expect(words.filter((l) => l === 'zh-C1-03' || l === 'zh-C1-r01')).toHaveLength(6);
    expect(words.length).toBeGreaterThan(6);
    expect(words.every((l) => ['zh-C1-01', 'zh-C1-02', 'zh-C1-03', 'zh-C1-r01'].includes(l))).toBe(true);
    expect(steps.filter((s) => s.kind === 'speak')).toHaveLength(2);
    expect(steps.at(-1)).toEqual({ kind: 'done' });
  });

  it('sentence questions use other sentences as wrong answers', () => {
    const steps = unitTestSteps(fixture(), 'zh-C1-test', 2);
    const lines = steps.filter((s) => s.kind === 'line');
    expect(lines).toHaveLength(3);
    for (const s of lines) {
      if (s.kind !== 'line') continue;
      expect(s.choices).toHaveLength(4);
      expect(s.choices.find((c) => c.correct)?.label).toBe(s.line.meaning);
    }
    expect(steps.filter((s) => s.kind === 'choose')).toHaveLength(15);
  });

  it('passes the unit test at 70 % and a failed test still trains the words', () => {
    expect(unitTestPassed(7, 10)).toBe(true);
    expect(unitTestPassed(6, 10)).toBe(false);
    const p = recordAnswers(emptyProgress(), { 'zh.w00': true, 'zh.w01': false }, new Date(2026, 9, 22));
    expect(Object.keys(p.cards)).toHaveLength(2);
    expect(p.completed).toEqual({});
    expect(completeLesson(p, 'zh-C1-test', {}, new Date(2026, 9, 22)).completed['zh-C1-test']).toBeDefined();
  });
});

describe('study time', () => {
  it('adds lessons, readers, practice, tests, tutor and review', () => {
    const { stages, hours } = estimateHours(fixture());
    const c = stages[0];
    expect([c.lessons, c.readers, c.practice, c.tests, c.units]).toEqual([4, 1, 2, 1, 1]);
    expect(c.minutes.lessons).toBe(32);
    expect(c.minutes.readers).toBe(12);
    expect(c.minutes.practice).toBe(2 * STUDY_MINUTES.practice);
    expect(c.minutes.review).toBe(Math.round((32 + 12 + 20) * STUDY_MINUTES.reviewShare));
    const total = 32 + 12 + 20 + STUDY_MINUTES.unitTest + STUDY_MINUTES.tutor + c.minutes.review;
    expect(hours).toBe(Math.round((total / 60) * 10) / 10);
  });
});
