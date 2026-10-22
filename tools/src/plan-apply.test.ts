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
    // Applying twice replaces rather than duplicates.
    expect(applyPlan(plan, out.course, out.gloss).course.stages).toHaveLength(3);
  });
});
