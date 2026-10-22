import { XP_PER_CORRECT, XP_PER_LESSON, buildSteps, type Choice } from '@linguasea/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import {
  ChooseStep,
  DialogueStep,
  DoneStep,
  IntroStep,
  LearnStep,
  NoteStep,
  SpeakStep,
} from '@/components/lesson/steps';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { courseBundle, targetOf } from '@/content';
import { useApp } from '@/state/app-state';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { l1, finishLesson, t } = useApp();
  const course = courseBundle(l1, targetOf(id));
  // A fresh seed per visit so choice order changes when a lesson is repeated.
  const [steps] = useState(() => (course?.lessons[id] ? buildSteps(course, id, Date.now()) : []));
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});

  if (!course || !steps.length) return null;
  const voice = course.course.voice;
  const step = steps[index];
  const asked = Object.keys(results).length;
  const correct = Object.values(results).filter(Boolean).length;

  const pick = (choice: Choice) => {
    if (step.kind !== 'choose' || picks[index] !== undefined) return;
    setPicks((p) => ({ ...p, [index]: choice.id }));
    // A word counts as known only if every question about it was right.
    setResults((r) => ({ ...r, [step.word.id]: (r[step.word.id] ?? true) && choice.correct }));
  };

  const next = () => {
    if (step.kind === 'done') {
      router.back();
      return;
    }
    if (steps[index + 1]?.kind === 'done') finishLesson(id, results);
    setIndex(index + 1);
  };

  const label =
    step.kind === 'intro' ? t('step.start') : step.kind === 'speak' ? t('step.speakOk') : step.kind === 'done' ? t('done.back') : t('common.next');

  return (
    <Screen
      footer={
        <Button label={label} disabled={step.kind === 'choose' && picks[index] === undefined} onPress={next} />
      }>
      <ProgressBar value={index / (steps.length - 1)} />
      {step.kind === 'intro' ? <IntroStep step={step} /> : null}
      {step.kind === 'learn' ? <LearnStep key={index} step={step} voice={voice} /> : null}
      {step.kind === 'dialogue' ? <DialogueStep step={step} voice={voice} /> : null}
      {step.kind === 'note' ? <NoteStep step={step} /> : null}
      {step.kind === 'choose' ? (
        <ChooseStep key={index} step={step} voice={voice} picked={picks[index]} onPick={pick} />
      ) : null}
      {step.kind === 'speak' ? <SpeakStep key={index} step={step} voice={voice} /> : null}
      {step.kind === 'done' ? (
        <DoneStep correct={correct} total={asked} xp={XP_PER_LESSON + correct * XP_PER_CORRECT} />
      ) : null}
    </Screen>
  );
}
