import type { CourseBundle } from '@linguasea/contract';
import {
  buildSteps,
  practiceSteps,
  STUDY_MINUTES,
  UNIT_TEST_PASS,
  unitTestPassed,
  unitTestSteps,
  XP_PER_CORRECT,
  XP_PER_LESSON,
  type PathNode,
  type Step,
} from '@linguasea/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/button';
import { StepView, useRunner } from '@/components/lesson/runner';
import { DoneStep } from '@/components/lesson/steps';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { courseBundle, targetOf } from '@/content';
import { preloadClips, stopAudio } from '@/lib/audio';
import { nodeTitle, pathNode, practiceNumber } from '@/lib/course-map';
import { useApp } from '@/state/app-state';

type T = (key: string, params?: Record<string, string | number>) => string;

/** The screens of one map node: a lesson or reader (its content), a practice session or a unit test (generated). */
function stepsFor(course: CourseBundle, node: PathNode, t: T): Step[] {
  const seed = Date.now(); // a fresh order every visit
  if (node.type === 'practice') {
    return [
      { kind: 'intro', title: t('path.practice', { n: practiceNumber(node.id) }), intro: t('practice.intro'), minutes: STUDY_MINUTES.practice },
      ...practiceSteps(course, node.id, seed),
    ];
  }
  if (node.type === 'test') {
    const unit = course.gloss.units[node.unitId]?.title ?? node.unitId;
    return [
      {
        kind: 'intro',
        title: `${nodeTitle(course, node, t)}: ${unit}`,
        intro: t('test.intro', { n: Math.round(UNIT_TEST_PASS * 100) }),
        minutes: STUDY_MINUTES.unitTest,
      },
      ...unitTestSteps(course, node.id, seed),
    ];
  }
  return buildSteps(course, node.id, seed);
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { l1 } = useApp();
  const course = courseBundle(l1, targetOf(id));
  const node = course ? pathNode(course.course, id) : undefined;
  // A failed unit test starts over with new questions.
  const [attempt, setAttempt] = useState(0);
  if (!course || !node) return null;
  return <Activity key={attempt} course={course} node={node} onRetry={() => setAttempt((a) => a + 1)} />;
}

function Activity({ course, node, onRetry }: { course: CourseBundle; node: PathNode; onRetry: () => void }) {
  const { finishLesson, recordTest, t } = useApp();
  const [steps] = useState(() => stepsFor(course, node, t));
  const run = useRunner(steps);
  const [outcome, setOutcome] = useState<{ passed: boolean; xp: number }>();

  // Clips of a lesson or reader start loading now; nothing keeps talking after leaving.
  useEffect(() => {
    const entry = course.lessons[node.id];
    if (entry) {
      const sentences = entry.lesson.passage.flat().map((s) => ({ text: s.text }));
      preloadClips(course, [...entry.lesson.items, ...sentences], entry.lesson.dialogue);
    }
    return stopAudio;
  }, [course, node]);

  const { step, index } = run;
  if (!step) return null;

  const next = () => {
    if (step.kind === 'done') {
      router.back();
      return;
    }
    if (steps[index + 1]?.kind === 'done') {
      const passed = node.type !== 'test' || unitTestPassed(run.score.correct, run.score.total);
      const known = Object.values(run.results).filter(Boolean).length;
      if (passed) finishLesson(node.id, run.results);
      else recordTest(run.results);
      setOutcome({ passed, xp: (passed ? XP_PER_LESSON : 0) + known * XP_PER_CORRECT });
    }
    run.next();
  };

  const label =
    step.kind === 'intro'
      ? t('step.start')
      : step.kind === 'speak'
        ? t('step.speakOk')
        : step.kind === 'done'
          ? t('done.back')
          : t('common.next');

  return (
    <Screen footer={<Button label={label} disabled={!run.ready} onPress={next} />}>
      <ProgressBar value={index / (steps.length - 1)} />
      {step.kind === 'done' ? (
        <DoneStep
          kind={node.type === 'reader' ? 'lesson' : node.type}
          passed={outcome?.passed}
          correct={run.score.correct}
          total={run.score.total}
          xp={outcome?.xp ?? 0}
          onRetry={outcome && !outcome.passed ? onRetry : undefined}
        />
      ) : (
        <StepView step={step} index={index} course={course} picked={run.picked} onPick={run.pick} />
      )}
    </Screen>
  );
}
