import { describe, expect, it } from 'vitest';

import { lessonAccess, stageLessons } from './access';
import { emptyProgress, skipLessons } from './progress';
import { placementPassed, placementSteps } from './steps';
import { th } from './test-bundle';

describe('placement', () => {
  const course = th.courses.en!;

  it('asks about vocabulary from the stage only, spread over its units', () => {
    const stageA = new Set(stageLessons(course.course, 'A'));
    const steps = placementSteps(course, 'A', 12, 4);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.length).toBeLessThanOrEqual(12);
    for (const s of steps) {
      expect(s.kind).toBe('choose');
      if (s.kind !== 'choose') continue;
      expect(stageA.has(s.word.lesson)).toBe(true);
      expect(['word', 'phrase']).toContain(s.word.kind);
    }
    const ids = steps.map((s) => s.kind === 'choose' && s.word.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('passes at 80 %', () => {
    expect(placementPassed(8, 10)).toBe(true);
    expect(placementPassed(7, 10)).toBe(false);
    expect(placementPassed(0, 0)).toBe(false);
  });

  it('skipping a stage opens the next one', () => {
    const stageA = stageLessons(course.course, 'A');
    const firstB = stageLessons(course.course, 'B')[0];
    const p = skipLessons(emptyProgress(), stageA, new Date(2026, 9, 22));
    expect(Object.keys(p.completed)).toEqual(stageA);
    expect(p.cards).toEqual({});
    expect(lessonAccess(course.course, firstB, p.completed, true)).toBe('open');
  });
});
