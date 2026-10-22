import type { Loaded } from './load';
import type { CourseGloss, L1, LessonGloss, Target } from './schema';

/**
 * Translation sheets: everything a learner reads in their own language, flattened to
 * key → text so a translator (human or AI) can produce a new L1 layer (e.g. Vietnamese from Thai)
 * without touching the shared course content.
 */
export type SheetEntry = {
  key: string;
  /** Text in the source L1. */
  source: string;
  /** What it explains, e.g. the target-language word or dialogue line. */
  context?: string;
  /** Filled in by the translator; empty entries are skipped on import. */
  translation: string;
};

export type Sheet = {
  from: L1;
  to: L1;
  /** Name of the new language in itself (meta.json), e.g. "Tiếng Việt". */
  name: string;
  entries: SheetEntry[];
};

type Options = { targets?: Target[]; translit?: boolean };

/** Builds the sheet for `to` from the `from` layer, keeping any translations `to` already has. */
export function exportSheet(loaded: Loaded, from: L1, to: L1, { targets, translit = false }: Options = {}): Sheet {
  const src = loaded.l1s.get(from);
  if (!src) throw new Error(`no ${from} layer to translate from`);
  const dst = loaded.l1s.get(to);
  const entries: SheetEntry[] = [];
  const add = (key: string, source: string | undefined, existing: string | undefined, context?: string) => {
    if (source) entries.push({ key, source, ...(context ? { context } : {}), translation: existing ?? '' });
  };

  for (const [key, text] of Object.entries(src.ui)) add(`ui:${key}`, text, dst?.ui[key]);

  for (const [target, layer] of src.courses) {
    if (targets && !targets.includes(target)) continue;
    const t = loaded.targets.get(target);
    const old = dst?.courses.get(target);
    const g = layer.gloss;
    if (g) {
      add(`${target}:name`, g.name, old?.gloss?.name);
      for (const [stage, s] of Object.entries(g.stages)) {
        add(`${target}:stage:${stage}:title`, s?.title, old?.gloss?.stages[stage as keyof CourseGloss['stages']]?.title);
        add(`${target}:stage:${stage}:description`, s?.description, old?.gloss?.stages[stage as keyof CourseGloss['stages']]?.description);
      }
      for (const [unit, u] of Object.entries(g.units)) {
        add(`${target}:unit:${unit}:title`, u.title, old?.gloss?.units[unit]?.title);
        add(`${target}:unit:${unit}:goal`, u.goal, old?.gloss?.units[unit]?.goal);
      }
    }
    for (const [id, lg] of layer.lessons) {
      const lesson = t?.lessons.get(id);
      const prev = old?.lessons.get(id);
      add(`${target}:lesson:${id}:title`, lg.title, prev?.title);
      add(`${target}:lesson:${id}:intro`, lg.intro, prev?.intro);
      for (const [itemId, gloss] of Object.entries(lg.items)) {
        const item = lesson?.items.find((i) => i.id === itemId);
        const context = item ? `${item.text} (${item.reading})` : undefined;
        add(`${target}:item:${id}:${itemId}:meaning`, gloss.meaning, prev?.items[itemId]?.meaning, context);
        if (translit) add(`${target}:item:${id}:${itemId}:translit`, gloss.translit, prev?.items[itemId]?.translit, context);
      }
      lg.dialogue.forEach((line, i) =>
        add(`${target}:line:${id}:${i}`, line, prev?.dialogue[i], lesson?.dialogue[i]?.text),
      );
      lg.notes.forEach((note, i) => {
        add(`${target}:note:${id}:${i}:title`, note.title, prev?.notes[i]?.title);
        add(`${target}:note:${id}:${i}:body`, note.body, prev?.notes[i]?.body);
      });
    }
  }
  return { from, to, name: dst?.meta.name ?? '', entries };
}

/** Files (path relative to content/ → JSON) for the translated layer. Keeps `released` from an existing meta.json. */
export function importSheet(sheet: Sheet, loaded: Loaded): Map<string, unknown> {
  const t = new Map(sheet.entries.filter((e) => e.translation.trim()).map((e) => [e.key, e.translation.trim()]));
  const files = new Map<string, unknown>();
  const dir = `l1/${sheet.to}`;
  const existing = loaded.l1s.get(sheet.to);

  files.set(`${dir}/meta.json`, {
    l1: sheet.to,
    name: sheet.name || existing?.meta.name || sheet.to,
    released: existing?.meta.released ?? [],
  });
  const ui: Record<string, string> = {};
  for (const [key, value] of t) if (key.startsWith('ui:')) ui[key.slice(3)] = value;
  files.set(`${dir}/ui.json`, ui);

  const src = loaded.l1s.get(sheet.from);
  for (const [target, layer] of src?.courses ?? []) {
    const name = t.get(`${target}:name`);
    if (!name) continue;
    const g = layer.gloss;
    const course: CourseGloss = { target, name, stages: {}, units: {} };
    for (const stage of Object.keys(g?.stages ?? {}) as (keyof CourseGloss['stages'])[]) {
      const title = t.get(`${target}:stage:${stage}:title`);
      const description = t.get(`${target}:stage:${stage}:description`);
      if (title) course.stages[stage] = { title, ...(description ? { description } : {}) };
    }
    for (const unit of Object.keys(g?.units ?? {})) {
      const title = t.get(`${target}:unit:${unit}:title`);
      const goal = t.get(`${target}:unit:${unit}:goal`);
      if (title) course.units[unit] = { title, ...(goal ? { goal } : {}) };
    }
    files.set(`${dir}/${target}/course.json`, course);

    for (const [id, lg] of layer.lessons) {
      const title = t.get(`${target}:lesson:${id}:title`);
      const intro = t.get(`${target}:lesson:${id}:intro`);
      if (!title || !intro) continue;
      const out: LessonGloss = { lesson: id, title, intro, items: {}, dialogue: [], notes: [] };
      for (const itemId of Object.keys(lg.items)) {
        const meaning = t.get(`${target}:item:${id}:${itemId}:meaning`);
        const translit = t.get(`${target}:item:${id}:${itemId}:translit`);
        if (meaning) out.items[itemId] = { meaning, ...(translit ? { translit } : {}) };
      }
      lg.dialogue.forEach((_, i) => {
        const line = t.get(`${target}:line:${id}:${i}`);
        if (line) out.dialogue.push(line);
      });
      lg.notes.forEach((_, i) => {
        const nt = t.get(`${target}:note:${id}:${i}:title`);
        const body = t.get(`${target}:note:${id}:${i}:body`);
        if (nt && body) out.notes.push({ title: nt, body });
      });
      files.set(`${dir}/${target}/lessons/${id}.json`, out);
    }
  }
  return files;
}
