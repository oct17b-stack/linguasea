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

const lessonId = z.string().regex(/^(zh|en|ja|ko)-[A-F]\d-\d{2}$/, 'lesson id looks like zh-A1-01');
/** Item ids are stable forever: review cards and progress are keyed by them. */
const itemId = z.string().regex(/^(zh|en|ja|ko)\.[a-z0-9-]+$/, 'item id looks like zh.ni-hao');

// ---------- target-language layer: content/courses/<target>/ ----------

export const Unit = z.object({
  id: z.string().regex(/^(zh|en|ja|ko)-[A-F]\d$/),
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

export const Item = z.object({
  id: itemId,
  text: z.string().min(1),
  /** Pinyin / romaji / romanization / IPA. */
  reading: z.string().min(1),
  audio: z.string().optional(),
});
export type Item = z.infer<typeof Item>;

export const Line = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
  reading: z.string().min(1),
});

export const Exercise = z.discriminatedUnion('type', [
  z.object({ type: z.literal('choose-meaning'), item: itemId }),
  z.object({ type: z.literal('listen-choose'), item: itemId }),
  z.object({ type: z.literal('choose-text'), item: itemId }),
  z.object({ type: z.literal('speak'), item: itemId }),
]);
export type Exercise = z.infer<typeof Exercise>;

export const Lesson = z.object({
  id: lessonId,
  target: Target,
  stage: Stage,
  minutes: z.number().int().min(1).max(30),
  items: z.array(Item).min(1),
  dialogue: z.array(Line).default([]),
  exercises: z.array(Exercise).min(1),
});
export type Lesson = z.infer<typeof Lesson>;

// ---------- native-language layer: content/l1/<l1>/ ----------

export const ItemGloss = z.object({
  meaning: z.string().min(1),
  /** How the item sounds written in the learner's script (e.g. Thai คำอ่าน). Faded out in later stages. */
  translit: z.string().optional(),
});

export const Note = z.object({ title: z.string().min(1), body: z.string().min(1) });

export const LessonGloss = z.object({
  lesson: lessonId,
  title: z.string().min(1),
  intro: z.string().min(1),
  items: z.record(itemId, ItemGloss),
  /** One translation per dialogue line, same order. */
  dialogue: z.array(z.string().min(1)).default([]),
  notes: z.array(Note).default([]),
});
export type LessonGloss = z.infer<typeof LessonGloss>;

export const CourseGloss = z.object({
  target: Target,
  name: z.string().min(1),
  stages: z.partialRecord(Stage, z.object({ title: z.string().min(1) })),
  units: z.record(z.string(), z.object({ title: z.string().min(1) })),
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
