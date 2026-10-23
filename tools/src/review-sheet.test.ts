import { Course, Lesson, LessonGloss, type CourseBundle } from '@linguasea/contract';
import { describe, expect, it } from 'vitest';

import { reviewRows, toCsv } from './review-sheet';

function fixture(): CourseBundle {
  const course = Course.parse({
    target: 'zh',
    voice: 'zh-CN',
    reading: 'pinyin',
    stages: [{ id: 'C', cefr: 'A2', units: [{ id: 'zh-C1', lessons: ['zh-C1-01', 'zh-C1-r01'], scenario: 'B is Wang Ming.' }] }],
  });
  const lesson = Lesson.parse({
    id: 'zh-C1-01',
    target: 'zh',
    stage: 'C',
    minutes: 8,
    items: [{ id: 'zh.ni-hao', text: '你好', reading: 'nǐ hǎo' }],
    dialogue: [{ speaker: 'a', text: '你好！', reading: 'Nǐ hǎo!' }],
  });
  const reader = Lesson.parse({
    id: 'zh-C1-r01',
    kind: 'reader',
    target: 'zh',
    stage: 'C',
    minutes: 12,
    items: [{ id: 'zh.shu', text: '书', reading: 'shū' }],
    passage: [[{ text: '我有书。', reading: 'Wǒ yǒu shū.' }]],
    questions: [{ answer: 1 }],
  });
  return {
    course,
    gloss: { target: 'zh', name: 'ภาษาจีน', stages: {}, units: { 'zh-C1': { title: 'ทักทาย', goal: 'ทักทายเพื่อนได้' } } },
    lessons: {
      'zh-C1-01': {
        lesson,
        gloss: LessonGloss.parse({
          lesson: 'zh-C1-01',
          title: 'สวัสดี',
          intro: 'คำทักทาย',
          items: { 'zh.ni-hao': { meaning: 'สวัสดี', translit: 'หนี่ห่าว' } },
          dialogue: ['สวัสดี!'],
          notes: [{ title: '你好', body: 'ใช้ได้ทั้งวัน, ทุกคน' }],
        }),
      },
      'zh-C1-r01': {
        lesson: reader,
        gloss: LessonGloss.parse({
          lesson: 'zh-C1-r01',
          title: 'หนังสือ',
          intro: 'บทอ่าน',
          items: { 'zh.shu': { meaning: 'หนังสือ' } },
          passage: [['ฉันมีหนังสือ']],
          questions: [{ prompt: 'มีอะไร?', options: ['ปากกา', 'หนังสือ'] }],
        }),
      },
    },
  };
}

describe('review sheets', () => {
  const rows = reviewRows(fixture());

  it('list each unit, then each lesson: title, intro, text, items, questions, dialogue, notes', () => {
    expect(rows.slice(1).map((r) => `${r[0]} ${r[1]}`)).toEqual([
      'zh-C1 unit',
      'zh-C1 tutor scenario',
      'zh-C1-01 title',
      'zh-C1-01 intro',
      'zh-C1-01 item',
      'zh-C1-01 dialogue',
      'zh-C1-01 note',
      'zh-C1-r01 title',
      'zh-C1-r01 intro',
      'zh-C1-r01 passage',
      'zh-C1-r01 item',
      'zh-C1-r01 question',
    ]);
    const item = rows.find((r) => r[2] === 'zh.ni-hao')!;
    expect(item.slice(4)).toEqual(['你好', 'nǐ hǎo', '', 'สวัสดี', 'หนี่ห่าว', '']);
    expect(rows.at(-1)![7]).toBe('มีอะไร?\n• ปากกา\n✓ หนังสือ');
  });

  it('write CSV that Excel opens as UTF-8, quoting commas, quotes and line breaks', () => {
    const csv = toCsv([['a', 'b,c'], ['say "hi"', 'x\ny']]);
    expect(csv).toBe('﻿a,"b,c"\r\n"say ""hi""","x\ny"\r\n');
  });
});
