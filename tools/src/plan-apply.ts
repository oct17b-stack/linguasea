// Adds the stages/units/lessons of a syllabus plan (content/_plan/<file>.json) to the course structure:
//   npm run plan:apply -- zh-CF
// → content/courses/<t>/course.json gets the plan's stages (units and lesson/reader ids, in order),
//   content/l1/th/<t>/course.json gets stage titles and each unit's Thai title and goal.
// Lesson files are written separately (by writers); the validator reports the ones still missing.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type PlanItem = { id: string; text: string; reading: string; kind?: string };
type PlanLesson = { id: string; kind?: string; topic: string; grammar?: string; items: PlanItem[] };
type PlanUnit = { id: string; title_th: string; goal_th: string; scenario?: string; lessons: PlanLesson[] };
type PlanStage = { id: string; cefr: string; exam?: string; minutes: number; readerMinutes?: number; units: PlanUnit[] };
export type Plan = { target: string; stages: PlanStage[] };

/** Thai stage names shared by every course; the description adds that course's exam level. */
const STAGE_TH: Record<string, { title: string; can: string }> = {
  A: { title: 'เริ่มต้น', can: 'ฟังและพูดประโยคง่าย ๆ ที่ใช้ทุกวัน' },
  B: { title: 'พื้นฐาน', can: 'สื่อสารเรื่องใกล้ตัวในชีวิตประจำวันได้' },
  C: { title: 'ต่อยอด', can: 'เล่าเรื่องที่ผ่านมา นัดหมาย และเปรียบเทียบสิ่งต่าง ๆ ได้' },
  D: { title: 'ก้าวหน้า', can: 'จัดการสถานการณ์ส่วนใหญ่เวลาเดินทางและทำงาน และอธิบายเหตุผลได้' },
  E: { title: 'ระดับกลาง', can: 'อ่านเรื่องสั้นและบทความง่าย ๆ และแสดงความคิดเห็นได้' },
  F: { title: 'ระดับกลางขั้นสูง', can: 'พูดคุยเรื่องทั่วไปได้คล่อง เล่าประสบการณ์ และเขียนข้อความที่เป็นทางการได้' },
};

/**
 * Merges a plan into the course: new stages are added; for stages that already exist (e.g. extending
 * A–B), new units are appended and existing units get the plan's extra lessons after their own.
 * Existing titles are kept; applying the same plan twice changes nothing.
 */
export function applyPlan(plan: Plan, course: any, gloss: any) {
  for (const p of plan.stages) {
    let stage = course.stages.find((s: { id: string }) => s.id === p.id);
    if (!stage) {
      stage = { id: p.id, cefr: p.cefr.replace('+', ''), ...(p.exam ? { exam: p.exam } : {}), free: false, units: [] };
      course.stages.push(stage);
    }
    for (const u of p.units) {
      const ids = u.lessons.map((l) => l.id);
      const unit = stage.units.find((x: { id: string }) => x.id === u.id);
      if (unit) unit.lessons.push(...ids.filter((id) => !unit.lessons.includes(id)));
      else stage.units.push({ id: u.id, lessons: ids });
      gloss.units[u.id] ??= { title: u.title_th, goal: u.goal_th };
      gloss.units[u.id].goal ??= u.goal_th;
    }
    const th = STAGE_TH[p.id];
    gloss.stages[p.id] ??= { title: th.title };
    gloss.stages[p.id].description ??= `${th.can}${p.exam ? ` (เทียบ ${p.exam})` : ''}`;
  }
  const order = 'ABCDEF';
  course.stages.sort((a: { id: string }, b: { id: string }) => order.indexOf(a.id) - order.indexOf(b.id));
  for (const stage of course.stages) {
    // Units in number order (A7 before A10).
    stage.units.sort((a: { id: string }, b: { id: string }) => unitNumber(a.id) - unitNumber(b.id));
  }
  return { course, gloss };
}

const unitNumber = (id: string) => Number(/(\d+)$/.exec(id)?.[1] ?? 0);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const name = process.argv[2];
  if (!name) {
    console.error('usage: npm run plan:apply -- <plan name, e.g. zh-CF>');
    process.exit(1);
  }
  const root = fileURLToPath(new URL('../../content/', import.meta.url));
  const plan = JSON.parse(readFileSync(`${root}_plan/${name}.json`, 'utf8')) as Plan;
  const coursePath = `${root}courses/${plan.target}/course.json`;
  const glossPath = `${root}l1/th/${plan.target}/course.json`;
  const { course, gloss } = applyPlan(plan, JSON.parse(readFileSync(coursePath, 'utf8')), JSON.parse(readFileSync(glossPath, 'utf8')));
  writeFileSync(coursePath, JSON.stringify(course, null, 2) + '\n');
  writeFileSync(glossPath, JSON.stringify(gloss, null, 2) + '\n');
  const lessons = plan.stages.reduce((n, s) => n + s.units.reduce((m, u) => m + u.lessons.length, 0), 0);
  console.log(`${plan.target}: added stages ${plan.stages.map((s) => s.id).join(', ')} (${lessons} lessons and readers)`);
}
