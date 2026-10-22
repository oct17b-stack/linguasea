import { lessonExercises, sameReading } from './exercises';
import type { Loaded, Problem } from './load';
import { kindGroup, type Item, type LessonGloss } from './schema';

/** The L1 whose UI keys every other L1 must match. */
export const REFERENCE_L1 = 'th';

/** Choice questions show the right answer plus up to 3 wrong ones. */
const CHOICES = 4;

const TEXT_ANSWERS = new Set(['choose-text', 'listen-text']);
const BY_EAR = new Set(['listen-choose', 'listen-text']);


/** Cross-file checks on top of the schema checks done while loading. */
export function validate(loaded: Loaded): Problem[] {
  const problems: Problem[] = [...loaded.problems];
  const add = (file: string, message: string) => problems.push({ file, message });

  for (const [target, { course, lessons }] of loaded.targets) {
    const cfile = `courses/${target}/course.json`;
    if (course.target !== target) add(cfile, `target must be "${target}"`);

    const listed = new Set<string>();
    for (const stage of course.stages) {
      for (const unit of stage.units) {
        if (!unit.id.startsWith(`${target}-${stage.id}`)) {
          add(cfile, `unit ${unit.id} does not belong to stage ${stage.id}`);
        }
        for (const id of unit.lessons) {
          if (listed.has(id)) add(cfile, `lesson ${id} listed twice`);
          listed.add(id);
          const lesson = lessons.get(id);
          if (!lesson) {
            add(cfile, `lesson ${id} has no file`);
            continue;
          }
          if (!id.startsWith(`${unit.id}-`)) add(cfile, `lesson ${id} is not in unit ${unit.id}`);
          if (lesson.stage !== stage.id) add(`courses/${target}/lessons/${id}.json`, `stage must be ${stage.id}`);
        }
      }
    }

    // An item id means the same thing everywhere it appears: review cards are keyed by it.
    const seen = new Map<string, Item & { lesson: string }>();
    for (const lesson of lessons.values()) {
      const lfile = `courses/${target}/lessons/${lesson.id}.json`;
      for (const item of lesson.items) {
        const prev = seen.get(item.id);
        if (prev && (prev.text !== item.text || prev.reading !== item.reading || prev.kind !== item.kind)) {
          add(lfile, `item ${item.id} differs from ${prev.lesson} (same id must mean the same text, reading and kind)`);
        }
        if (!prev) seen.set(item.id, { ...item, lesson: lesson.id });
      }
    }

    const groupTexts = (group: string) =>
      new Set([...seen.values()].filter((i) => kindGroup(i.kind) === group).map((i) => i.text)).size;

    for (const lesson of lessons.values()) {
      const lfile = `courses/${target}/lessons/${lesson.id}.json`;
      if (!listed.has(lesson.id)) add(lfile, 'lesson is not listed in course.json');
      if (lesson.target !== target) add(lfile, `target must be "${target}"`);

      const local = new Map<string, Item>();
      for (const item of lesson.items) {
        if (local.has(item.id)) add(lfile, `item ${item.id} appears twice`);
        local.set(item.id, item);
        if (!item.id.startsWith(`${target}.`)) add(lfile, `item ${item.id} must start with "${target}."`);
      }

      for (const ex of lessonExercises(lesson)) {
        const item = local.get(ex.item);
        if (!item) {
          add(lfile, `exercise uses ${ex.item}, which is not taught in this lesson`);
          continue;
        }
        if (ex.type === 'speak') continue;
        const group = kindGroup(item.kind);
        if (ex.options) {
          const texts = new Set([item.text]);
          for (const id of ex.options) {
            const other = seen.get(id);
            if (!other) add(lfile, `${ex.type} option ${id} is not an item of this course`);
            else if (id === item.id) add(lfile, `${ex.type} on ${item.id} lists itself as a wrong answer`);
            else if (kindGroup(other.kind) !== group) add(lfile, `${ex.type} option ${id} is a ${other.kind}, not like ${item.id}`);
            else if (TEXT_ANSWERS.has(ex.type) && texts.has(other.text)) add(lfile, `${ex.type} on ${item.id} has two answers reading "${other.text}"`);
            else if (BY_EAR.has(ex.type) && sameReading(other.reading, item.reading)) add(lfile, `${ex.type} on ${item.id}: option ${id} sounds the same ("${other.reading}")`);
            if (other) texts.add(other.text);
          }
        } else if (TEXT_ANSWERS.has(ex.type) && groupTexts(group) < CHOICES) {
          add(lfile, `${ex.type} on ${item.id} needs ${CHOICES} different ${group} items in the course (or explicit options)`);
        }
      }
    }
  }

  const refUi = loaded.l1s.get(REFERENCE_L1)?.ui;
  for (const [l1, { meta, ui, courses }] of loaded.l1s) {
    if (refUi) {
      for (const key of Object.keys(refUi)) {
        if (!(key in ui)) add(`l1/${l1}/ui.json`, `missing key "${key}"`);
      }
      for (const key of Object.keys(ui)) {
        if (!(key in refUi)) add(`l1/${l1}/ui.json`, `unknown key "${key}" (not in ${REFERENCE_L1})`);
      }
    }

    for (const [target, { gloss, lessons: glosses }] of courses) {
      const t = loaded.targets.get(target);
      const dir = `l1/${l1}/${target}`;
      if (!t) {
        add(dir, `no course for target ${target}`);
        continue;
      }
      if (gloss) {
        for (const stage of t.course.stages) {
          if (!gloss.stages[stage.id]) add(`${dir}/course.json`, `missing title for stage ${stage.id}`);
          for (const unit of stage.units) {
            if (!gloss.units[unit.id]) add(`${dir}/course.json`, `missing title for unit ${unit.id}`);
          }
        }
      }

      // Meanings of every item in the course, as this L1 explains them.
      const meanings = new Map<string, { meaning: string; group: string }>();
      for (const lesson of t.lessons.values()) {
        const lg: LessonGloss | undefined = glosses.get(lesson.id);
        for (const item of lesson.items) {
          const g = lg?.items[item.id];
          if (g && !meanings.has(item.id)) meanings.set(item.id, { meaning: g.meaning, group: kindGroup(item.kind) });
        }
      }
      const groupMeanings = (group: string) =>
        new Set([...meanings.values()].filter((m) => m.group === group).map((m) => m.meaning)).size;

      for (const lg of glosses.values()) {
        const lesson = t.lessons.get(lg.lesson);
        const gfile = `${dir}/lessons/${lg.lesson}.json`;
        if (!lesson) {
          add(gfile, `no lesson ${lg.lesson} in courses/${target}`);
          continue;
        }
        for (const item of lesson.items) {
          if (!lg.items[item.id]) add(gfile, `missing gloss for ${item.id}`);
        }
        for (const id of Object.keys(lg.items)) {
          if (!lesson.items.some((i) => i.id === id)) add(gfile, `gloss for ${id}, which the lesson does not teach`);
        }
        if (lg.dialogue.length !== lesson.dialogue.length) {
          add(gfile, `dialogue has ${lg.dialogue.length} translations for ${lesson.dialogue.length} lines`);
        }
        for (const ex of lessonExercises(lesson)) {
          if (ex.type === 'speak' || TEXT_ANSWERS.has(ex.type)) continue;
          const own = meanings.get(ex.item);
          if (!own) continue;
          if (ex.options) {
            const labels = new Set([own.meaning]);
            for (const id of ex.options) {
              const m = meanings.get(id)?.meaning;
              if (m && labels.has(m)) add(gfile, `${ex.type} on ${ex.item} has two answers meaning "${m}"`);
              if (m) labels.add(m);
            }
          } else if (groupMeanings(own.group) < CHOICES) {
            add(gfile, `${ex.type} on ${ex.item} needs ${CHOICES} different meanings in the course (or explicit options)`);
          }
        }
      }
    }

    // A released course must be fully explained in this L1.
    for (const target of meta.released) {
      const t = loaded.targets.get(target);
      const c = courses.get(target);
      const dir = `l1/${l1}/${target}`;
      if (!t) {
        add(`l1/${l1}/meta.json`, `released target ${target} has no course`);
        continue;
      }
      if (!c?.gloss) add(dir, 'released but course.json is missing');
      for (const id of t.lessons.keys()) {
        if (!c?.lessons.has(id)) add(dir, `released but lesson ${id} has no explanation`);
      }
    }
  }

  return problems;
}
