import { kindGroup, type Exercise, type Lesson } from './schema';

/**
 * The exercises a lesson runs: its own list, or the standard set when it has none.
 * Standard set: one recognition question per item (sound items are heard first, then read),
 * every other vocabulary item also by ear, the last two vocabulary items the other way round
 * (meaning → text), and speaking for the first and last item.
 */
export function lessonExercises(lesson: Lesson): Exercise[] {
  if (lesson.exercises.length) return lesson.exercises;
  const out: Exercise[] = [];
  const vocab = lesson.items.filter((i) => kindGroup(i.kind) === 'vocab');
  for (const item of lesson.items) {
    if (kindGroup(item.kind) === 'sound') out.push({ type: 'listen-text', item: item.id });
    out.push({ type: 'choose-meaning', item: item.id });
  }
  vocab.forEach((item, i) => {
    if (i % 2 === 1) out.push({ type: 'listen-choose', item: item.id });
  });
  for (const item of vocab.slice(-2)) out.push({ type: 'choose-text', item: item.id });
  const first = lesson.items[0];
  const last = lesson.items[lesson.items.length - 1];
  out.push({ type: 'speak', item: first.id });
  if (last.id !== first.id) out.push({ type: 'speak', item: last.id });
  return out;
}

/** Two readings a learner cannot tell apart by ear (あ "a" / ア "a", 他 / 她 "tā"). */
export function sameReading(a: string, b: string): boolean {
  const norm = (r: string) => r.toLowerCase().replace(/[\s.,!?'’ˈˌ-]/g, '');
  return norm(a) === norm(b);
}
