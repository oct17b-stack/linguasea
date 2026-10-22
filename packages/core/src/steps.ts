import type { CourseBundle, Exercise } from '@linguasea/contract';

import { coursePool, type Word } from './pool';
import { hashString, seededRandom, shuffle } from './rng';

export type Choice = { id: string; label: string; correct: boolean };

export type Step =
  | { kind: 'intro'; title: string; intro: string; minutes: number }
  | { kind: 'learn'; word: Word }
  | { kind: 'dialogue'; lines: { speaker: string; text: string; reading: string; meaning: string }[] }
  | { kind: 'note'; title: string; body: string }
  | {
      kind: 'choose';
      exercise: Exercise['type'];
      word: Word;
      /** What the question shows; empty when it is audio-only. */
      prompt: string;
      choices: Choice[];
    }
  | { kind: 'speak'; word: Word }
  | { kind: 'done' };

const CHOICES = 4;

/**
 * Turns a lesson into the screens the learner goes through:
 * intro → learn each word → dialogue → notes → exercises → done.
 * Wrong answers are drawn from the whole course so early lessons still get 4 choices.
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

  for (const ex of lesson.exercises) {
    const w = word(ex.item);
    steps.push(ex.type === 'speak' ? { kind: 'speak', word: w } : chooseStep(pool, w, ex.type, rand));
  }
  steps.push({ kind: 'done' });
  return steps;
}

type ChoiceType = Exclude<Exercise['type'], 'speak'>;

function chooseStep(pool: Map<string, Word>, w: Word, type: ChoiceType, rand: () => number): Step {
  const byText = type === 'choose-text';
  const label = (x: Word) => (byText ? x.text : x.meaning);
  const others = shuffle(
    [...pool.values()].filter((x) => x.id !== w.id && label(x) !== label(w)),
    rand,
  ).slice(0, CHOICES - 1);
  const choices = shuffle(
    [w, ...others].map((x) => ({ id: x.id, label: label(x), correct: x.id === w.id })),
    rand,
  );
  const prompt = type === 'choose-meaning' ? w.text : type === 'choose-text' ? w.meaning : '';
  return { kind: 'choose', exercise: type, word: w, prompt, choices };
}

const REVIEW_TYPES: ChoiceType[] = ['listen-choose', 'choose-meaning', 'choose-text'];

/** One question per due item, rotating question types so review is not always the same drill. */
export function reviewSteps(course: CourseBundle, itemIds: string[], seed = Date.now()): Step[] {
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const steps: Step[] = [];
  itemIds.forEach((id, i) => {
    const w = pool.get(id);
    if (w) steps.push(chooseStep(pool, w, REVIEW_TYPES[i % REVIEW_TYPES.length], rand));
  });
  return steps;
}
