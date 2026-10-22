import type { CourseBundle, Item } from '@linguasea/contract';

/** An item joined with its explanation in the learner's language. */
export type Word = Item & { meaning: string; translit?: string; lesson: string };

/** Every item in the course, first occurrence wins (ids mean the same thing everywhere). */
export function coursePool(course: CourseBundle): Map<string, Word> {
  const pool = new Map<string, Word>();
  for (const stage of course.course.stages) {
    for (const unit of stage.units) {
      for (const id of unit.lessons) {
        const entry = course.lessons[id];
        if (!entry) continue;
        for (const item of entry.lesson.items) {
          const g = entry.gloss.items[item.id];
          if (!pool.has(item.id) && g) pool.set(item.id, { ...item, ...g, lesson: id });
        }
      }
    }
  }
  return pool;
}
