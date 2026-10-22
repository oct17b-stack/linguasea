import { lessonExercises, type ChoiceExercise, type CourseBundle } from '@linguasea/contract';

import { coursePool, sameGroup, soundsAlike, type Word } from './pool';
import { hashString, seededRandom, shuffle } from './rng';

export type Choice = { id: string; label: string; correct: boolean };

export type Step =
  | { kind: 'intro'; title: string; intro: string; minutes: number }
  | { kind: 'learn'; word: Word }
  | { kind: 'dialogue'; lines: { speaker: string; text: string; reading: string; meaning: string }[] }
  | { kind: 'note'; title: string; body: string }
  | {
      kind: 'choose';
      exercise: ChoiceExercise['type'];
      word: Word;
      /** What the question shows; empty when it is audio-only. */
      prompt: string;
      choices: Choice[];
    }
  | { kind: 'speak'; word: Word }
  | { kind: 'done' };

const CHOICES = 4;

/** Questions whose answers are target-language text rather than meanings. */
export function answersWithText(type: ChoiceExercise['type']): boolean {
  return type === 'choose-text' || type === 'listen-text';
}

/**
 * Turns a lesson into the screens the learner goes through:
 * intro → learn each word → dialogue → notes → exercises → done.
 */
export function buildSteps(course: CourseBundle, lessonId: string, seed = hashString(lessonId)): Step[] {
  const entry = course.lessons[lessonId];
  if (!entry) throw new Error(`unknown lesson ${lessonId}`);
  const { lesson, gloss } = entry;
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const word = (id: string): Word => {
    const w = pool.get(id);
    if (!w) throw new Error(`no gloss for ${id}`);
    return w;
  };

  const steps: Step[] = [{ kind: 'intro', title: gloss.title, intro: gloss.intro, minutes: lesson.minutes }];
  for (const item of lesson.items) steps.push({ kind: 'learn', word: word(item.id) });
  if (lesson.dialogue.length) {
    steps.push({
      kind: 'dialogue',
      lines: lesson.dialogue.map((l, i) => ({ ...l, meaning: gloss.dialogue[i] ?? '' })),
    });
  }
  for (const note of gloss.notes) steps.push({ kind: 'note', ...note });

  const order = word(lesson.items[0].id).order;
  for (const ex of lessonExercises(lesson)) {
    const w = word(ex.item);
    steps.push(ex.type === 'speak' ? { kind: 'speak', word: w } : chooseStep(pool, w, ex, order, rand));
  }
  steps.push({ kind: 'done' });
  return steps;
}

/**
 * A multiple-choice question. Wrong answers are the exercise's own options when given;
 * otherwise items of the same group, preferring ones already taught (up to `upTo` in course order).
 */
function chooseStep(
  pool: Map<string, Word>,
  w: Word,
  ex: Pick<ChoiceExercise, 'type' | 'options'>,
  upTo: number,
  rand: () => number,
): Step {
  const byText = answersWithText(ex.type);
  const label = (x: Word) => (byText ? x.text : x.meaning);
  let wrong: Word[];
  if (ex.options) {
    wrong = ex.options.map((id) => pool.get(id)).filter((x): x is Word => !!x);
  } else {
    // Heard-only questions must not offer an answer that sounds the same as the right one.
    const byEar = ex.type === 'listen-choose' || ex.type === 'listen-text';
    const candidates = [...pool.values()].filter(
      (x) => x.id !== w.id && sameGroup(x, w) && label(x) !== label(w) && !(byEar && soundsAlike(x, w)),
    );
    const known = shuffle(candidates.filter((x) => x.order <= upTo), rand);
    const later = shuffle(candidates.filter((x) => x.order > upTo), rand);
    wrong = [];
    const labels = new Set([label(w)]);
    for (const x of [...known, ...later]) {
      if (wrong.length === CHOICES - 1) break;
      if (labels.has(label(x))) continue;
      labels.add(label(x));
      wrong.push(x);
    }
  }
  const choices = shuffle(
    [w, ...wrong].map((x) => ({ id: x.id, label: label(x), correct: x.id === w.id })),
    rand,
  );
  const prompt = ex.type === 'choose-meaning' ? w.text : ex.type === 'choose-text' ? w.meaning : '';
  return { kind: 'choose', exercise: ex.type, word: w, prompt, choices };
}

const REVIEW_TYPES: ChoiceExercise['type'][] = ['listen-choose', 'choose-meaning', 'choose-text'];

/**
 * One question per due item, rotating question types so review is not always the same drill.
 * Sound items (kana, tones…) are reviewed by ear → text, the way they were learned.
 */
export function reviewSteps(course: CourseBundle, itemIds: string[], seed = Date.now()): Step[] {
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const latest = Math.max(0, ...itemIds.map((id) => pool.get(id)?.order ?? 0));
  const steps: Step[] = [];
  itemIds.forEach((id, i) => {
    const w = pool.get(id);
    if (!w) return;
    const type = w.kind === 'letter' || w.kind === 'syllable' ? 'listen-text' : REVIEW_TYPES[i % REVIEW_TYPES.length];
    steps.push(chooseStep(pool, w, { type }, latest, rand));
  });
  return steps;
}

/** Share of placement questions to get right to skip a stage. */
export const PLACEMENT_PASS = 0.8;

const PLACEMENT_TYPES: ChoiceExercise['type'][] = ['choose-meaning', 'listen-choose', 'choose-text'];

/**
 * A short quiz on the vocabulary a stage teaches, spread over its units.
 * Passing it (see placementPassed) lets someone who already knows the basics skip the stage.
 */
export function placementSteps(course: CourseBundle, stageId: string, count = 12, seed = Date.now()): Step[] {
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const stage = course.course.stages.find((s) => s.id === stageId);
  if (!stage) return [];
  // Round-robin over units so every topic of the stage is asked about.
  const perUnit = stage.units.map((u) =>
    shuffle(
      [...pool.values()].filter((w) => u.lessons.includes(w.lesson) && (w.kind === 'word' || w.kind === 'phrase')),
      rand,
    ),
  );
  const picked: Word[] = [];
  for (let round = 0; picked.length < count && perUnit.some((list) => list.length > round); round++) {
    for (const list of perUnit) if (list[round] && picked.length < count) picked.push(list[round]);
  }
  const latest = Math.max(0, ...picked.map((w) => w.order));
  return picked.map((w, i) => chooseStep(pool, w, { type: PLACEMENT_TYPES[i % PLACEMENT_TYPES.length] }, latest, rand));
}

export function placementPassed(correct: number, total: number): boolean {
  return total > 0 && correct / total >= PLACEMENT_PASS;
}
