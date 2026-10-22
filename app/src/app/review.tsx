import { dueItems, reviewSteps, type Choice } from '@linguasea/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ChooseStep } from '@/components/lesson/steps';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { stopAudio } from '@/lib/audio';
import { useApp } from '@/state/app-state';

/** At most this many cards per session keeps review short enough to do daily. */
const SESSION = 20;

export default function Review() {
  const { target, course, progress, reviewed, t } = useApp();
  // Fixed for the session: grading a card must not reshuffle the remaining questions.
  const [steps] = useState(() =>
    course && target ? reviewSteps(course, dueItems(progress, new Date(), `${target}.`).slice(0, SESSION)) : [],
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string>();
  useEffect(() => stopAudio, []);

  if (!course) return null;
  const step = steps[index];

  if (!step || step.kind !== 'choose') {
    return (
      <Screen footer={<Button label={t('done.back')} onPress={() => router.back()} />}>
        <Card>
          <ThemedText>{t('review.empty')}</ThemedText>
        </Card>
      </Screen>
    );
  }

  const pick = (choice: Choice) => {
    if (picked !== undefined) return;
    setPicked(choice.id);
    reviewed(step.word.id, choice.correct);
  };

  return (
    <Screen
      footer={
        <Button
          label={t('common.next')}
          disabled={picked === undefined}
          onPress={() => {
            setPicked(undefined);
            setIndex(index + 1);
          }}
        />
      }>
      <ProgressBar value={index / steps.length} />
      <ChooseStep key={index} step={step} course={course} picked={picked} onPick={pick} />
    </Screen>
  );
}
