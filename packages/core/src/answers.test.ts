// Wrong answers a learner cannot tell from the right one, and practice that reaches past the lesson.
import type { CourseBundle } from '@linguasea/contract';
import { describe, expect, it } from 'vitest';

import { lessonOrder } from './access';
import { practiceId } from './path';
import { coursePool, labelKey, sameLabel, type Word } from './pool';
import { practiceSteps, unitTestSteps } from './practice';
import { seededRandom } from './rng';
import { chooseStep } from './steps';
import { th } from './test-bundle';

/** A copy of the real zh course whose lessons can be changed without touching the shared bundle. */
function zhCopy(): CourseBundle {
  return structuredClone(th.courses.zh!);
}

describe('labelKey', () => {
  it('ignores case, spacing, punctuation, brackets and full-width forms, but not tones or letters', () => {
    expect(sameLabel('เยี่ยมเลย! ขอบคุณ', 'เยี่ยมเลย ขอบคุณ!')).toBe(true);
    expect(sameLabel('ออกไป (ข้างนอก)', 'ออกไปข้างนอก')).toBe(true);
    expect(sameLabel('เสาร์อาทิตย์… ปกติ… ทำอะไร', 'เสาร์อาทิตย์ปกติทำอะไร')).toBe(true);
    expect(sameLabel('Hello', 'hello.')).toBe(true);
    expect(sameLabel('ＡＢＣ１', 'abc1')).toBe(true);
    expect(sameLabel('你好？', '你好')).toBe(true);
    expect(sameLabel('mā', 'má')).toBe(false);
    expect(sameLabel('mā', 'ma')).toBe(false);
    expect(sameLabel('は', 'ば')).toBe(false);
    expect(sameLabel('ㅐ', 'ㅔ')).toBe(false);
    // Labels made only of punctuation still differ from each other.
    expect(labelKey('。')).not.toBe(labelKey('、'));
  });
});

describe('chooseStep', () => {
  const w = (id: string, text: string, meaning: string, order: number): Word => ({
    id,
    kind: 'word',
    text,
    reading: id,
    meaning,
    lesson: 'x',
    order,
  });
  const pool = new Map(
    [
      w('t.out', 'out', 'ออกไปข้างนอก', 1),
      w('t.out2', 'go out', 'ออกไป (ข้างนอก)', 1),
      w('t.hello', 'Hello', 'สวัสดี', 1),
      w('t.hello2', 'hello!', 'หวัดดี', 1),
      ...['หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า'].map((m, i) => w(`t.n${i}`, `n${i}`, m, 1)),
    ].map((x) => [x.id, x]),
  );

  it('never offers a meaning that differs from the answer only in punctuation', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const type of ['choose-meaning', 'listen-choose', 'choose-text'] as const) {
        const s = chooseStep(pool, pool.get('t.out')!, { type }, 9, seededRandom(seed));
        if (s.kind !== 'choose') throw new Error();
        expect(s.choices.map((c) => c.id)).not.toContain('t.out2');
        expect(new Set(s.choices.map((c) => labelKey(c.label))).size).toBe(s.choices.length);
      }
    }
  });

  it('never offers a word that differs from the answer only in case or punctuation', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = chooseStep(pool, pool.get('t.hello')!, { type: 'choose-text' }, 9, seededRandom(seed));
      if (s.kind !== 'choose') throw new Error();
      expect(s.choices.map((c) => c.id)).not.toContain('t.hello2');
    }
  });
});

describe('sentence questions of practice and tests', () => {
  it('never offer two sentences whose meanings differ only in punctuation, or that sound the same', () => {
    const course = zhCopy();
    const [l1, l2] = course.course.stages[0].units[0].lessons;
    const a = course.lessons[l1];
    const b = course.lessons[l2];
    // Lesson 2 repeats lesson 1's first line with other punctuation, and its second line word for word.
    b.gloss.dialogue[0] = `${a.gloss.dialogue[0]}!`;
    b.lesson.dialogue[1] = { ...a.lesson.dialogue[1] };
    b.gloss.dialogue[1] = `${a.gloss.dialogue[1]} (อีกแบบ)`;
    for (let seed = 1; seed <= 100; seed++) {
      for (const s of practiceSteps(course, practiceId(course.course.stages[0].units[0].id, 1), seed)) {
        if (s.kind !== 'line') continue;
        expect(new Set(s.choices.map((c) => labelKey(c.label))).size).toBe(s.choices.length);
        const texts = s.choices.map((c) => c.id.replace(/^line-\d-/, ''));
        expect(new Set(texts).size).toBe(texts.length);
      }
    }
  });
});

describe('practice of lessons that teach no new words', () => {
  it('asks about earlier words only, never about later ones', () => {
    const course = zhCopy();
    const unit = course.course.stages[0].units[1];
    const [, , l3, l4] = unit.lessons;
    const first = course.lessons[course.course.stages[0].units[0].lessons[0]];
    // Lessons 3 and 4 of the unit only reuse a word of the very first lesson.
    for (const id of [l3, l4]) {
      course.lessons[id].lesson.items = [first.lesson.items[0]];
      course.lessons[id].lesson.exercises = [];
      course.lessons[id].gloss.items = { [first.lesson.items[0].id]: first.gloss.items[first.lesson.items[0].id] };
    }
    const upTo = lessonOrder(course.course).indexOf(l4) + 1;
    const pool = coursePool(course);
    for (let seed = 1; seed <= 30; seed++) {
      for (const s of practiceSteps(course, practiceId(unit.id, 2), seed)) {
        if (s.kind === 'choose') {
          expect(s.word.order).toBeLessThanOrEqual(upTo);
          for (const c of s.choices) expect(pool.get(c.id)!.order).toBeLessThanOrEqual(upTo);
        }
      }
      for (const s of unitTestSteps(course, `${unit.id}-test`, seed))
        if (s.kind === 'choose') expect(s.word.order).toBeLessThanOrEqual(upTo + unit.lessons.length);
    }
  });
});
