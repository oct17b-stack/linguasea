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

/** Items of the written content, plus planned items from content/_plan/<target>*.json when present. */
export function findDuplicates(loaded: Loaded, contentRoot?: string): Duplicate[] {
  const out: Duplicate[] = [];
  for (const [target, { lessons }] of loaded.targets) {
    const entries: Entry[] = [];
    for (const lesson of lessons.values()) {
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
              for (const item of lesson.items ?? []) entries.push({ ...item, where: `plan ${lesson.id}` });
            }
          }
        }
      }
    }
    out.push(...group(target, entries));
  }
  return out;
}
