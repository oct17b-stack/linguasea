import { describe, expect, it } from 'vitest';

import { applyPlan, type Plan } from './plan-apply';

describe('applyPlan', () => {
  it('adds plan stages after existing ones, with Thai stage and unit names', () => {
    const plan: Plan = {
      target: 'zh',
      stages: [
        {
          id: 'C',
          cefr: 'A2',
          exam: 'HSK 2',
          minutes: 8,
          units: [
            {
              id: 'zh-C1',
              title_th: 'งานอดิเรก',
              goal_th: 'เล่าเรื่องงานอดิเรกได้',
              lessons: [
                { id: 'zh-C1-01', topic: 'x', items: [] },
                { id: 'zh-C1-r01', kind: 'reader', topic: 'y', items: [] },
              ],
            },
          ],
        },
      ],
    };
    const course = { target: 'zh', stages: [{ id: 'A', units: [] }, { id: 'B', units: [] }] };
    const gloss = { stages: { A: { title: 'เริ่มต้น' } }, units: {} };
    const out = applyPlan(plan, course, gloss);
    expect(out.course.stages.map((s: { id: string }) => s.id)).toEqual(['A', 'B', 'C']);
    expect(out.course.stages[2]).toEqual({
      id: 'C',
      cefr: 'A2',
      exam: 'HSK 2',
      free: false,
      units: [{ id: 'zh-C1', lessons: ['zh-C1-01', 'zh-C1-r01'] }],
    });
    expect(out.gloss.units['zh-C1']).toEqual({ title: 'งานอดิเรก', goal: 'เล่าเรื่องงานอดิเรกได้' });
    expect(out.gloss.stages.C.description).toContain('HSK 2');
    // Applying twice changes nothing.
    expect(JSON.stringify(applyPlan(plan, out.course, out.gloss).course)).toBe(JSON.stringify(out.course));
  });

  it('extends existing stages: more lessons in old units, new units in number order, old titles kept', () => {
    const course = {
      stages: [{ id: 'A', cefr: 'pre-A1', free: true, units: [{ id: 'zh-A1', lessons: ['zh-A1-01', 'zh-A1-02'] }] }],
    };
    const gloss = { stages: { A: { title: 'เริ่มต้น', description: 'เดิม' } }, units: { 'zh-A1': { title: 'ทักทาย' } } };
    const plan: Plan = {
      target: 'zh',
      stages: [
        {
          id: 'A',
          cefr: 'pre-A1',
          minutes: 6,
          units: [
            { id: 'zh-A10', title_th: 'สิบ', goal_th: 'g10', lessons: [{ id: 'zh-A10-01', topic: '', items: [] }] },
            { id: 'zh-A1', title_th: 'ใหม่', goal_th: 'g1', lessons: [{ id: 'zh-A1-03', topic: '', items: [] }] },
            { id: 'zh-A7', title_th: 'เจ็ด', goal_th: 'g7', lessons: [{ id: 'zh-A7-01', topic: '', items: [] }] },
          ],
        },
      ],
    };
    const out = applyPlan(plan, course, gloss);
    const a = out.course.stages[0];
    expect(a.free).toBe(true);
    expect(a.units.map((u: { id: string }) => u.id)).toEqual(['zh-A1', 'zh-A7', 'zh-A10']);
    expect(a.units[0].lessons).toEqual(['zh-A1-01', 'zh-A1-02', 'zh-A1-03']);
    expect(out.gloss.units['zh-A1']).toEqual({ title: 'ทักทาย', goal: 'g1' });
    expect(out.gloss.stages.A.description).toBe('เดิม');
  });
});
