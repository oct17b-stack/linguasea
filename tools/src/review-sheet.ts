// Review sheets for native-speaker teachers: one row per thing to check, in course order.
//   npm run review:sheet [-- --target zh] [--l1 th]
// → content/_review/sheets/<target>-<l1>.csv (UTF-8 with BOM, so Excel shows Thai, Chinese, Japanese and Korean;
//   Google Sheets opens it too). The last column is left empty for the teacher's comments.
import { buildBundle, loadContent } from '@linguasea/contract/node';
import type { CourseBundle } from '@linguasea/contract';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const HEADER = ['lesson', 'type', 'id', 'speaker', 'text', 'reading', 'say', 'l1', 'translit', 'comment'];

type Row = Partial<Record<(typeof HEADER)[number], string>>;

/** Every unit and lesson of a course with its explanation layer, as sheet rows (header first). */
export function reviewRows(course: CourseBundle): string[][] {
  const rows: Row[] = [];
  for (const stage of course.course.stages) {
    for (const unit of stage.units) {
      const g = course.gloss.units[unit.id];
      rows.push({ lesson: unit.id, type: 'unit', l1: [g?.title, g?.goal].filter(Boolean).join(' — ') });
      if (unit.scenario) rows.push({ lesson: unit.id, type: 'tutor scenario', text: unit.scenario });
      for (const id of unit.lessons) {
        const entry = course.lessons[id];
        if (!entry) continue;
        const { lesson, gloss } = entry;
        rows.push({ lesson: id, type: 'title', l1: gloss.title });
        rows.push({ lesson: id, type: 'intro', l1: gloss.intro });
        lesson.passage.forEach((para, p) =>
          para.forEach((s, i) =>
            rows.push({ lesson: id, type: 'passage', id: `${p + 1}.${i + 1}`, text: s.text, reading: s.reading, l1: gloss.passage[p]?.[i] }),
          ),
        );
        for (const item of lesson.items) {
          const ig = gloss.items[item.id];
          rows.push({
            lesson: id,
            type: item.kind && item.kind !== 'word' ? `item (${item.kind})` : 'item',
            id: item.id,
            text: item.text,
            reading: item.reading,
            say: item.say,
            l1: ig?.meaning,
            translit: ig?.translit,
          });
        }
        lesson.questions.forEach((q, i) => {
          const qg = gloss.questions[i];
          if (!qg) return;
          const options = qg.options.map((o, k) => `${k === q.answer ? '✓' : '•'} ${o}`).join('\n');
          rows.push({ lesson: id, type: 'question', id: String(i + 1), l1: `${qg.prompt}\n${options}` });
        });
        lesson.dialogue.forEach((line, i) =>
          rows.push({
            lesson: id,
            type: 'dialogue',
            id: String(i + 1),
            speaker: line.speaker,
            text: line.text,
            reading: line.reading,
            l1: gloss.dialogue[i],
          }),
        );
        gloss.notes.forEach((n, i) => rows.push({ lesson: id, type: 'note', id: String(i + 1), l1: `${n.title}\n${n.body}` }));
      }
    }
  }
  return [HEADER, ...rows.map((r) => HEADER.map((h) => r[h] ?? ''))];
}

export function toCsv(rows: string[][]): string {
  const cell = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const flag = (name: string) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? process.argv[i + 1] : undefined;
  };
  const contentRoot = fileURLToPath(new URL('../../content', import.meta.url));
  const l1 = flag('l1') ?? 'th';
  const only = flag('target');
  const layer = buildBundle(loadContent(contentRoot), 'review').l1s[l1 as 'th'];
  if (!layer) throw new Error(`no released courses for ${l1}`);
  const dir = `${contentRoot}/_review/sheets`;
  mkdirSync(dir, { recursive: true });
  for (const [target, course] of Object.entries(layer.courses)) {
    if (!course || (only && target !== only)) continue;
    const rows = reviewRows(course);
    writeFileSync(`${dir}/${target}-${l1}.csv`, toCsv(rows));
    console.log(`content/_review/sheets/${target}-${l1}.csv: ${rows.length - 1} rows`);
  }
}
