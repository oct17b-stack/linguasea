import { z } from 'zod';

/** Languages people learn. Content in this layer is shared by every country. */
export const TARGETS = ['zh', 'en', 'ja', 'ko'] as const;
export const Target = z.enum(TARGETS);
export type Target = z.infer<typeof Target>;

/** Learners' native languages (explanations, translations, UI). Add one here to open a new country. */
export const L1S = ['th', 'vi', 'id', 'ms', 'fil', 'km', 'lo', 'my'] as const;
export const L1 = z.enum(L1S);
export type L1 = z.infer<typeof L1>;

export const STAGES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const Stage = z.enum(STAGES);
export type Stage = z.infer<typeof Stage>;

export const Cefr = z.enum(['pre-A1', 'A1', 'A2', 'B1', 'B2']);

/** zh-A1-01 is a lesson, zh-C1-r01 a graded reader (story / short text) in that unit. */
const lessonId = z.string().regex(/^(zh|en|ja|ko)-[A-F]\d{1,2}-r?\d{2}$/, 'lesson id looks like zh-A1-01 (reader: zh-C1-r01)');
/** Item ids are stable forever: review cards and progress are keyed by them. */
const itemId = z.string().regex(/^(zh|en|ja|ko)\.[a-z0-9-]+$/, 'item id looks like zh.ni-hao');

// ---------- target-language layer: content/courses/<target>/ ----------

export const Unit = z.object({
  /** zh-A1 … zh-A16: stage letter + unit number. */
  id: z.string().regex(/^(zh|en|ja|ko)-[A-F]\d{1,2}$/),
  lessons: z.array(lessonId).min(1),
});

export const StageDef = z.object({
  id: Stage,
  cefr: Cefr,
  /** Exam level this stage lines up with, e.g. "HSK 1", "JLPT N5". */
  exam: z.string().optional(),
  /** Stage A is free; later stages need the subscription. */
  free: z.boolean().default(false),
  units: z.array(Unit),
});

export const Course = z.object({
  target: Target,
  /** BCP-47 voice locale used for TTS, e.g. "zh-CN". */
  voice: z.string(),
  /** Name of the romanization system shown under the text, e.g. "pinyin". */
  reading: z.string(),
  stages: z.array(StageDef).min(1),
});
export type Course = z.infer<typeof Course>;

/**
 * word / phrase: vocabulary, questions ask what it means.
 * letter / syllable: script and sound drills (kana, hangul, pinyin, phonics), questions ask how it sounds.
 * Wrong answers are only drawn from the same group, so a word is never offered as the answer to a sound.
 */
export const ITEM_KINDS = ['word', 'phrase', 'letter', 'syllable'] as const;
export const ItemKind = z.enum(ITEM_KINDS);
export type ItemKind = z.infer<typeof ItemKind>;

export function kindGroup(kind: ItemKind): 'vocab' | 'sound' {
  return kind === 'letter' || kind === 'syllable' ? 'sound' : 'vocab';
}

export const Item = z.object({
  id: itemId,
  kind: ItemKind.default('word'),
  text: z.string().min(1),
  /** Pinyin / romaji / romanization / IPA. */
  reading: z.string().min(1),
  /** What TTS reads when `text` cannot be read aloud as written: pinyin "mā" → "妈", ㄱ → "가". */
  say: z.string().min(1).optional(),
  /** A recorded clip that overrides generated TTS (path under content/audio). */
  audio: z.string().optional(),
});
export type Item = z.infer<typeof Item>;

export const Line = z.object({
  /** "a" = the learner's side (Nam), "b" = a man, "c" = a woman (decides the voice). */
  speaker: z.string().min(1),
  text: z.string().min(1),
  reading: z.string().min(1),
});

/** A sentence of a graded reader. */
export const Sentence = z.object({ text: z.string().min(1), reading: z.string().min(1) });

/** Comprehension question of a reader: the right option's position; wording lives in each L1 layer. */
export const Question = z.object({ answer: z.number().int().min(0).max(3) });

