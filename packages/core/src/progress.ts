import { createEmptyCard, fsrs, Rating, type Card, type CardInput } from 'ts-fsrs';

/** A review card as stored on the device / server (dates as ISO strings). */
export type StoredCard = Omit<CardInput, 'due' | 'last_review'> & { due: string; last_review?: string | null };

export type Progress = {
  version: 1;
  /** lessonId → ISO time it was first finished. */
  completed: Record<string, string>;
  /** itemId → review card. Item ids never change, so cards survive content updates. */
  cards: Record<string, StoredCard>;
  xp: number;
  /**
   * XP earned on each device (its install id; "" = earned before this was recorded), so XP two
   * devices earn offline adds up when they sync instead of one side's gain being lost. `xp` is the sum.
   */
  xpBy?: Record<string, number>;
  streak: { count: number; lastDay?: string };
};

export const XP_PER_LESSON = 10;
export const XP_PER_CORRECT = 1;

// No same-day learning steps: a lesson already drills its words, so the first review is a later day.
const scheduler = fsrs({ enable_short_term: false });

export function emptyProgress(): Progress {
  return { version: 1, completed: {}, cards: {}, xp: 0, streak: { count: 0 } };
}

/** Local calendar day, e.g. "2026-10-22". Streaks follow the learner's own midnight. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

/** Days from 1970-01-01 to a "YYYY-MM-DD" day (calendar arithmetic, no time zone or DST involved). */
function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function touchStreak(streak: Progress['streak'], day: string): Progress['streak'] {
  // An earlier day than the last one (flew west past midnight, clock set back) neither counts nor resets.
  if (streak.lastDay && day <= streak.lastDay) return streak;
  const count = streak.lastDay === previousDay(day) ? streak.count + 1 : 1;
  return { count, lastDay: day };
}

/** Streak as the learner should see it today: it is gone once a whole day was missed. */
export function currentStreak(streak: Progress['streak'], today: string): number {
  if (!streak.lastDay) return 0;
  return streak.lastDay >= previousDay(today) ? streak.count : 0;
}

function store(card: Card): StoredCard {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

function grade(card: StoredCard | undefined, correct: boolean, now: Date): StoredCard {
  const input = card ?? createEmptyCard<Card>(now);
  // A card can carry a review time later than this device's clock (another device's clock ran ahead,
  // or this one is behind); FSRS rejects a negative gap, so such an answer counts as given at that time.
  const last = card?.last_review ? new Date(card.last_review) : undefined;
  const at = last && last.getTime() > now.getTime() ? last : now;
  return store(scheduler.next(input, at, correct ? Rating.Good : Rating.Again).card);
}

/**
 * Records a finished lesson: every item answered gets (or updates) a review card,
 * XP is added and the streak moves on. `results` maps item id → answered correctly.
 */
export function completeLesson(
  p: Progress,
  lessonId: string,
  results: Record<string, boolean>,
  now: Date,
): Progress {
  const cards = { ...p.cards };
  let correct = 0;
  for (const [id, ok] of Object.entries(results)) {
    cards[id] = grade(cards[id], ok, now);
    if (ok) correct++;
  }
  return {
    ...p,
    completed: { ...p.completed, [lessonId]: p.completed[lessonId] ?? now.toISOString() },
    cards,
    xp: p.xp + XP_PER_LESSON + correct * XP_PER_CORRECT,
    streak: touchStreak(p.streak, dayKey(now)),
  };
}

/** Grades answers without finishing anything (e.g. a failed unit test still trains the cards). */
export function recordAnswers(p: Progress, results: Record<string, boolean>, now: Date): Progress {
  const cards = { ...p.cards };
  let correct = 0;
  for (const [id, ok] of Object.entries(results)) {
    cards[id] = grade(cards[id], ok, now);
    if (ok) correct++;
  }
  return { ...p, cards, xp: p.xp + correct * XP_PER_CORRECT, streak: touchStreak(p.streak, dayKey(now)) };
}

export function reviewItem(p: Progress, itemId: string, correct: boolean, now: Date): Progress {
  return {
    ...p,
    cards: { ...p.cards, [itemId]: grade(p.cards[itemId], correct, now) },
    xp: p.xp + (correct ? XP_PER_CORRECT : 0),
    streak: touchStreak(p.streak, dayKey(now)),
  };
}

/** Item ids due for review, most overdue first. `prefix` narrows to one course, e.g. "zh.". */
export function dueItems(p: Progress, now: Date, prefix = ''): string[] {
  return Object.entries(p.cards)
    .filter(([id, c]) => id.startsWith(prefix) && new Date(c.due) <= now)
    .sort(([, a], [, b]) => a.due.localeCompare(b.due))
    .map(([id]) => id);
}

function later(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? '') > (b ?? '');
}

