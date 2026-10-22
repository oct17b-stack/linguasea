import type { Loaded } from './load';
import type { Bundle, CourseBundle, L1Bundle } from './bundle';
import type { L1 } from './schema';

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
