import type { Course, CourseGloss, L1, Lesson, LessonGloss, Target, Ui } from './schema';

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
};
