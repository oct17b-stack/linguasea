import type { Loaded, Problem } from './load';
import type { Item } from './schema';

/** The L1 whose UI keys every other L1 must match. */
export const REFERENCE_L1 = 'th';

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
      if (!listed.has(lesson.id)) add(lfile, 'lesson is not listed in course.json');
      if (lesson.target !== target) add(lfile, `target must be "${target}"`);

      const local = new Set<string>();
      for (const item of lesson.items) {
        if (local.has(item.id)) add(lfile, `item ${item.id} appears twice`);
        local.add(item.id);
        const prev = seen.get(item.id);
        if (prev && (prev.text !== item.text || prev.reading !== item.reading)) {
          add(lfile, `item ${item.id} differs from ${prev.lesson} (same id must mean the same text and reading)`);
        }
        if (!prev) seen.set(item.id, { ...item, lesson: lesson.id });
        if (!item.id.startsWith(`${target}.`)) add(lfile, `item ${item.id} must start with "${target}."`);
      }
      for (const ex of lesson.exercises) {
        if (!local.has(ex.item)) add(lfile, `exercise uses ${ex.item}, which is not taught in this lesson`);
      }
    }
    // Choice exercises draw wrong answers from the rest of the course.
    if (seen.size > 0 && seen.size < 3) add(cfile, 'a course needs at least 3 distinct items for choice exercises');
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
