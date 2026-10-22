// Test helper: a tiny two-unit Japanese course explained in Thai, shaped like the real bundle.
import { Course, type Bundle, type Lesson, type LessonGloss } from '@linguasea/contract';

type Row = [id: string, kind: string, text: string, reading: string, meaning: string];

const LESSONS: Record<string, { rows: Row[]; dialogue: [string, string, string, string][] }> = {
  'ja-A1-01': {
    rows: [
      ['ja.konnichiwa', 'phrase', 'こんにちは', 'konnichiwa', 'สวัสดี'],
      ['ja.a', 'letter', 'あ', 'a', 'เสียง อะ'],
    ],
    dialogue: [['a', 'こんにちは！', 'konnichiwa!', 'สวัสดี!']],
  },
  'ja-A2-01': {
    rows: [
      ['ja.mizu', 'word', 'みず', 'mizu', 'น้ำ'],
      ['ja.kudasai', 'phrase', 'ください', 'kudasai', 'ขอ…หน่อย'],
    ],
    dialogue: [
      ['a', 'みずを ください。', 'mizu o kudasai.', 'ขอน้ำหน่อย'],
      ['b', 'はい、どうぞ。', 'hai, dōzo.', 'นี่ค่ะ เชิญ'],
    ],
  },
};

export function fixtureBundle(): Bundle {
  const course = Course.parse({
    target: 'ja',
    voice: 'ja-JP',
    reading: 'romaji',
    stages: [
      {
        id: 'A',
        cefr: 'pre-A1',
        free: true,
        units: [
          { id: 'ja-A1', lessons: ['ja-A1-01'] },
          { id: 'ja-A2', lessons: ['ja-A2-01'] },
        ],
      },
    ],
  });
  const lessons: Record<string, { lesson: Lesson; gloss: LessonGloss }> = {};
  for (const [id, { rows, dialogue }] of Object.entries(LESSONS)) {
    lessons[id] = {
      lesson: {
        id,
        kind: 'lesson',
        target: 'ja',
        stage: 'A',
        minutes: 5,
        items: rows.map(([iid, kind, text, reading]) => ({ id: iid, kind: kind as never, text, reading })),
        dialogue: dialogue.map(([speaker, text, reading]) => ({ speaker, text, reading })),
        exercises: [],
        passage: [],
        questions: [],
      },
      gloss: {
        lesson: id,
        title: id,
        intro: id,
        items: Object.fromEntries(rows.map(([iid, , , , meaning]) => [iid, { meaning }])),
        dialogue: dialogue.map(([, , , meaning]) => meaning),
        notes: [],
        passage: [],
        questions: [],
      },
    };
  }
  return {
    version: 'test',
    l1s: {
      th: {
        l1: 'th',
        name: 'ไทย',
        ui: {},
        courses: {
          ja: {
            course,
            gloss: {
              target: 'ja',
              name: 'ภาษาญี่ปุ่น',
              stages: { A: { title: 'เริ่มต้น' } },
              units: { 'ja-A1': { title: 'ทักทาย' }, 'ja-A2': { title: 'สั่งเครื่องดื่ม', goal: 'สั่งน้ำและชาได้' } },
            },
            lessons,
          },
        },
      },
    },
  };
}
