// Exhaustive checks of the engine against all real content: every lesson, reader, practice session,
// unit test and placement quiz of a course, over several seeds. Each course runs from its own test file
// (content.<target>.test.ts) so the four run in parallel.
import { lessonExercises, sameReading, type CourseBundle } from '@linguasea/contract';
import { describe, expect, it } from 'vitest';

import { lessonAccess, lessonOrder, stageLessons } from './access';
import { estimateHours, STUDY_MINUTES } from './hours';
import { coursePath, nodeAccess, PRACTICE_EVERY, practiceId, unitTestId } from './path';
import { coursePool, labelKey, spoken } from './pool';
import { practiceSteps, unitTestSteps } from './practice';
import { emptyProgress, skipLessons } from './progress';
import { buildSteps, placementSteps, reviewSteps, type Step } from './steps';
import { th } from './test-bundle';

const SEEDS = [1, 0xffffffff, 4242];
const byEar = (t: string) => t === 'listen-choose' || t === 'listen-text';

/** Position of each lesson in the course (1-based, the same count as Word.order). */
function positions(course: CourseBundle): Map<string, number> {
  return new Map(lessonOrder(course.course).map((id, i) => [id, i + 1]));
}

/**
 * Checks every question of a run of steps. `upTo` is the last course position the learner has reached;
 * `listed` holds "type item" of exercises whose wrong answers the lesson itself names (these may be
 * fewer than 4 and are chosen by the writer).
 */
function checkSteps(
  where: string,
  course: CourseBundle,
  steps: Step[],
  upTo: number,
  listed = new Set<string>(),
): string[] {
  const pool = coursePool(course);
  const bad: string[] = [];
  const fail = (ok: boolean, msg: string) => {
    if (!ok) bad.push(`${where}: ${msg}`);
  };
  fail(steps.at(-1)?.kind === 'done', 'does not end with done');
  for (const s of steps) {
    if (s.kind === 'learn') fail(s.word.order <= upTo, `learns ${s.word.id} before it is taught`);
    if (s.kind !== 'choose' && s.kind !== 'question' && s.kind !== 'line') continue;
    const at = `${s.kind}${s.kind === 'choose' ? ` ${s.exercise} ${s.word.id}` : ''}`;
    const labels = s.choices.map((c) => c.label).join(' | ');
    // Exactly one right answer, and the grader (choice.correct) accepts it.
    fail(s.choices.filter((c) => c.correct).length === 1, `${at} has not exactly one right answer`);
    fail(s.choices.length >= 2, `${at} has ${s.choices.length} choices`);
    fail(new Set(s.choices.map((c) => c.id)).size === s.choices.length, `${at} repeats a choice id`);
    fail(
      s.choices.every((c) => c.label.trim() !== ''),
      `${at} has an empty answer`,
    );
    // No two answers a learner cannot tell apart (case, spacing, punctuation, full-width forms).
    fail(
      new Set(s.choices.map((c) => labelKey(c.label))).size === s.choices.length,
      `${at} has look-alike answers: ${labels}`,
    );
    if (s.kind === 'question') fail(s.prompt.trim() !== '', `${at} has an empty prompt`);
    if (s.kind === 'line') {
      fail(s.choices.find((c) => c.correct)?.label === s.line.meaning, `${at} marks the wrong meaning`);
      fail(s.line.text.trim() !== '', `${at} has no sentence`);
    }
    if (s.kind !== 'choose') continue;
    const listedHere = listed.has(`${s.exercise} ${s.word.id}`);
    if (!listedHere) fail(s.choices.length === 4, `${at} has ${s.choices.length} choices`);
    fail(s.choices.find((c) => c.correct)?.id === s.word.id, `${at} marks another item right`);
    if (!byEar(s.exercise)) fail(s.prompt.trim() !== '', `${at} has an empty prompt`);
    // Never a question about something not taught yet.
    fail(s.word.order <= upTo, `${at} asks about an item not taught yet`);
    for (const c of s.choices) {
      if (c.correct) continue;
      const o = pool.get(c.id);
      if (!o) {
        fail(false, `${at} offers unknown ${c.id}`);
        continue;
      }
      // Generated wrong answers come from what was already taught (the real courses always have enough).
      if (!listedHere) fail(o.order <= upTo, `${at} offers ${o.id}, not taught yet`);
      if (byEar(s.exercise)) {
        fail(
          !sameReading(o.reading, s.word.reading) && spoken(o) !== spoken(s.word),
          `${at} offers ${o.id}, which sounds the same`,
        );
      }
      if (s.exercise === 'choose-meaning')
        fail(labelKey(o.text) !== labelKey(s.word.text), `${at} offers ${o.id}, written the same`);
      if (s.exercise === 'choose-text')
        fail(labelKey(o.meaning) !== labelKey(s.word.meaning), `${at} offers ${o.id}, same meaning`);
    }
  }
  return bad;
}

