import { sameReading, type CourseBundle } from '@linguasea/contract';

import { lessonOrder } from './access';
import { coursePath } from './path';
import { coursePool, sameLabel, type Word } from './pool';
import { seededRandom, shuffle } from './rng';
import { chooseStep, recallQuestion, type DialogueLine, type Step } from './steps';

/** Share of a unit test to get right to pass it. */
export const UNIT_TEST_PASS = 0.7;

function questionFor(course: CourseBundle, pool: ReadonlyMap<string, Word>, w: Word, i: number, upTo: number, rand: () => number): Step {
  return chooseStep(pool, w, recallQuestion(course, w, i), upTo, rand);
}

/** Dialogue lines of some lessons with their translations. */
function linesOf(course: CourseBundle, lessonIds: string[]): DialogueLine[] {
  return lessonIds.flatMap((id) => {
    const e = course.lessons[id];
    return e ? e.lesson.dialogue.map((l, i) => ({ ...l, meaning: e.gloss.dialogue[i] ?? '' })) : [];
  });
}

/** "Hear a sentence, pick its meaning" — wrong answers are other sentences from the same lessons. */
function lineSteps(lines: DialogueLine[], count: number, rand: () => number): Step[] {
  // One line per meaning, and no two lines that sound alike: otherwise two answers would be right.
  const distinct: DialogueLine[] = [];
  for (const l of lines) {
    if (!l.meaning.trim()) continue;
    const clash = distinct.some(
      (d) => sameLabel(d.meaning, l.meaning) || sameLabel(d.text, l.text) || sameReading(d.reading, l.reading),
    );
    if (!clash) distinct.push(l);
  }
  if (distinct.length < 4) return [];
  return shuffle(distinct, rand)
    .slice(0, count)
    .map((line) => {
      const wrong = shuffle(distinct.filter((l) => l !== line), rand).slice(0, 3);
      const choices = shuffle(
        [line, ...wrong].map((l, k) => ({ id: `line-${k}-${l.text}`, label: l.meaning, correct: l === line })),
        rand,
      );
      return { kind: 'line' as const, line, choices };
    });
}

/**
 * Course positions (as in Word.order) of the first and last of some lessons. Taken from the lessons
 * themselves, not their new words: lessons that only reuse earlier words must not open the whole course.
 */
function span(course: CourseBundle, lessonIds: string[]): { first: number; latest: number } {
  const order = lessonOrder(course.course);
  const at = lessonIds.map((id) => order.indexOf(id) + 1).filter((n) => n > 0);
  return { first: Math.min(...at), latest: Math.max(0, ...at) };
}

function nodeOf(course: CourseBundle, id: string) {
  const node = coursePath(course.course).find((n) => n.id === id);
  if (!node || !('covers' in node)) throw new Error(`unknown practice or test ${id}`);
  return node;
}

/**
 * A practice session (≈10 min): every word from the two lessons it covers, a few earlier words
 * for spaced recall, two sentences by ear and two to say aloud.
 */
export function practiceSteps(course: CourseBundle, id: string, seed = Date.now()): Step[] {
  const node = nodeOf(course, id);
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const fresh = [...pool.values()].filter((w) => node.covers.includes(w.lesson));
  const { first, latest } = span(course, node.covers);
  const earlier = shuffle([...pool.values()].filter((w) => w.order < first), rand).slice(0, 4);
  const words = shuffle([...fresh, ...earlier], rand);
  const steps: Step[] = words.map((w, i) => questionFor(course, pool, w, i, latest, rand));
  steps.push(...lineSteps(linesOf(course, node.covers), 2, rand));
  for (const w of shuffle(fresh, rand).slice(0, 2)) steps.push({ kind: 'speak', word: w });
  steps.push({ kind: 'done' });
  return steps;
}

/** The unit test (≈12 min): up to 15 of the unit's words plus three sentences by ear; pass at 70 %. */
export function unitTestSteps(course: CourseBundle, id: string, seed = Date.now()): Step[] {
  const node = nodeOf(course, id);
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const words = shuffle([...pool.values()].filter((w) => node.covers.includes(w.lesson)), rand).slice(0, 15);
  const { latest } = span(course, node.covers);
  const steps: Step[] = words.map((w, i) => questionFor(course, pool, w, i, latest, rand));
  steps.push(...lineSteps(linesOf(course, node.covers), 3, rand));
  steps.push({ kind: 'done' });
  return steps;
}

export function unitTestPassed(correct: number, total: number): boolean {
  return total > 0 && correct / total >= UNIT_TEST_PASS;
}
