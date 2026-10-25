// Property tests for review scheduling (FSRS), streaks and progress merging between devices.
import { afterEach, describe, expect, it } from 'vitest';

import {
  completeLesson,
  creditXp,
  currentStreak,
  dayKey,
  dueItems,
  emptyProgress,
  mergeProgress,
  recordAnswers,
  reviewItem,
  touchStreak,
  type Progress,
} from './progress';
import { seededRandom } from './rng';

const DAY = 86_400_000;
const T0 = new Date('2026-10-25T03:00:00Z');
const ITEMS = ['zh.a', 'zh.b', 'zh.c', 'zh.d', 'zh.e', 'zh.f'];

function cardOk(id: string, c: Progress['cards'][string], at: Date) {
  for (const k of ['stability', 'difficulty', 'reps', 'lapses', 'scheduled_days', 'elapsed_days'] as const)
    expect(Number.isFinite(c[k]), `${id} ${k}=${c[k]}`).toBe(true);
  expect(c.stability, id).toBeGreaterThan(0);
  expect(c.difficulty, id).toBeGreaterThanOrEqual(1);
  expect(c.difficulty, id).toBeLessThanOrEqual(10);
  const due = new Date(c.due).getTime();
  expect(Number.isNaN(due), id).toBe(false);
  // No same-day steps: the next review is at least a day after the last one, never in the past.
  expect(due - new Date(c.last_review!).getTime(), id).toBeGreaterThanOrEqual(DAY);
  expect(new Date(c.last_review!).getTime(), id).toBeGreaterThanOrEqual(at.getTime() - 1);
  // ISO dates stay in 4-digit years so that string order is time order (dueItems, mergeProgress).
  expect(c.due, id).toMatch(/^\d{4}-\d\d-\d\dT/);
}

/** One device's random history: lessons, reviews at random times (often late, sometimes years later). */
function randomHistory(seed: number, start = T0, steps = 40): Progress {
  const rand = seededRandom(seed);
  let p = emptyProgress();
  let now = start.getTime();
  for (let i = 0; i < steps; i++) {
    const r = rand();
    now += r < 0.05 ? 400 * DAY : r < 0.5 ? DAY * Math.floor(rand() * 4) : Math.floor(rand() * 6 * 3_600_000);
    const at = new Date(now);
    const pick = () => ITEMS[Math.floor(rand() * ITEMS.length)];
    if (rand() < 0.3)
      p = completeLesson(
        p,
        `zh-A1-0${1 + Math.floor(rand() * 9)}`,
        { [pick()]: rand() < 0.7, [pick()]: rand() < 0.7 },
        at,
      );
    else if (rand() < 0.5) p = recordAnswers(p, { [pick()]: rand() < 0.7 }, at);
    else p = reviewItem(p, pick(), rand() < 0.7, at);
  }
  return p;
}

describe('review scheduling (FSRS)', () => {
  it('stays finite and sane over long random histories, including year-long gaps', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const p = randomHistory(seed, T0, 80);
      for (const [id, c] of Object.entries(p.cards)) cardOk(id, c, T0);
    }
  });

  it('brings a missed item back no later than a known one, from any state', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const p = randomHistory(seed);
      for (const id of Object.keys(p.cards)) {
        const at = new Date(Math.max(new Date(p.cards[id].due).getTime(), Date.parse(p.cards[id].last_review!) + DAY));
        const good = reviewItem(p, id, true, at).cards[id];
        const again = reviewItem(p, id, false, at).cards[id];
        expect(new Date(again.due) <= new Date(good.due), `${seed} ${id}`).toBe(true);
        expect(again.lapses).toBe(p.cards[id].lapses + 1);
      }
    }
  });

  it('grows intervals while every review is right and on time', () => {
    let p = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.a': true }, T0);
    let prev = 0;
    for (let i = 0; i < 12; i++) {
      const c = p.cards['zh.a'];
      expect(c.scheduled_days).toBeGreaterThanOrEqual(prev);
      prev = c.scheduled_days;
      p = reviewItem(p, 'zh.a', true, new Date(c.due));
    }
    expect(prev).toBeGreaterThan(30);
  });

  it('does not throw when a card was last reviewed "in the future" (another device clock ran ahead)', () => {
    const ahead = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.a': true }, new Date(T0.getTime() + 2 * DAY));
    for (const ok of [true, false]) {
      const p = reviewItem(ahead, 'zh.a', ok, T0);
      cardOk('zh.a', p.cards['zh.a'], T0);
      expect(p.cards['zh.a'].reps).toBe(2);
      expect(() => completeLesson(ahead, 'zh-A1-02', { 'zh.a': ok }, T0)).not.toThrow();
      expect(() => recordAnswers(ahead, { 'zh.a': ok }, T0)).not.toThrow();
    }
  });

  it('lists due items most overdue first, by instant regardless of time zone', () => {
    const p = randomHistory(7);
    const later = new Date(T0.getTime() + 3000 * DAY);
    const due = dueItems(p, later);
    expect(due.sort()).toEqual(Object.keys(p.cards).sort());
    const ordered = dueItems(p, later).map((id) => Date.parse(p.cards[id].due));
    expect(ordered).toEqual([...ordered].sort((a, b) => a - b));
    expect(dueItems(p, new Date(0))).toEqual([]);
  });
});