export function checkCourse(target: string) {
  const course = th.courses[target as keyof typeof th.courses] as CourseBundle;
  describe(`${target}: every activity of the real course`, () => {
    const pos = positions(course);
    const path = coursePath(course.course);

    it('every lesson and reader builds for several seeds, with sound questions', () => {
      const bad: string[] = [];
      for (const id of lessonOrder(course.course)) {
        const entry = course.lessons[id];
        expect(entry, id).toBeDefined();
        const listed = new Set(
          lessonExercises(entry.lesson)
            .filter((e) => 'options' in e && e.options)
            .map((e) => `${e.type} ${e.item}`),
        );
        for (const seed of [undefined, ...SEEDS.slice(0, 3)]) {
          const steps = buildSteps(course, id, seed);
          bad.push(...checkSteps(`${id}#${seed}`, course, steps, pos.get(id)!, listed));
          expect(steps.filter((s) => s.kind === 'learn')).toHaveLength(entry.lesson.items.length);
          if (entry.lesson.kind === 'reader') {
            expect(
              steps.some((s) => s.kind === 'read'),
              id,
            ).toBe(true);
            expect(
              steps.filter((s) => s.kind === 'question'),
              id,
            ).toHaveLength(entry.lesson.questions.length);
          }
        }
      }
      expect(bad).toEqual([]);
    }, 120_000);

    it('every practice session and unit test builds for several seeds, asking only what was taught', () => {
      const bad: string[] = [];
      const listed = new Set<string>();
      for (const e of Object.values(course.lessons))
        for (const x of lessonExercises(e.lesson)) if ('options' in x && x.options) listed.add(`${x.type} ${x.item}`);
      for (const node of path) {
        if (node.type !== 'practice' && node.type !== 'test') continue;
        const upTo = Math.max(...node.covers.map((id) => pos.get(id)!));
        const covered = new Set(node.covers);
        for (const seed of SEEDS) {
          const steps =
            node.type === 'practice' ? practiceSteps(course, node.id, seed) : unitTestSteps(course, node.id, seed);
          // Sound items are asked by ear with the lesson's own wrong answers (see recallQuestion).
          bad.push(...checkSteps(`${node.id}#${seed}`, course, steps, upTo, listed));
          const asked = steps.filter((s) => s.kind === 'choose');
          expect(asked.length, node.id).toBeGreaterThanOrEqual(3);
          if (node.type === 'test') {
            expect(asked.length, node.id).toBeLessThanOrEqual(15);
            for (const s of asked) expect(covered.has(s.word.lesson), `${node.id} ${s.word.id}`).toBe(true);
          }
          const ids = asked.map((s) => s.word.id);
          expect(new Set(ids).size, node.id).toBe(ids.length);
        }
      }
      expect(bad).toEqual([]);
    }, 120_000);

    it('reviews every item, alone and all at once', { timeout: 60_000 }, () => {
      const pool = coursePool(course);
      const all = [...pool.keys()];
      const listed = new Set<string>();
      for (const e of Object.values(course.lessons))
        for (const x of lessonExercises(e.lesson)) if ('options' in x && x.options) listed.add(`${x.type} ${x.item}`);
      const steps = reviewSteps(course, all, 9);
      expect(steps).toHaveLength(all.length);
      expect(checkSteps('review-all', course, [...steps, { kind: 'done' }], Infinity, listed)).toEqual([]);
      for (const id of all) {
        const one = reviewSteps(course, [id], 3);
        expect(one, id).toHaveLength(1);
        const s = one[0];
        if (s.kind !== 'choose') throw new Error(id);
        expect(s.choices.filter((c) => c.correct).map((c) => c.id)).toEqual([id]);
      }
    });

    it('every stage has a placement quiz of its own vocabulary with one right answer each', () => {
      for (const stage of course.course.stages) {
        const inStage = new Set(stageLessons(course.course, stage.id));
        for (const seed of SEEDS) {
          const steps = placementSteps(course, stage.id, 16, seed);
          expect(steps.length, stage.id).toBe(16);
          expect(checkSteps(`placement ${stage.id}#${seed}`, course, [...steps, { kind: 'done' }], Infinity)).toEqual(
            [],
          );
          for (const s of steps) {
            if (s.kind !== 'choose') throw new Error('placement asks choices only');
            expect(inStage.has(s.word.lesson)).toBe(true);
            expect(['word', 'phrase']).toContain(s.word.kind);
          }
        }
      }
      expect(placementSteps(course, 'Z' as never, 16, 1)).toEqual([]);
    });
  });

  describe(`${target}: course path`, () => {
    const path = coursePath(course.course);
    const order = lessonOrder(course.course);

    it('holds every lesson once, in order, with practice after every 2 and a test closing each unit', () => {
      const lessonNodes = path.filter((n) => n.type === 'lesson' || n.type === 'reader');
      expect(lessonNodes.map((n) => n.id)).toEqual(order);
      expect(new Set(path.map((n) => n.id)).size).toBe(path.length);
      for (const n of lessonNodes)
        expect(n.type === 'reader', n.id).toBe(course.lessons[n.id].lesson.kind === 'reader');
      for (const stage of course.course.stages) {
        for (const unit of stage.units) {
          const nodes = path.filter((n) => n.unitId === unit.id);
          expect(nodes.every((n) => n.stage === stage.id)).toBe(true);
          expect(nodes.at(-1)).toMatchObject({ type: 'test', id: unitTestId(unit.id), covers: unit.lessons });
          const practices = nodes.filter((n) => n.type === 'practice');
          expect(practices).toHaveLength(Math.floor(unit.lessons.length / PRACTICE_EVERY));
          practices.forEach((p, k) => {
            expect(p.id).toBe(practiceId(unit.id, k + 1));
            if (!('covers' in p)) throw new Error(p.id);
            expect(p.covers).toEqual(unit.lessons.slice(k * 2, k * 2 + 2));
            // Right after the second lesson it covers.
            const i = nodes.indexOf(p);
            expect(nodes[i - 1].id).toBe(p.covers[1]);
          });
        }
      }
    });

    it('opens one step at a time when walked in order; progress only grows and ends at 100 %', () => {
      const completed: Record<string, string> = {};
      const lessonsTotal = order.length;
      const fraction = (ids: string[]) => ids.filter((id) => id in completed).length / ids.length;
      let last = { course: 0, stage: new Map<string, number>(), unit: new Map<string, number>() };
      const lessonIdx = new Map(order.map((id, i) => [id, i]));
      for (const node of path) {
        expect(nodeAccess(course.course, node, completed, true), node.id).toBe('open');
        if (node.type === 'lesson' || node.type === 'reader') {
          const next = order[lessonIdx.get(node.id)! + 1];
          if (next) expect(lessonAccess(course.course, next, completed, true), next).toBe('locked');
        }
        completed[node.id] = 'done';
        const c = fraction(order);
        expect(c).toBeGreaterThanOrEqual(last.course);
        expect(c).toBeLessThanOrEqual(1);
        last.course = c;
        const st = stageLessons(course.course, node.stage);
        const s = fraction(st);
        expect(s).toBeGreaterThanOrEqual(last.stage.get(node.stage) ?? 0);
        last.stage.set(node.stage, s);
        const unit = course.course.stages.flatMap((x) => x.units).find((u) => u.id === node.unitId)!;
        const u = fraction(unit.lessons);
        expect(u).toBeGreaterThanOrEqual(last.unit.get(unit.id) ?? 0);
        last.unit.set(unit.id, u);
      }
      expect(Object.keys(completed).filter((id) => lessonIdx.has(id))).toHaveLength(lessonsTotal);
      expect(fraction(order)).toBe(1);
      void last;
    });

    it('keeps practice and tests locked until what they cover is done, and asks for Premium on paid stages', () => {
      for (const node of path) {
        if (!('covers' in node)) continue;
        const allButLast = Object.fromEntries(node.covers.slice(0, -1).map((id) => [id, 'done']));
        expect(nodeAccess(course.course, node, allButLast, true), node.id).toBe('locked');
        const free = course.course.stages.find((s) => s.id === node.stage)!.free;
        const all = Object.fromEntries(node.covers.map((id) => [id, 'done']));
        expect(nodeAccess(course.course, node, all, false), node.id).toBe(free ? 'open' : 'premium');
      }
      // Without Premium, every free lesson can be reached and every paid one is behind the paywall.
      const done: Record<string, string> = {};
      for (const id of order) {
        const free = course.course.stages.find((s) => s.units.some((u) => u.lessons.includes(id)))!.free;
        expect(lessonAccess(course.course, id, done, false), id).toBe(free ? 'open' : 'premium');
        done[id] = 'done';
      }
    });

    it('placement: passing stages A..X opens the first lesson after them and every node before', () => {
      const now = new Date(2026, 9, 25, 10);
      let p = emptyProgress();
      const stages = course.course.stages;
      stages.forEach((stage, i) => {
        p = skipLessons(p, stageLessons(course.course, stage.id), now);
        expect(p.cards).toEqual({});
        const nextStage = stages[i + 1];
        if (nextStage) {
          const first = stageLessons(course.course, nextStage.id)[0];
          expect(lessonAccess(course.course, first, p.completed, true)).toBe('open');
          expect(lessonAccess(course.course, stageLessons(course.course, nextStage.id)[1], p.completed, true)).toBe(
            'locked',
          );
        }
        // Nothing of a passed stage stays locked.
        for (const node of path.filter((n) => stages.slice(0, i + 1).some((s) => s.id === n.stage)))
          expect(nodeAccess(course.course, node, p.completed, true), node.id).toBe('open');
      });
      // Skipping does not overwrite when a lesson was really finished.
      const real = { ...emptyProgress(), completed: { [order[0]]: '2020-01-01T00:00:00.000Z' } };
      expect(skipLessons(real, [order[0]], now).completed[order[0]]).toBe('2020-01-01T00:00:00.000Z');
    });

    it('estimates hours as docs/CONTENT.md §6 says, at least 200 h a course', () => {
      const { stages, hours } = estimateHours(course);
      let total = 0;
      for (const stage of course.course.stages) {
        const ids = stage.units.flatMap((u) => u.lessons);
        const minutes = (kind: string) =>
          ids
            .filter((id) => course.lessons[id].lesson.kind === kind)
            .reduce((s, id) => s + course.lessons[id].lesson.minutes, 0);
        const practice = stage.units.reduce((s, u) => s + Math.floor(u.lessons.length / 2), 0) * STUDY_MINUTES.practice;
        const base = minutes('lesson') + minutes('reader') + practice;
        const m = base + stage.units.length * (STUDY_MINUTES.unitTest + STUDY_MINUTES.tutor) + Math.round(base * 0.15);
        const row = stages.find((s) => s.stage === stage.id)!;
        expect(Math.abs(row.hours - m / 60), stage.id).toBeLessThanOrEqual(0.05 + 1e-9);
        total += m / 60;
      }
      // Course total = sum of the rounded stage figures, so it stays within rounding of the exact total.
      expect(Math.abs(hours - total)).toBeLessThanOrEqual(0.05 * stages.length + 0.05);
      expect(hours).toBeGreaterThanOrEqual(200);
    });
  });
}
