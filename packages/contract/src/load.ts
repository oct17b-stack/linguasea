import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { z } from 'zod';

import {
  Course,
  CourseGloss,
  L1Meta,
  Lesson,
  LessonGloss,
  TARGETS,
  Ui,
  type Target,
} from './schema';

export type Problem = { file: string; message: string };

export type LoadedTarget = {
  course: Course;
  lessons: Map<string, Lesson>;
  /** content/audio/<target>/manifest.json, written by `npm run audio`: audioKey → path under content/audio. */
  audio?: Record<string, string>;
};

const AudioManifest = z.record(z.string(), z.string().min(1));

export type LoadedL1 = {
  meta: L1Meta;
  ui: Ui;
  courses: Map<Target, { gloss?: CourseGloss; lessons: Map<string, LessonGloss> }>;
};

export type Loaded = {
  targets: Map<Target, LoadedTarget>;
  l1s: Map<string, LoadedL1>;
  problems: Problem[];
};

type Report = (file: string, message: string) => void;

function readJson<T>(file: string, schema: z.ZodType<T>, report: Report): T | undefined {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    report(file, `invalid JSON: ${(e as Error).message}`);
    return undefined;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      report(file, `${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    return undefined;
  }
  return parsed.data;
}

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(dir, f));
}

/** Reads every content file under `root` (the repo's content/ folder). Schema errors go into `problems`. */
export function loadContent(root: string): Loaded {
  const problems: Problem[] = [];
  // Problems name files relative to the content root, like the cross-file checks do.
  const report: Report = (file, message) => problems.push({ file: relative(root, file), message });
  const targets = new Map<Target, LoadedTarget>();

  for (const target of TARGETS) {
    const dir = join(root, 'courses', target);
    if (!existsSync(dir)) continue;
    const course = readJson(join(dir, 'course.json'), Course, report);
    if (!course) continue;
    const lessons = new Map<string, Lesson>();
    for (const file of jsonFiles(join(dir, 'lessons'))) {
      const lesson = readJson(file, Lesson, report);
      if (!lesson) continue;
      if (basename(file, '.json') !== lesson.id) {
        report(file, `file name must equal lesson id ${lesson.id}`);
      }
      lessons.set(lesson.id, lesson);
    }
    const manifest = join(root, 'audio', target, 'manifest.json');
    const audio = existsSync(manifest) ? readJson(manifest, AudioManifest, report) : undefined;
    targets.set(target, audio ? { course, lessons, audio } : { course, lessons });
  }

  const l1s = new Map<string, LoadedL1>();
  const l1Root = join(root, 'l1');
  for (const l1 of existsSync(l1Root) ? readdirSync(l1Root).sort() : []) {
    const dir = join(l1Root, l1);
    const meta = readJson(join(dir, 'meta.json'), L1Meta, report);
    const ui = readJson(join(dir, 'ui.json'), Ui, report);
    if (!meta || !ui) continue;
    if (meta.l1 !== l1) report(join(dir, 'meta.json'), `l1 must be "${l1}"`);
    const courses: LoadedL1['courses'] = new Map();
    for (const target of TARGETS) {
      const tdir = join(dir, target);
      if (!existsSync(tdir)) continue;
      const gloss = existsSync(join(tdir, 'course.json'))
        ? readJson(join(tdir, 'course.json'), CourseGloss, report)
        : undefined;
      const lessons = new Map<string, LessonGloss>();
      for (const file of jsonFiles(join(tdir, 'lessons'))) {
        const lg = readJson(file, LessonGloss, report);
        if (!lg) continue;
        if (basename(file, '.json') !== lg.lesson) {
          report(file, `file name must equal lesson id ${lg.lesson}`);
        }
        lessons.set(lg.lesson, lg);
      }
      courses.set(target, { gloss, lessons });
    }
    l1s.set(l1, { meta, ui, courses });
  }

  return { targets, l1s, problems };
}