const choice = {
  item: itemId,
  /**
   * Exact wrong answers (item ids from the same course), e.g. the other tones of a syllable or a
   * minimal pair. Without it, wrong answers are picked from the course automatically.
   */
  options: z.array(itemId).min(1).max(3).optional(),
};

export const Exercise = z.discriminatedUnion('type', [
  /** See the text (and hear it), pick the meaning / the sound. */
  z.object({ type: z.literal('choose-meaning'), ...choice }),
  /** Only hear it, pick the meaning. */
  z.object({ type: z.literal('listen-choose'), ...choice }),
  /** See the meaning, pick the text. */
  z.object({ type: z.literal('choose-text'), ...choice }),
  /** Only hear it, pick the text (tones, kana, minimal pairs). */
  z.object({ type: z.literal('listen-text'), ...choice }),
  /** Listen and say it; scored when pronunciation assessment is available. */
  z.object({ type: z.literal('speak'), item: itemId }),
]);
export type Exercise = z.infer<typeof Exercise>;
export type ChoiceExercise = Exclude<Exercise, { type: 'speak' }>;

export const Lesson = z.object({
  id: lessonId,
  /** "reader": a story or short text with comprehension questions; its items are the glossary. */
  kind: z.enum(['lesson', 'reader']).default('lesson'),
  target: Target,
  stage: Stage,
  minutes: z.number().int().min(1).max(30),
  items: z.array(Item).min(1),
  dialogue: z.array(Line).default([]),
  /** Readers only: paragraphs of sentences. */
  passage: z.array(z.array(Sentence).min(1)).default([]),
  /** Readers only. */
  questions: z.array(Question).default([]),
  /** Leave empty to get the standard set (see lessonExercises). */
  exercises: z.array(Exercise).default([]),
});
export type Lesson = z.infer<typeof Lesson>;

// ---------- native-language layer: content/l1/<l1>/ ----------

export const ItemGloss = z.object({
  meaning: z.string().min(1),
  /** How the item sounds written in the learner's script (e.g. Thai คำอ่าน). Faded out in later stages. */
  translit: z.string().optional(),
});

export const Note = z.object({ title: z.string().min(1), body: z.string().min(1) });

export const QuestionGloss = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
});

export const LessonGloss = z.object({
  lesson: lessonId,
  title: z.string().min(1),
  intro: z.string().min(1),
  items: z.record(itemId, ItemGloss),
  /** One translation per dialogue line, same order. */
  dialogue: z.array(z.string().min(1)).default([]),
  notes: z.array(Note).default([]),
  /** Readers: one translation per sentence, same paragraph shape as the passage. */
  passage: z.array(z.array(z.string().min(1))).default([]),
  /** Readers: question and options in this language, same order as the lesson's questions. */
  questions: z.array(QuestionGloss).default([]),
});
export type LessonGloss = z.infer<typeof LessonGloss>;

export const CourseGloss = z.object({
  target: Target,
  name: z.string().min(1),
  stages: z.partialRecord(
    Stage,
    z.object({ title: z.string().min(1), description: z.string().min(1).optional() }),
  ),
  /** `goal` is the can-do statement shown on the course map ("ทักทายและขอบคุณได้"). */
  units: z.record(z.string(), z.object({ title: z.string().min(1), goal: z.string().min(1).optional() })),
});
export type CourseGloss = z.infer<typeof CourseGloss>;

/** Interface strings. Keys are fixed by the app; every L1 must provide all of them. */
export const Ui = z.record(z.string(), z.string().min(1));
export type Ui = z.infer<typeof Ui>;

export const L1Meta = z.object({
  l1: L1,
  /** Name of the language in itself, e.g. "ไทย". */
  name: z.string().min(1),
  /** Targets whose explanation layer is complete enough to ship for this L1. */
  released: z.array(Target),
});
export type L1Meta = z.infer<typeof L1Meta>;
