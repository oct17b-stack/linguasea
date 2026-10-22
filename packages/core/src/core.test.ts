import { describe, expect, it } from 'vitest';

import { lessonAccess, lessonOrder } from './access';
import {
  completeLesson,
  currentStreak,
  dayKey,
  dueItems,
  emptyProgress,
  mergeProgress,
  reviewItem,
  touchStreak,
} from './progress';
import { buildSteps, reviewSteps } from './steps';
import { th } from './test-bundle';

describe('buildSteps', () => {
  it('walks a lesson from intro to done', () => {
    const { lesson, gloss } = th.courses.zh!.lessons['zh-A1-01'];
    const steps = buildSteps(th.courses.zh!, 'zh-A1-01');
    expect(steps[0]).toMatchObject({ kind: 'intro', title: gloss.title });
    expect(steps.filter((s) => s.kind === 'learn')).toHaveLength(lesson.items.length);
    expect(steps.some((s) => s.kind === 'dialogue')).toBe(lesson.dialogue.length > 0);
    expect(steps.at(-1)).toEqual({ kind: 'done' });
  });

  it('gives every choice question distinct answers with exactly one right (4 unless the lesson lists its own)', () => {
    for (const [target, course] of Object.entries(th.courses)) {
      for (const id of Object.keys(course!.lessons)) {
        const listed = new Set(
          course!.lessons[id].lesson.exercises.filter((e) => 'options' in e && e.options).map((e) => `${e.type} ${e.item}`),
        );
        for (const s of buildSteps(course!, id)) {
          if (s.kind !== 'choose') continue;
          const where = `${target} ${id} ${s.exercise} ${s.word.id}`;
          if (!listed.has(`${s.exercise} ${s.word.id}`)) expect(s.choices, where).toHaveLength(4);
          expect(new Set(s.choices.map((c) => c.label)).size, where).toBe(s.choices.length);
          expect(s.choices.filter((c) => c.correct), where).toHaveLength(1);
        }
      }
    }
  });

  it('is the same for the same seed', () => {
    const course = th.courses.ko!;
    expect(buildSteps(course, 'ko-A1-01', 7)).toEqual(buildSteps(course, 'ko-A1-01', 7));
  });
});

describe('reviewSteps', () => {
  it('asks one question per known item and skips unknown ids', () => {
    const course = th.courses.zh!;
    const words = Object.values(course.lessons)
      .flatMap((e) => e.lesson.items)
      .filter((i) => i.kind === 'word' || i.kind === 'phrase')
      .map((i) => i.id);
    const ids = [words[0], words[words.length - 1]];
    const steps = reviewSteps(course, [...ids, 'zh.nope'], 1);
    expect(steps.map((s) => s.kind === 'choose' && s.word.id)).toEqual(ids);
    expect(steps.map((s) => s.kind === 'choose' && s.exercise)).toEqual(['listen-choose', 'choose-meaning']);
  });
});

describe('lessonAccess', () => {
  const course = th.courses.ja!.course;
  const order = lessonOrder(course);
  const firstPaid = course.stages.find((s) => !s.free)!.units[0].lessons[0];
  const beforePaid = order[order.indexOf(firstPaid) - 1];
  const allBefore = Object.fromEntries(order.slice(0, order.indexOf(firstPaid)).map((id) => [id, 'done']));

  it('opens the first lesson and locks later ones in order', () => {
    expect(lessonAccess(course, order[0], {}, false)).toBe('open');
    expect(lessonAccess(course, order[1], {}, true)).toBe('locked');
    expect(lessonAccess(course, order[1], { [order[0]]: 'done' }, true)).toBe('open');
    expect(lessonAccess(course, firstPaid, {}, true)).toBe(beforePaid ? 'locked' : 'open');
  });
  it('asks for the subscription on paid stages', () => {
    expect(lessonAccess(course, firstPaid, allBefore, false)).toBe('premium');
    expect(lessonAccess(course, firstPaid, allBefore, true)).toBe('open');
  });
});

describe('progress', () => {
  const now = new Date(2026, 9, 22, 9);

  it('creates review cards, XP and a streak when a lesson is done', () => {
    const p = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true, 'zh.xie-xie': false }, now);
    expect(Object.keys(p.cards).sort()).toEqual(['zh.ni-hao', 'zh.xie-xie']);
    expect(p.xp).toBe(11);
    expect(p.streak).toEqual({ count: 1, lastDay: '2026-10-22' });
    expect(p.completed['zh-A1-01']).toBe(now.toISOString());
  });

  it('brings a missed word back sooner than a known one', () => {
    const p = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true, 'zh.xie-xie': false }, now);
    expect(new Date(p.cards['zh.xie-xie'].due) < new Date(p.cards['zh.ni-hao'].due)).toBe(true);
    const later = new Date(now.getTime() + 36 * 3_600_000);
    expect(dueItems(p, later)).toEqual(['zh.xie-xie']);
    expect(dueItems(p, later, 'ja.')).toEqual([]);
  });

  it('survives a JSON round trip (storage) and keeps scheduling', () => {
    const p = JSON.parse(JSON.stringify(completeLesson(emptyProgress(), 'en-A1-01', { 'en.hello': true }, now)));
    const next = reviewItem(p, 'en.hello', true, new Date(now.getTime() + 3 * 86_400_000));
    expect(next.cards['en.hello'].reps).toBe(2);
  });

  it('counts consecutive days and resets after a gap', () => {
    let s = touchStreak({ count: 0 }, '2026-10-30');
    s = touchStreak(s, '2026-10-31');
    s = touchStreak(s, '2026-11-01');
    expect(s.count).toBe(3);
    expect(touchStreak(s, '2026-11-01').count).toBe(3);
    expect(currentStreak(s, '2026-11-02')).toBe(3);
    expect(currentStreak(s, '2026-11-03')).toBe(0);
    expect(touchStreak(s, '2026-11-03').count).toBe(1);
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('mergeProgress', () => {
  it('keeps work from both devices and the latest review of each card', () => {
    const day1 = new Date(2026, 9, 22, 9);
    const day3 = new Date(2026, 9, 24, 9);
    const phone = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.ni-hao': true }, day1);
    const tablet = reviewItem(
      completeLesson(emptyProgress(), 'ja-A1-01', { 'ja.konnichiwa': true }, day1),
      'ja.konnichiwa',
      true,
      day3,
    );
    const phoneLater = reviewItem(phone, 'zh.ni-hao', false, day3);
    const merged = mergeProgress(phoneLater, { ...tablet, cards: { ...tablet.cards, 'zh.ni-hao': phone.cards['zh.ni-hao'] } });
    expect(Object.keys(merged.completed).sort()).toEqual(['ja-A1-01', 'zh-A1-01']);
    expect(merged.cards['zh.ni-hao']).toEqual(phoneLater.cards['zh.ni-hao']);
    expect(merged.cards['ja.konnichiwa'].reps).toBe(2);
    expect(merged.xp).toBe(Math.max(phoneLater.xp, tablet.xp));
    expect(mergeProgress(merged, merged)).toEqual(merged);
  });
});
