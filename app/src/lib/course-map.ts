import type { Course, CourseBundle, Stage } from '@linguasea/contract';
import { coursePath, nodeAccess, type Access, type PathNode } from '@linguasea/core';

/**
 * The course map as the home screen lists it: stages → units → path nodes (lessons, readers,
 * practice sessions, unit tests), built once per course.
 */
export type UnitRow = {
  unitId: string;
  stage: Stage;
  nodes: PathNode[];
  /** Lessons and readers of the unit (what its progress counts). */
  lessons: string[];
};

export type StageRow = { stage: Course['stages'][number]; units: UnitRow[]; lessons: string[] };

type Built = { path: PathNode[]; stages: StageRow[]; byId: Map<string, PathNode> };

const cache = new WeakMap<Course, Built>();

export function courseMap(course: Course): Built {
  let built = cache.get(course);
  if (built) return built;
  const path = coursePath(course);
  const stages = course.stages.map((stage): StageRow => {
    const units = stage.units.map(
      (unit): UnitRow => ({
        unitId: unit.id,
        stage: stage.id,
        nodes: path.filter((n) => n.unitId === unit.id),
        lessons: [...unit.lessons],
      }),
    );
    return { stage, units, lessons: units.flatMap((u) => u.lessons) };
  });
  built = { path, stages, byId: new Map(path.map((n) => [n.id, n])) };
  cache.set(course, built);
  return built;
}

export function pathNode(course: Course, id: string): PathNode | undefined {
  return courseMap(course).byId.get(id);
}

/** Where the learner is: the stage of the first unfinished lesson (the last stage once all are done). */
export function currentStage(course: Course, completed: Record<string, unknown>): Stage {
  const { stages } = courseMap(course);
  return (stages.find((s) => s.lessons.some((id) => !(id in completed))) ?? stages[stages.length - 1]).stage.id;
}

/**
 * Where "continue" goes: the first unfinished lesson or reader. Practice sessions and unit tests stay
 * on the map next to it; they never block the way forward.
 */
export function nextLesson(course: Course, completed: Record<string, unknown>): PathNode | undefined {
  return courseMap(course).path.find((n) => (n.type === 'lesson' || n.type === 'reader') && !(n.id in completed));
}

/** "zh-C1-p2" → 2. */
export function practiceNumber(id: string): number {
  return Number(/-p(\d+)$/.exec(id)?.[1] ?? 0);
}

export type NodeKind = PathNode['type'];

/** How a node is shown (icons are distinct per kind; state is shown separately). */
export const NODE_ICON: Record<NodeKind, string> = { lesson: '▶️', reader: '📖', practice: '🔁', test: '📝' };

export function nodeTitle(
  course: CourseBundle,
  node: PathNode,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (node.type === 'practice') return t('path.practice', { n: practiceNumber(node.id) });
  if (node.type === 'test') return t('path.test');
  return course.lessons[node.id]?.gloss.title ?? node.id;
}

export type NodeState = 'done' | Access;

export function nodeState(course: Course, node: PathNode, completed: Record<string, unknown>, premium: boolean): NodeState {
  return node.id in completed ? 'done' : nodeAccess(course, node, completed, premium);
}
