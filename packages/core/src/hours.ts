import type { CourseBundle } from '@linguasea/contract';

import { coursePath } from './path';

/**
 * How study time is estimated (docs/CONTENT.md §6). Lessons and readers count their own `minutes`;
 * generated activities count fixed times; spaced review adds a share on top.
 */
export const STUDY_MINUTES = {
  practice: 10,
  unitTest: 12,
  /** One AI tutor role-play per unit (Premium; needs the AI tutor switched on). */
  tutor: 10,
  /** Spaced repetition review, as a share of lessons + readers + practice. */
  reviewShare: 0.15,
} as const;

export type StageHours = {
  stage: string;
  lessons: number;
  readers: number;
  practice: number;
  tests: number;
  units: number;
  /** Minutes by activity. */
  minutes: { lessons: number; readers: number; practice: number; tests: number; tutor: number; review: number };
  hours: number;
};

export function estimateHours(course: CourseBundle): { stages: StageHours[]; hours: number } {
  const path = coursePath(course.course);
  const stages = course.course.stages.map((stage): StageHours => {
    const nodes = path.filter((n) => n.stage === stage.id);
    const count = (type: string) => nodes.filter((n) => n.type === type).length;
    const minutesOf = (type: string) =>
      nodes.filter((n) => n.type === type).reduce((sum, n) => sum + (course.lessons[n.id]?.lesson.minutes ?? 0), 0);
    const m = {
      lessons: minutesOf('lesson'),
      readers: minutesOf('reader'),
      practice: count('practice') * STUDY_MINUTES.practice,
      tests: count('test') * STUDY_MINUTES.unitTest,
      tutor: stage.units.length * STUDY_MINUTES.tutor,
      review: 0,
    };
    m.review = Math.round((m.lessons + m.readers + m.practice) * STUDY_MINUTES.reviewShare);
    const total = m.lessons + m.readers + m.practice + m.tests + m.tutor + m.review;
    return {
      stage: stage.id,
      lessons: count('lesson'),
      readers: count('reader'),
      practice: count('practice'),
      tests: count('test'),
      units: stage.units.length,
      minutes: m,
      hours: Math.round((total / 60) * 10) / 10,
    };
  });
  return { stages, hours: Math.round(stages.reduce((s, x) => s + x.hours, 0) * 10) / 10 };
}
