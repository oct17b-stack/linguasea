import { kindGroup, lessonExercises, type ChoiceExercise, type CourseBundle } from '@linguasea/contract';

import { coursePool, soundsAlike, type Word } from './pool';
import { hashString, seededRandom, shuffle } from './rng';

export type Choice = { id: string; label: string; correct: boolean };

export type DialogueLine = { speaker: string; text: string; reading: string; meaning: string };

export type Step =
  | { kind: 'intro'; title: string; intro: string; minutes: number }
  | { kind: 'learn'; word: Word }
  | { kind: 'dialogue'; lines: DialogueLine[] }
  | { kind: 'note'; title: string; body: string }
  /** A reader's text: paragraphs of sentences with reading and translation. */
  | { kind: 'read'; title: string; paragraphs: { text: string; reading: string; meaning: string }[][] }
  /** Comprehension question about a reader, in the learner's language. */
  | { kind: 'question'; prompt: string; choices: Choice[] }
  /** Hear a whole sentence from a dialogue, pick what it means. */
  | { kind: 'line'; line: DialogueLine; choices: Choice[] }
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
  if (lesson.kind === 'reader') {
    // Read first, then the glossary words, then comprehension, then the usual word questions.
    steps.push({
      kind: 'read',
      title: gloss.title,
      paragraphs: lesson.passage.map((para, p) =>
        para.map((sentence, i) => ({ ...sentence, meaning: gloss.passage[p]?.[i] ?? '' })),
      ),
    });
  }
  for (const item of lesson.items) steps.push({ kind: 'learn', word: word(item.id) });
  lesson.questions.forEach((q, i) => {
    const g = gloss.questions[i];
    if (!g) return;
    // Shuffled: writers tend to put the right answer early, and learners would pick up on it.
    const choices = g.options.map((label, k) => ({ id: `q${i}-${k}`, label, correct: k === q.answer }));
    steps.push({ kind: 'question', prompt: g.prompt, choices: shuffle(choices, rand) });
  });
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

// Each pool's items split by question group (vocabulary vs sounds), in course order.
const groups = new WeakMap<ReadonlyMap<string, Word>, Map<string, Word[]>>();

function groupOf(pool: ReadonlyMap<string, Word>, w: Word): Word[] {
  let byGroup = groups.get(pool);
  if (!byGroup) {
    byGroup = new Map();
    for (const x of [...pool.values()].sort((a, b) => a.order - b.order)) {
      const list = byGroup.get(kindGroup(x.kind)) ?? [];
      list.push(x);
      byGroup.set(kindGroup(x.kind), list);
    }
    groups.set(pool, byGroup);
  }
  return byGroup.get(kindGroup(w.kind)) ?? [];
}

/** How many items of `list` (in course order) are taught up to `upTo`. */
function countUpTo(list: Word[], upTo: number): number {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].order <= upTo) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * A multiple-choice question. Wrong answers are the exercise's own options when given;
 * otherwise items of the same group, preferring ones already taught (up to `upTo` in course order).
 */
export function chooseStep(
  pool: ReadonlyMap<string, Word>,
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
    // Heard-only questions must not offer an answer that sounds the same as the right one,
    // and "which word means …?" must not offer another word with the same meaning.
    const byEar = ex.type === 'listen-choose' || ex.type === 'listen-text';
    const byMeaning = ex.type === 'choose-text';
    const fits = (x: Word) =>
      x.id !== w.id &&
      label(x) !== label(w) &&
      !(byEar && soundsAlike(x, w)) &&
      !(byMeaning && x.meaning === w.meaning);
    // Same-group items in course order: the ones taught up to `upTo` come first. A course has
    // thousands of items, so pick at random from each part instead of shuffling all of them.
    const group = groupOf(pool, w);
    const known = countUpTo(group, upTo);
    wrong = [];
    const labels = new Set([label(w)]);
    for (const [from, to] of [[0, known], [known, group.length]]) {
      const tried = new Set<number>();
      while (wrong.length < CHOICES - 1 && tried.size < to - from) {
        const i = from + Math.floor(rand() * (to - from));
        if (tried.has(i)) continue;
        tried.add(i);
        const x = group[i];
        if (!fits(x) || labels.has(label(x))) continue;
        labels.add(label(x));
        wrong.push(x);
      }
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
 * How to ask about an item away from its lesson (review, practice, tests).
 * Vocabulary rotates through question types. Sounds (kana, tones, hangul…) are asked the way their
 * lesson asked them: by ear with the lesson's own wrong answers when it had them, and only by sight
 * when the lesson never asked them by ear (e.g. ㅐ/ㅔ, which sound alike but look different).
 */
export function recallQuestion(course: CourseBundle, w: Word, i: number): Pick<ChoiceExercise, 'type' | 'options'> {
  if (kindGroup(w.kind) === 'vocab') return { type: REVIEW_TYPES[i % REVIEW_TYPES.length] };
  const entry = course.lessons[w.lesson];
  const asked = entry
    ? lessonExercises(entry.lesson).filter((e): e is ChoiceExercise => e.item === w.id && e.type !== 'speak')
    : [];
  const byEar = asked.find((e) => e.type === 'listen-text');
  if (byEar) return { type: 'listen-text', options: byEar.options };
  const bySight = asked.find((e) => e.type === 'choose-meaning');
  if (bySight) return { type: 'choose-meaning', options: bySight.options };
  return { type: 'listen-text' };
}

/** One question per due item, asked as recallQuestion decides. */
export function reviewSteps(course: CourseBundle, itemIds: string[], seed = Date.now()): Step[] {
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const latest = Math.max(0, ...itemIds.map((id) => pool.get(id)?.order ?? 0));
  const steps: Step[] = [];
  itemIds.forEach((id, i) => {
    const w = pool.get(id);
    if (!w) return;
    steps.push(chooseStep(pool, w, recallQuestion(course, w, i), latest, rand));
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
export function placementSteps(course: CourseBundle, stageId: string, count = 16, seed = Date.now()): Step[] {
  const rand = seededRandom(seed);
  const pool = coursePool(course);
  const stage = course.course.stages.find((s) => s.id === stageId);
  if (!stage) return [];
  // Round-robin over the units (in random order, so that with more units than questions
  // every unit can come up) so the whole stage is asked about, not just its first units.
  const perUnit = shuffle(
    stage.units.map((u) =>
      shuffle(
        [...pool.values()].filter((w) => u.lessons.includes(w.lesson) && (w.kind === 'word' || w.kind === 'phrase')),
        rand,
      ),
    ),
    rand,
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
