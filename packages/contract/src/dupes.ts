import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Loaded } from './load';
import { kindGroup, type Target } from './schema';

/** One word taught under several ids: review cards would split, so the ids should be merged. */
export type Duplicate = { target: Target; text: string; reading: string; ids: { id: string; where: string }[] };

const norm = (s: string) => s.trim().toLowerCase().replace(/[\s.,!?。！？、'’]/g, '');

type Entry = { id: string; text: string; reading: string; kind?: string; where: string };

function group(target: Target, entries: Entry[]): Duplicate[] {
  const byWord = new Map<string, Map<string, string>>();
  for (const e of entries) {
    if (e.kind && kindGroup(e.kind as never) === 'sound') continue; // あ / ア style drills share readings on purpose
    const key = `${norm(e.text)}|${norm(e.reading)}`;
    const ids = byWord.get(key) ?? new Map<string, string>();
    if (!ids.has(e.id)) ids.set(e.id, e.where);
    byWord.set(key, ids);
  }
  const out: Duplicate[] = [];
  for (const [key, ids] of byWord) {
    if (ids.size < 2) continue;
    const [text, reading] = key.split('|');
    out.push({ target, text, reading, ids: [...ids].map(([id, where]) => ({ id, where })) });
  }
  return out;
}

/** An item id taught (listed as an item) in more than one lesson — usually an unintended repeat. */
export type Retaught = { target: Target; id: string; where: string[] };

function entriesOf(loaded: Loaded, target: Target, contentRoot?: string): Entry[] {
  const entries: Entry[] = [];
  const t = loaded.targets.get(target);
  for (const lesson of t?.lessons.values() ?? []) {
    for (const item of lesson.items) entries.push({ ...item, where: lesson.id });
  }
  const planDir = contentRoot && join(contentRoot, '_plan');
  if (planDir && existsSync(planDir)) {
    for (const file of readdirSync(planDir).filter((f) => f.startsWith(target) && f.endsWith('.json'))) {
      let plan: { stages?: { units?: { lessons?: { id: string; items?: Entry[] }[] }[] }[] };
      try {
        plan = JSON.parse(readFileSync(join(planDir, file), 'utf8'));
      } catch {
        continue; // a plan still being written
      }
      for (const stage of plan.stages ?? []) {
        for (const unit of stage.units ?? []) {
          for (const lesson of unit.lessons ?? []) {
            // A planned lesson that is already written is represented by its file.
            if (t?.lessons.has(lesson.id)) continue;
            for (const item of lesson.items ?? []) entries.push({ ...item, where: `plan ${lesson.id}` });
          }
        }
      }
    }
  }
  return entries;
}

/** Item ids listed in more than one lesson (written or planned). */
export function findRetaught(loaded: Loaded, contentRoot?: string): Retaught[] {
  const out: Retaught[] = [];
  for (const target of loaded.targets.keys()) {
    const byId = new Map<string, string[]>();
    for (const e of entriesOf(loaded, target, contentRoot)) {
      const where = byId.get(e.id) ?? [];
      if (!where.includes(e.where)) where.push(e.where);
      byId.set(e.id, where);
    }
    for (const [id, where] of byId) if (where.length > 1) out.push({ target, id, where });
  }
  return out;
}

/** Items of the written content, plus planned items from content/_plan/<target>*.json when present. */
export function findDuplicates(loaded: Loaded, contentRoot?: string): Duplicate[] {
  const out: Duplicate[] = [];
  for (const target of loaded.targets.keys()) {
    const entries = entriesOf(loaded, target, contentRoot);
    // Declared homonyms are different words that happen to be written and read the same.
    const homonyms = loaded.targets.get(target)?.course.homonyms ?? [];
    const declared = (d: Duplicate) => homonyms.some((set) => d.ids.every((x) => set.includes(x.id)));
    out.push(...group(target, entries).filter((d) => !declared(d)));
  }
  return out;
}

/** Vocabulary items explained with the very same text: a "which word means …?" question can't tell them apart. */
export type SameMeaning = { target: Target; l1: string; meaning: string; ids: { id: string; where: string }[] };

export function findSameMeaning(loaded: Loaded): SameMeaning[] {
  const out: SameMeaning[] = [];
  for (const [l1, layer] of loaded.l1s) {
    for (const [target, course] of layer.courses) {
      const lessons = loaded.targets.get(target)?.lessons;
      const byMeaning = new Map<string, Map<string, string>>();
      for (const [lessonId, gloss] of course.lessons) {
        const items = lessons?.get(lessonId)?.items ?? [];
        for (const [id, g] of Object.entries(gloss.items)) {
          const item = items.find((x) => x.id === id);
          if (item && kindGroup(item.kind) === 'sound') continue; // sound drills are told apart by ear
          const ids = byMeaning.get(g.meaning.trim()) ?? new Map<string, string>();
          if (!ids.has(id)) ids.set(id, lessonId);
          byMeaning.set(g.meaning.trim(), ids);
        }
      }
      for (const [meaning, ids] of byMeaning) {
        if (ids.size > 1) out.push({ target, l1, meaning, ids: [...ids].map(([id, where]) => ({ id, where })) });
      }
    }
  }
  return out;
}