describe('streaks across midnight, time zones and DST', () => {
  const tz = process.env.TZ;
  afterEach(() => {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  });

  it.each([
    'America/New_York',
    'Europe/London',
    'America/Santiago',
    'Australia/Lord_Howe',
    'Asia/Bangkok',
    'Pacific/Kiritimati',
  ])('counts one per calendar day every day of two years in %s', (zone) => {
    process.env.TZ = zone;
    if (zone === 'Asia/Bangkok') expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-420);
    let s: Progress['streak'] = { count: 0 };
    // Study at 00:30 and 23:30 local time each day (DST changes happen around these hours).
    for (let d = 0; d < 730; d++) {
      for (const [h, m] of [
        [0, 30],
        [23, 30],
      ]) {
        const at = new Date(2026, 0, 1 + d, h, m);
        s = touchStreak(s, dayKey(at));
        expect(currentStreak(s, dayKey(at)), `${zone} ${at.toString()}`).toBe(d + 1);
      }
    }
    expect(s.count).toBe(730);
  });

  it('moving to an earlier calendar day (flying west, clock set back) keeps the streak', () => {
    const s = { count: 5, lastDay: '2026-10-23' };
    expect(touchStreak(s, '2026-10-22')).toEqual(s);
    expect(currentStreak(s, '2026-10-22')).toBe(5);
    expect(touchStreak(touchStreak(s, '2026-10-22'), '2026-10-24').count).toBe(6);
  });

  it('crosses month, year and leap-day boundaries', () => {
    let s = touchStreak({ count: 0 }, '2028-02-28');
    s = touchStreak(s, '2028-02-29');
    s = touchStreak(s, '2028-03-01');
    expect(s.count).toBe(3);
    expect(touchStreak({ count: 4, lastDay: '2026-12-31' }, '2027-01-01').count).toBe(5);
    expect(touchStreak({ count: 4, lastDay: '2027-02-28' }, '2027-03-01').count).toBe(5);
    expect(currentStreak({ count: 4, lastDay: '2026-12-31' }, '2027-01-02')).toBe(0);
  });
});