/** Whether card `a` holds a later state than `b`: latest review, then more reviews, then any fixed order. */
function newerCard(a: StoredCard, b: StoredCard): boolean {
  if ((a.last_review ?? '') !== (b.last_review ?? '')) return later(a.last_review, b.last_review);
  if (a.reps !== b.reps) return a.reps > b.reps;
  if (a.due !== b.due) return a.due > b.due;
  return JSON.stringify(a) > JSON.stringify(b);
}

/**
 * A streak stands for the run of days lastDay-count+1 … lastDay. Two runs that overlap or touch
 * (one device studied Mon–Wed, the other Thu) make one longer run; otherwise the later run counts.
 */
function mergeStreak(a: Progress['streak'], b: Progress['streak']): Progress['streak'] {
  if (!a.lastDay || a.count <= 0) return b.lastDay && b.count > 0 ? b : a.count >= b.count ? a : b;
  if (!b.lastDay || b.count <= 0) return a;
  const [hi, lo] = a.lastDay > b.lastDay || (a.lastDay === b.lastDay && a.count >= b.count) ? [a, b] : [b, a];
  const end = dayNumber(hi.lastDay!);
  const loEnd = dayNumber(lo.lastDay!);
  const touches = end - hi.count + 1 <= loEnd + 1;
  const count = touches ? Math.max(hi.count, end - (loEnd - lo.count + 1) + 1) : hi.count;
  return { count, lastDay: hi.lastDay };
}

/** XP per device, with XP not yet credited to any device under "". */
function xpParts(p: Progress): Record<string, number> {
  const by = { ...p.xpBy };
  const rest = p.xp - Object.values(by).reduce((n, v) => n + v, 0);
  if (rest > 0) by[''] = (by[''] ?? 0) + rest;
  return by;
}

/**
 * Credits the XP gained between `before` and `after` (e.g. a finished lesson) to this device, so a
 * later merge with another device's progress counts it once and keeps it.
 */
export function creditXp(before: Progress, after: Progress, device: string): Progress {
  const gained = after.xp - before.xp;
  if (gained <= 0) return after;
  const by = xpParts(before);
  return { ...after, xpBy: { ...by, [device]: (by[device] ?? 0) + gained } };
}

/**
 * Combines progress from two devices (or device + server) without losing work:
 * lessons stay done, each card keeps its most recent review, each device's XP keeps its higher count
 * and the total is their sum, and streaks
 * of days that run on from each other add up (see mergeStreak).
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const completed = { ...b.completed };
  for (const [id, at] of Object.entries(a.completed)) {
    if (!completed[id] || at < completed[id]) completed[id] = at;
  }
  const cards = { ...b.cards };
  for (const [id, card] of Object.entries(a.cards)) {
    const other = cards[id];
    if (!other || newerCard(card, other)) cards[id] = card;
  }
  const xpBy = xpParts(b);
  for (const [device, n] of Object.entries(xpParts(a))) xpBy[device] = Math.max(xpBy[device] ?? 0, n);
  const xp = Object.values(xpBy).reduce((n, v) => n + v, 0);
  // Nothing credited to a device yet: keep the plain form (merging it with itself changes nothing).
  const perDevice = Object.keys(xpBy).some((d) => d !== '') ? { xpBy } : {};
  return { version: 1, completed, cards, xp, ...perDevice, streak: mergeStreak(a.streak, b.streak) };
}

/**
 * Marks every lesson of the given stages as done (after a passed placement test), so the course map
 * opens at the next stage. No review cards are created: the learner showed they know this material.
 */
export function skipLessons(p: Progress, lessonIds: string[], now: Date): Progress {
  const completed = { ...p.completed };
  for (const id of lessonIds) completed[id] ??= now.toISOString();
  return { ...p, completed };
}
