import type { CourseBundle, Lesson, LessonGloss } from '@linguasea/contract';
import { Course } from '@linguasea/contract';
import { describe, expect, it } from 'vitest';

import { reviewSteps, buildSteps, type Step } from './steps';

type Row = [id: string, kind: string, text: string, reading: string, meaning: string, say?: string];

/** A tiny two-lesson course: a kana lesson (with a katakana look-alike) and a vocabulary lesson. */
function fixture(): CourseBundle {
  const lessons: Record<string, Row[]> = {
    'ja-A1-01': [
      ['ja.a', 'letter', 'あ', 'a', 'เสียง อะ'],
      ['ja.i', 'letter', 'い', 'i', 'เสียง อิ'],
      ['ja.u', 'letter', 'う', 'u', 'เสียง อุ'],
      ['ja.e', 'letter', 'え', 'e', 'เสียง เอะ'],
      ['ja.o', 'letter', 'お', 'o', 'เสียง โอะ'],
      ['ja.kata-a', 'letter', 'ア', 'a', 'เสียง อะ (คาตากานะ)'],
    ],
    'ja-A2-01': [
      ['ja.mizu', 'word', 'みず', 'mizu', 'น้ำ'],
      ['ja.ocha', 'word', 'おちゃ', 'ocha', 'ชา'],
      ['ja.pan', 'word', 'パン', 'pan', 'ขนมปัง'],
      ['ja.gohan', 'word', 'ごはん', 'gohan', 'ข้าว'],
    ],
    'ja-A3-01': [['ja.niku', 'word', 'にく', 'niku', 'เนื้อสัตว์']],
  };
  const course = Course.parse({
    target: 'ja',
    voice: 'ja-JP',
    reading: 'romaji',
    stages: [
      {
        id: 'A',
        cefr: 'pre-A1',
        free: true,
        units: Object.keys(lessons).map((id) => ({ id: id.slice(0, 5), lessons: [id] })),
      },
    ],
  });
  const out: CourseBundle['lessons'] = {};
  for (const [id, rows] of Object.entries(lessons)) {
    const lesson: Lesson = {
      id,
      kind: 'lesson',
      target: 'ja',
      stage: 'A',
      minutes: 5,
      items: rows.map(([iid, kind, text, reading, , say]) => ({ id: iid, kind: kind as never, text, reading, say })),
      dialogue: [],
      exercises: [],
      passage: [],
      questions: [],
    };
    const gloss: LessonGloss = {
      lesson: id,
      title: id,
      intro: id,
      items: Object.fromEntries(rows.map(([iid, , , , meaning]) => [iid, { meaning }])),
      dialogue: [],
      notes: [],
      passage: [],
      questions: [],
    };
    out[id] = { lesson, gloss };
  }
  return { course, gloss: { target: 'ja', name: 'ญี่ปุ่น', stages: {}, units: {} }, lessons: out };
}

const chooses = (steps: Step[]) => steps.filter((s) => s.kind === 'choose');

describe('sound items', () => {
  const course = fixture();
  const steps = buildSteps(course, 'ja-A1-01', 3);

  it('are heard first, then read, by default', () => {
    const forA = chooses(steps).filter((s) => s.word.id === 'ja.a');
    expect(forA.map((s) => s.exercise)).toEqual(['listen-text', 'choose-meaning']);
  });

  it('never offer vocabulary as a wrong answer, or a look-alike sound when only heard', () => {
    const vocab = ['ja.mizu', 'ja.ocha', 'ja.pan', 'ja.gohan', 'ja.niku'];
    for (const s of chooses(steps)) {
      for (const c of s.choices) expect(vocab).not.toContain(c.id);
      if (s.exercise === 'listen-text' && s.word.id === 'ja.a') {
        expect(s.choices.map((c) => c.label)).not.toContain('ア');
      }
    }
  });
});

describe('vocabulary questions', () => {
  it('prefer wrong answers the learner has already met', () => {
    const steps = chooses(buildSteps(fixture(), 'ja-A2-01', 5));
    for (const s of steps) {
      // ja-A2-01 has 4 words, so the 3 wrong answers can all come from it — never from ja-A3-01.
      expect(s.choices.map((c) => c.id)).not.toContain('ja.niku');
    }
  });

  it('use exactly the given options when a lesson lists them', () => {
    const course = fixture();
    course.lessons['ja-A2-01'].lesson.exercises = [{ type: 'listen-text', item: 'ja.mizu', options: ['ja.ocha'] }];
    const [s] = chooses(buildSteps(course, 'ja-A2-01'));
    expect(s.choices.map((c) => c.label).sort()).toEqual(['おちゃ', 'みず']);
  });
});

describe('review', () => {
  it('asks sound items by ear', () => {
    const steps = chooses(reviewSteps(fixture(), ['ja.i', 'ja.mizu'], 1));
    expect(steps[0].exercise).toBe('listen-text');
  });
});
