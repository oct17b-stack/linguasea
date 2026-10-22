import { courseKey, type BundleIndex, type CourseBundle, type CourseIndex, type L1, type L1Index, type Target } from '@linguasea/contract';

import { courseLoaders } from './generated/courses';
// Written by `npm run content` (packages/contract). Only this small index is read at startup;
// a course's lessons are parsed when it is chosen. Later: downloaded per L1 from the CDN.
import rawIndex from './generated/index.json';

export const contentIndex = rawIndex as unknown as BundleIndex;

export function l1Index(l1: L1): L1Index {
  const b = contentIndex.l1s[l1];
  if (!b) throw new Error(`no content for ${l1}`);
  return b;
}

/** Outline of a course (name, voice, stages) without its lessons; undefined when not released for this L1. */
export function courseIndex(l1: L1, target: Target): CourseIndex | undefined {
  return contentIndex.l1s[l1]?.courses[target];
}

/** Courses parsed so far (the bundler's module cache keeps them too, so this is just the lookup). */
const loaded = new Map<string, CourseBundle>();

/**
 * The whole course (lessons, explanations, audio map), parsed on first use. Synchronous: the app
 * state loads the chosen course right after the screen that chose it has painted.
 */
export function loadCourse(l1: L1, target: Target): CourseBundle | undefined {
  const key = courseKey(l1, target);
  let course = loaded.get(key);
  if (!course) {
    const load = courseLoaders[key];
    if (!load) return undefined;
    course = load();
    loaded.set(key, course);
  }
  return course;
}

/** Already parsed (no work to do)? */
export function isCourseLoaded(l1: L1, target: Target): boolean {
  return loaded.has(courseKey(l1, target));
}

/** Which course a lesson or item id belongs to, e.g. "zh-A1-01" / "zh.ni-hao" → "zh". */
export function targetOf(id: string): Target {
  return id.slice(0, 2) as Target;
}
