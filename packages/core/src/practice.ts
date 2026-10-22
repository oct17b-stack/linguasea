import { kindGroup, type ChoiceExercise, type CourseBundle } from '@linguasea/contract';

import { coursePath } from './path';
import { coursePool, type Word } from './pool';
import { seededRandom, shuffle } from './rng';
import { chooseStep, type DialogueLine, type Step } from './steps';

/** Share of a unit test to get right to pass it. */
export const UNIT_TEST_PASS = 0.7;

const ROTATION: ChoiceExercise['type'][] = ['listen-choose', 'choose-text', 'choose-meaning'];

/** Words get a rotating question type; sounds (kana, tones…) are always asked by ear. */
function questionFor(pool: Map<string, Word>, w: Word, i: number, upTo: number, rand: () => number): Step {
  const type = kindGroup(w.kind) === 'sound' ? 'listen-text' : ROTATION[i % ROTATION.length];
  return chooseStep(pool, w, { type }, upTo, rand);
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
  const distinct = [...new Map(lines.filter((l) => l.meaning).map((l) => [l.meaning, l])).values()];
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
  const latest = Math.max(0, ...fresh.map((w) => w.order));
  const earlier = shuffle([...pool.values()].filter((w) => w.order < Math.min(...fresh.map((f) => f.order))), rand).slice(0, 4);
  const words = shuffle([...fresh, ...earlier], rand);
  const steps: Step[] = words.map((w, i) => questionFor(pool, w, i, latest, rand));
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
  const latest = Math.max(0, ...words.map((w) => w.order));
  const steps: Step[] = words.map((w, i) => questionFor(pool, w, i, latest, rand));
  steps.push(...lineSteps(linesOf(course, node.covers), 3, rand));
  steps.push({ kind: 'done' });
  return steps;
}

export function unitTestPassed(correct: number, total: number): boolean {
  return total > 0 && correct / total >= UNIT_TEST_PASS;
}
