import type { Course, CourseGloss, L1, Lesson, LessonGloss, Stage, Target, Ui } from './schema';

/** What the app ships with (later: what it downloads per L1 from the CDN). */
export type Bundle = {
  version: string;
  l1s: Partial<Record<L1, L1Bundle>>;
};

export type L1Bundle = {
  l1: L1;
  name: string;
  ui: Ui;
  courses: Partial<Record<Target, CourseBundle>>;
};

export type CourseBundle = {
  course: Course;
  gloss: CourseGloss;
  lessons: Record<string, { lesson: Lesson; gloss: LessonGloss }>;
  /**
   * Generated speech clips: audioKey(...) → path under the server's /audio/ (e.g. "zh/3f2a9c1e.mp3").
   * Missing keys fall back to the device's TTS.
   */
  audio?: Record<string, string>;
};

/**
 * What the app reads at startup (app/src/content/generated/index.json): per L1 its name, interface
 * strings and an outline of each course, without lessons. A course's lessons live in their own file,
 * `<courseKey>.json`, loaded when the learner picks that course.
 */
export type BundleIndex = {
  version: string;
  l1s: Partial<Record<L1, L1Index>>;
};

export type L1Index = {
  l1: L1;
  name: string;
  ui: Ui;
  courses: Partial<Record<Target, CourseIndex>>;
};

export type CourseIndex = {
  target: Target;
  /** The course's name in this L1, e.g. "ภาษาจีน". */
  name: string;
  /** TTS locale, e.g. "zh-CN". */
  voice: string;
  /** Romanization shown under the text, e.g. "pinyin". */
  reading: string;
  stages: { id: Stage; title?: string; cefr: string; exam?: string; free: boolean; units: number; lessons: number }[];
  /** Lessons and readers in the whole course. */
  lessons: number;
};

/** File name (without .json) and loader key of one course for one L1, e.g. "th-zh". */
export function courseKey(l1: L1, target: Target): string {
  return `${l1}-${target}`;
}

/** Who speaks a clip: "item" for words and phrases, otherwise the dialogue speaker ("a", "b"). */
export type AudioVoice = 'item' | string;

export function audioKey(voice: AudioVoice, text: string): string {
  return `${voice}|${text}`;
}