describe('mergeProgress (sync between devices)', () => {
  const pairs = Array.from({ length: 50 }, (_, i) => {
    // Two devices that share a history, then go on separately.
    const shared = randomHistory(1000 + i, T0, 15);
    const end = Math.max(T0.getTime(), ...Object.values(shared.cards).map((c) => Date.parse(c.last_review!)));
    const a = mergeProgress(shared, randomHistory(2000 + i, new Date(end), 20));
    const b = mergeProgress(shared, randomHistory(3000 + i, new Date(end + (i % 3) * DAY), 20));
    return [a, b] as const;
  });

  it('is commutative and idempotent', () => {
    for (const [a, b] of pairs) {
      const ab = mergeProgress(a, b);
      expect(mergeProgress(b, a)).toEqual(ab);
      expect(mergeProgress(a, a)).toEqual(a);
      expect(mergeProgress(ab, a)).toEqual(ab);
      expect(mergeProgress(ab, b)).toEqual(ab);
      // A JSON round trip (server storage) changes nothing.
      expect(mergeProgress(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)))).toEqual(ab);
    }
  });

  it('never loses a finished lesson, an item, XP or the latest review', () => {
    for (const [a, b] of pairs) {
      const m = mergeProgress(a, b);
      for (const side of [a, b]) {
        for (const [id, at] of Object.entries(side.completed)) expect(m.completed[id] <= at).toBe(true);
        for (const [id, c] of Object.entries(side.cards)) {
          expect(m.cards[id]).toBeDefined();
          expect((m.cards[id].last_review ?? '') >= (c.last_review ?? '')).toBe(true);
        }
        expect(m.xp).toBeGreaterThanOrEqual(side.xp);
        expect(m.streak.count).toBeGreaterThanOrEqual(0);
      }
      expect(m.streak.lastDay).toBe([a.streak.lastDay ?? '', b.streak.lastDay ?? ''].sort()[1] || undefined);
    }
  });

  it('keeps the earliest finish time of a lesson', () => {
    const a = completeLesson(emptyProgress(), 'zh-A1-01', {}, new Date(T0.getTime() + DAY));
    const b = completeLesson(emptyProgress(), 'zh-A1-01', {}, T0);
    expect(mergeProgress(a, b).completed['zh-A1-01']).toBe(T0.toISOString());
    expect(mergeProgress(b, a).completed['zh-A1-01']).toBe(T0.toISOString());
  });

  it('picks the same card on both sides when two devices reviewed it at the same instant', () => {
    const base = completeLesson(emptyProgress(), 'zh-A1-01', { 'zh.a': true }, T0);
    const at = new Date(T0.getTime() + 3 * DAY);
    const a = reviewItem(base, 'zh.a', true, at);
    const b = reviewItem(base, 'zh.a', false, at);
    expect(mergeProgress(a, b).cards['zh.a']).toEqual(mergeProgress(b, a).cards['zh.a']);
  });

  it('adds up XP two devices earned offline, once', () => {
    const base = { ...emptyProgress(), xp: 100 };
    const earn = (p: Progress, device: string, lessonId: string, results: Record<string, boolean>) =>
      creditXp(p, completeLesson(p, lessonId, results, T0), device);
    const phone = earn(base, 'phone', 'zh-A1-01', { 'zh.a': true, 'zh.b': true }); // +12
    const tablet = earn(base, 'tablet', 'zh-A1-02', {}); // +10
    const m = mergeProgress(phone, tablet);
    expect(m.xp).toBe(122);
    expect(mergeProgress(tablet, phone)).toEqual(m);
    // Syncing again (or with the server's copy of either side) adds nothing.
    expect(mergeProgress(m, phone).xp).toBe(122);
    expect(mergeProgress(mergeProgress(m, tablet), m)).toEqual(m);
    // The phone goes on from the merged state; the tablet's old copy doesn't undo it.
    const more = earn(m, 'phone', 'zh-A1-03', {});
    expect(mergeProgress(more, tablet).xp).toBe(132);
    // Survives storage as JSON.
    expect(mergeProgress(JSON.parse(JSON.stringify(more)), tablet)).toEqual(mergeProgress(more, tablet));
  });

  it('keeps the old single-number XP form until a device earns XP', () => {
    const a = { ...emptyProgress(), xp: 40 };
    const b = { ...emptyProgress(), xp: 70 };
    expect(mergeProgress(a, b)).not.toHaveProperty('xpBy');
    expect(mergeProgress(a, b).xp).toBe(70);
    expect(creditXp(a, a, 'phone')).toBe(a);
  });

  it('joins streaks of days that run on from each other', () => {
    const s = (count: number, lastDay?: string) => ({
      ...emptyProgress(),
      streak: lastDay ? { count, lastDay } : { count },
    });
    const merged = (a: Progress, b: Progress) => {
      const m = mergeProgress(a, b);
      expect(mergeProgress(b, a).streak).toEqual(m.streak);
      return m.streak;
    };
    // Phone: Oct 18–22. Tablet (offline, new): Oct 23 only → 6 days in a row.
    expect(merged(s(5, '2026-10-22'), s(1, '2026-10-23'))).toEqual({ count: 6, lastDay: '2026-10-23' });
    // Overlapping runs: Oct 18–22 and Oct 21–24 → Oct 18–24.
    expect(merged(s(5, '2026-10-22'), s(4, '2026-10-24'))).toEqual({ count: 7, lastDay: '2026-10-24' });
    // One run inside the other.
    expect(merged(s(10, '2026-10-24'), s(2, '2026-10-20'))).toEqual({ count: 10, lastDay: '2026-10-24' });
    // A missed day in between: only the later run counts.
    expect(merged(s(5, '2026-10-22'), s(1, '2026-10-24'))).toEqual({ count: 1, lastDay: '2026-10-24' });
    // Same day: the longer run.
    expect(merged(s(3, '2026-10-24'), s(8, '2026-10-24'))).toEqual({ count: 8, lastDay: '2026-10-24' });
    // Across a month and a year end.
    expect(merged(s(31, '2026-12-31'), s(1, '2027-01-01'))).toEqual({ count: 32, lastDay: '2027-01-01' });
    // A fresh device.
    expect(merged(s(4, '2026-10-24'), s(0))).toEqual({ count: 4, lastDay: '2026-10-24' });
    expect(merged(s(0), s(0))).toEqual({ count: 0 });
  });
});
