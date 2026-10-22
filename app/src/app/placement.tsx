import type { CourseBundle, Stage } from '@linguasea/contract';
import { placementPassed, placementSteps, stageLessons, type Step } from '@linguasea/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { StepView, useRunner } from '@/components/lesson/runner';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { courseBundle } from '@/content';
import { useTheme } from '@/hooks/use-theme';
import { stopAudio } from '@/lib/audio';
import { useApp } from '@/state/app-state';

/** Stages a placement test can skip (A free, B Premium content). */
const PLACEMENT_STAGES: Stage[] = ['A', 'B'];
/** Fewer questions than this cannot tell anything. */
const MIN_QUESTIONS = 4;

type Phase =
  | { kind: 'ask' }
  | { kind: 'quiz'; stage: Stage; steps: Step[] }
  | { kind: 'result'; stage: Stage; passed: boolean; correct: number; total: number }
  | { kind: 'nothing' };

function testable(course: CourseBundle, completed: Record<string, string>): Stage[] {
  return PLACEMENT_STAGES.filter((s) => {
    const lessons = stageLessons(course.course, s);
    return lessons.length > 0 && lessons.some((id) => !(id in completed));
  });
}

function quiz(course: CourseBundle, stage: Stage): Phase {
  const steps = placementSteps(course, stage);
  return steps.length >= MIN_QUESTIONS ? { kind: 'quiz', stage, steps } : { kind: 'nothing' };
}

/**
 * First visit to a course: "studied this before?" → start at A, or a short placement test per stage
 * (A, then B) that marks the stage's lessons done when passed. Also reachable from Settings (`?start=test`).
 */
export default function Placement() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  const { l1, target, progress, skipLessons, markPlaced, t } = useApp();
  const course = target ? courseBundle(l1, target) : undefined;
  const [phase, setPhase] = useState<Phase>(() => {
    if (!course || start !== 'test') return { kind: 'ask' };
    const next = testable(course, progress.completed)[0];
    return next ? quiz(course, next) : { kind: 'nothing' };
  });
  useEffect(() => stopAudio, []);
  if (!course || !target) return null;

  const finish = () => {
    markPlaced(target);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (phase.kind === 'ask') {
    return (
      <Screen>
        <ThemedText type="subtitle">{t('placement.ask', { language: course.gloss.name })}</ThemedText>
        <Option icon="🌱" title={t('placement.new')} body={t('placement.newBody')} onPress={finish} />
        <Option
          icon="📝"
          title={t('placement.some')}
          body={t('placement.someBody')}
          onPress={() => setPhase(quiz(course, 'A'))}
        />
      </Screen>
    );
  }

  if (phase.kind === 'quiz') {
    return (
      <Quiz
        key={phase.stage}
        course={course}
        stage={phase.stage}
        steps={phase.steps}
        onDone={(correct, total) => {
          const passed = placementPassed(correct, total);
          if (passed) skipLessons(stageLessons(course.course, phase.stage));
          setPhase({ kind: 'result', stage: phase.stage, passed, correct, total });
        }}
      />
    );
  }

  if (phase.kind === 'nothing') {
    return (
      <Screen footer={<Button label={t('placement.start')} onPress={finish} />}>
        <Card>
          <ThemedText>{t('placement.nothing')}</ThemedText>
        </Card>
      </Screen>
    );
  }

  // Result: passed A → B can be tested next (if there is a B to test).
  const nextStage = phase.passed ? PLACEMENT_STAGES[PLACEMENT_STAGES.indexOf(phase.stage) + 1] : undefined;
  const canTestNext = !!nextStage && stageLessons(course.course, nextStage).length > 0;
  const startAt = phase.passed ? (nextStage ?? phase.stage) : phase.stage;
  return (
    <Screen
      footer={
        <View style={styles.gap}>
          {canTestNext && nextStage ? (
            <Button label={t('placement.testNext', { stage: nextStage })} onPress={() => setPhase(quiz(course, nextStage))} />
          ) : null}
          <Button
            variant={canTestNext ? 'secondary' : 'primary'}
            label={t('placement.startAt', { stage: startAt })}
            onPress={finish}
          />
        </View>
      }>
      <Card style={styles.result}>
        <ThemedText type="subtitle" style={styles.center}>
          {phase.passed ? `🎉 ${t('placement.passed', { stage: phase.stage })}` : `🌱 ${t('placement.failed', { stage: phase.stage })}`}
        </ThemedText>
        <ThemedText style={styles.center}>{t('done.score', { correct: phase.correct, total: phase.total })}</ThemedText>
        <ThemedText style={styles.center}>
          {phase.passed ? t('placement.skipped', { stage: phase.stage }) : t('placement.startHere', { stage: phase.stage })}
        </ThemedText>
      </Card>
    </Screen>
  );
}

function Option({ icon, title, body, onPress }: { icon: string; title: string; body: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.option, { backgroundColor: c.backgroundElement, opacity: pressed ? 0.8 : 1 }]}>
      <ThemedText style={styles.optionIcon}>{icon}</ThemedText>
      <View style={styles.flex}>
        <ThemedText type="smallBold" style={styles.optionTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" style={{ color: c.textSecondary }}>
          {body}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function Quiz({
  course,
  stage,
  steps,
  onDone,
}: {
  course: CourseBundle;
  stage: Stage;
  steps: Step[];
  onDone: (correct: number, total: number) => void;
}) {
  const { t } = useApp();
  const run = useRunner(steps);
  const last = run.index === steps.length - 1;
  if (!run.step) return null;
  return (
    <Screen
      footer={
        <Button
          label={last ? t('placement.finish') : t('common.next')}
          disabled={!run.ready}
          onPress={() => (last ? onDone(run.score.correct, run.score.total) : run.next())}
        />
      }>
      <ThemedText type="smallBold">{t('placement.quizTitle', { stage, n: run.index + 1, total: steps.length })}</ThemedText>
      <ProgressBar value={run.index / steps.length} />
      <StepView step={run.step} index={run.index} course={course} picked={run.picked} onPick={run.pick} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.two },
  center: { textAlign: 'center' },
  result: { alignItems: 'center', gap: Spacing.three },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    minHeight: 72,
  },
  optionIcon: { fontSize: 32, lineHeight: 40 },
  optionTitle: { fontSize: 18, lineHeight: 26 },
});
