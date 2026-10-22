import type { Loaded } from './load';
import { courseKey, type Bundle, type BundleIndex, type CourseBundle, type CourseIndex, type L1Bundle } from './bundle';
import type { L1, Target } from './schema';

/** Joins each released course with its L1 explanation layer. Run validate() first. */
export function buildBundle(loaded: Loaded, version: string): Bundle {
  const bundle: Bundle = { version, l1s: {} };
  for (const [l1, { meta, ui, courses }] of loaded.l1s) {
    const out: L1Bundle = { l1: meta.l1, name: meta.name, ui, courses: {} };
    for (const target of meta.released) {
      const t = loaded.targets.get(target);
      const c = courses.get(target);
      if (!t || !c?.gloss) continue;
      const lessons: CourseBundle['lessons'] = {};
      for (const [id, lesson] of t.lessons) {
        const gloss = c.lessons.get(id);
        if (gloss) lessons[id] = { lesson, gloss };
      }
      // Generated speech, when `npm run audio` has made a manifest; otherwise the app uses device TTS.
      out.courses[target] = { course: t.course, gloss: c.gloss, lessons, ...(t.audio && { audio: t.audio }) };
    }
    bundle.l1s[l1 as L1] = out;
  }
  return bundle;
}

function courseIndex(c: CourseBundle): CourseIndex {
  const stages = c.course.stages.map((s) => ({
    id: s.id,
    ...(c.gloss.stages[s.id]?.title ? { title: c.gloss.stages[s.id]!.title } : {}),
    cefr: s.cefr,
    ...(s.exam ? { exam: s.exam } : {}),
    free: s.free,
    units: s.units.length,
    lessons: s.units.reduce((n, u) => n + u.lessons.length, 0),
  }));
  return {
    target: c.course.target,
    name: c.gloss.name,
    voice: c.course.voice,
    reading: c.course.reading,
    stages,
    lessons: stages.reduce((n, s) => n + s.lessons, 0),
  };
}

export type SplitCourse = { key: string; l1: L1; target: Target; course: CourseBundle };

/**
 * Splits a bundle the way the app ships it: a small index read at startup and one file per
 * (L1, course), so a phone only parses the course the learner studies. buildBundle stays the
 * single in-memory form the server and tools use.
 */
export function splitBundle(bundle: Bundle): { index: BundleIndex; courses: SplitCourse[] } {
  const index: BundleIndex = { version: bundle.version, l1s: {} };
  const courses: SplitCourse[] = [];
  for (const [l1, b] of Object.entries(bundle.l1s) as [L1, L1Bundle][]) {
    const entry: BundleIndex['l1s'][L1] = { l1: b.l1, name: b.name, ui: b.ui, courses: {} };
    for (const [target, course] of Object.entries(b.courses) as [Target, CourseBundle][]) {
      entry.courses[target] = courseIndex(course);
      courses.push({ key: courseKey(l1, target), l1, target, course });
    }
    index.l1s[l1] = entry;
  }
  return { index, courses };
}
