import type { Course } from '@linguasea/contract';

export type Access = 'open' | 'premium' | 'locked';

/** Lessons in course order. */
export function lessonOrder(course: Course): string[] {
  return course.stages.flatMap((s) => s.units.flatMap((u) => u.lessons));
}

export function stageOf(course: Course, lessonId: string) {
  return course.stages.find((s) => s.units.some((u) => u.lessons.includes(lessonId)));
}

/**
 * Whether a learner may open a lesson: paid stages need the subscription ("premium"),
 * and lessons open one after another ("locked" until the previous one is done).
 */
export function lessonAccess(
  course: Course,
  lessonId: string,
  completed: Record<string, unknown>,
  premium: boolean,
): Access {
  const stage = stageOf(course, lessonId);
  if (!stage) return 'locked';
  if (!stage.free && !premium) return 'premium';
  const order = lessonOrder(course);
  const i = order.indexOf(lessonId);
  if (i > 0 && !(order[i - 1] in completed)) return 'locked';
  return 'open';
}

/** Lesson ids of one stage, in order. */
export function stageLessons(course: Course, stageId: string): string[] {
  return course.stages.find((s) => s.id === stageId)?.units.flatMap((u) => u.lessons) ?? [];
}
