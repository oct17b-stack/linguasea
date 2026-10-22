import type { Course, Stage } from '@linguasea/contract';

import { lessonAccess, stageOf, type Access } from './access';

/**
 * Everything on the course map, in order. Lessons and readers come from course.json; a practice
 * session follows every second lesson of a unit and a unit test closes each unit. Practice and tests
 * are generated from what was taught, so they need no content of their own.
 */
export type PathNode =
  | { type: 'lesson' | 'reader'; id: string; unitId: string; stage: Stage }
  | { type: 'practice' | 'test'; id: string; unitId: string; stage: Stage; covers: string[] };

/** A practice session after this many lessons. */
export const PRACTICE_EVERY = 2;

export const practiceId = (unitId: string, n: number) => `${unitId}-p${n}`;
export const unitTestId = (unitId: string) => `${unitId}-test`;

export function coursePath(course: Course): PathNode[] {
  const out: PathNode[] = [];
  for (const stage of course.stages) {
    for (const unit of stage.units) {
      let pending: string[] = [];
      let n = 0;
      for (const id of unit.lessons) {
        out.push({ type: /-r\d{2}$/.test(id) ? 'reader' : 'lesson', id, unitId: unit.id, stage: stage.id });
        pending.push(id);
        if (pending.length === PRACTICE_EVERY) {
          out.push({ type: 'practice', id: practiceId(unit.id, ++n), unitId: unit.id, stage: stage.id, covers: pending });
          pending = [];
        }
      }
      out.push({ type: 'test', id: unitTestId(unit.id), unitId: unit.id, stage: stage.id, covers: [...unit.lessons] });
    }
  }
  return out;
}

/**
 * Lessons and readers open one after another; practice and tests open once everything they
 * cover is done (they never block the next lesson). Paid stages need the subscription.
 */
export function nodeAccess(course: Course, node: PathNode, completed: Record<string, unknown>, premium: boolean): Access {
  if (!('covers' in node)) return lessonAccess(course, node.id, completed, premium);
  const stage = stageOf(course, node.covers[0]);
  if (stage && !stage.free && !premium) return 'premium';
  return node.covers.every((id) => id in completed) ? 'open' : 'locked';
}
