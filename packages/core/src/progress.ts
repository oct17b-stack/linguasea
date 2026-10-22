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

export function touchStreak(streak: Progress['streak'], day: string): Progress['streak'] {
  if (streak.lastDay === day) return streak;
  const count = streak.lastDay === previousDay(day) ? streak.count + 1 : 1;
  return { count, lastDay: day };
}

/** Streak as the learner should see it today: it is gone once a whole day was missed. */
export function currentStreak(streak: Progress['streak'], today: string): number {
  if (!streak.lastDay) return 0;
  return streak.lastDay === today || streak.lastDay === previousDay(today) ? streak.count : 0;
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
  return store(scheduler.next(input, now, correct ? Rating.Good : Rating.Again).card);
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

/**
 * Combines progress from two devices (or device + server) without losing work:
 * lessons stay done, each card keeps its most recent review, XP and streak keep the higher one.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const completed = { ...b.completed };
  for (const [id, at] of Object.entries(a.completed)) {
    if (!completed[id] || at < completed[id]) completed[id] = at;
  }
  const cards = { ...b.cards };
  for (const [id, card] of Object.entries(a.cards)) {
    const other = cards[id];
    const newer =
      later(card.last_review, other?.last_review) ||
      (card.last_review === other?.last_review && card.reps > (other?.reps ?? -1));
    if (!other || newer) {
      cards[id] = card;
    }
  }
  let streak = a.streak.count >= b.streak.count ? a.streak : b.streak;
  if (a.streak.lastDay !== b.streak.lastDay) streak = later(a.streak.lastDay, b.streak.lastDay) ? a.streak : b.streak;
  return { version: 1, completed, cards, xp: Math.max(a.xp, b.xp), streak };
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
