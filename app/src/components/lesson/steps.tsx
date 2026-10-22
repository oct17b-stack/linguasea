import { kindGroup, type CourseBundle } from '@linguasea/contract';
import { answersWithText, type Choice, type Step } from '@linguasea/core';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ListenButtons, WordFace } from '@/components/lesson/word';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playItem, playLine } from '@/lib/audio';
import { useApp } from '@/state/app-state';

export { SpeakStep } from '@/components/lesson/speak';

type StepOf<K extends Step['kind']> = Extract<Step, { kind: K }>;

export function IntroStep({ step }: { step: StepOf<'intro'> }) {
  const { t } = useApp();
  return (
    <Card>
      <ThemedText type="subtitle">{step.title}</ThemedText>
      <ThemedText type="small">{t('lesson.minutes', { n: step.minutes })}</ThemedText>
      <ThemedText>{step.intro}</ThemedText>
    </Card>
  );
}

export function LearnStep({ step, course }: { step: StepOf<'learn'>; course: CourseBundle }) {
  const { t } = useApp();
  const { word } = step;
  useEffect(() => playItem(course, word), [course, word]);
  return (
    <Card style={styles.gapLarge}>
      <ThemedText type="smallBold">{t('step.learn')}</ThemedText>
      <WordFace word={word} />
      <ThemedText type="subtitle" style={[styles.centerText, styles.meaning]}>
        {word.meaning}
      </ThemedText>
      <ListenButtons onListen={(slow) => playItem(course, word, slow)} />
    </Card>
  );
}

export function DialogueStep({ step, course }: { step: StepOf<'dialogue'>; course: CourseBundle }) {
  const { t } = useApp();
  const c = useTheme();
  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold">{t('step.dialogue')}</ThemedText>
      {step.lines.map((line, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          onPress={() => playLine(course, line)}
          style={[
            styles.bubble,
            line.speaker === 'a' ? styles.left : styles.right,
            { backgroundColor: line.speaker === 'a' ? c.backgroundElement : c.successSoft },
          ]}>
          <ThemedText>🔊 {line.text}</ThemedText>
          <ThemedText type="small" style={{ color: c.textSecondary }}>
            {line.reading}
          </ThemedText>
          <ThemedText type="small">{line.meaning}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

export function NoteStep({ step }: { step: StepOf<'note'> }) {
  const { t } = useApp();
  return (
    <Card>
      <ThemedText type="smallBold">💡 {t('step.note')}</ThemedText>
      <ThemedText type="subtitle" style={styles.noteTitle}>
        {step.title}
      </ThemedText>
      <ThemedText>{step.body}</ThemedText>
    </Card>
  );
}

function questionKey(step: StepOf<'choose'>): string {
  switch (step.exercise) {
    case 'choose-meaning':
      return kindGroup(step.word.kind) === 'sound' ? 'step.chooseSound' : 'step.chooseMeaning';
    case 'listen-choose':
      return 'step.listenChoose';
    case 'choose-text':
      return 'step.chooseText';
    case 'listen-text':
      return 'step.listenText';
  }
}

export function ChooseStep({
  step,
  course,
  picked,
  onPick,
}: {
  step: StepOf<'choose'>;
  course: CourseBundle;
  picked?: string;
  onPick: (choice: Choice) => void;
}) {
  const { t } = useApp();
  const c = useTheme();
  const answered = picked !== undefined;
  const right = step.choices.find((x) => x.correct)!;
  const { word } = step;
  const heard = step.exercise !== 'choose-text';
  const textAnswers = answersWithText(step.exercise);

  useEffect(() => {
    if (heard) playItem(course, word);
  }, [heard, course, word]);

  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold">{t(questionKey(step))}</ThemedText>
      {step.exercise === 'choose-meaning' ? <WordFace word={word} /> : null}
      {step.exercise === 'choose-text' ? (
        <ThemedText type="subtitle" style={styles.centerText}>
          {step.prompt}
        </ThemedText>
      ) : null}
      {heard ? <ListenButtons onListen={(slow) => playItem(course, word, slow)} /> : null}
      {step.choices.map((choice) => {
        const state = !answered ? 'idle' : choice.correct ? 'right' : choice.id === picked ? 'wrong' : 'idle';
        return (
          <Pressable
            key={choice.id}
            accessibilityRole="button"
            disabled={answered}
            onPress={() => onPick(choice)}
            style={[
              styles.choice,
              {
                borderColor: state === 'right' ? c.success : state === 'wrong' ? c.danger : c.border,
                backgroundColor:
                  state === 'right' ? c.successSoft : state === 'wrong' ? c.dangerSoft : c.background,
              },
            ]}>
            <ThemedText style={textAnswers ? styles.choiceTarget : styles.choiceText}>{choice.label}</ThemedText>
          </Pressable>
        );
      })}
      {answered ? (
        <ThemedText type="smallBold" style={{ color: right.id === picked ? c.success : c.danger }}>
          {right.id === picked ? t('step.correct') : t('step.wrong', { answer: right.label })}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function DoneStep({ correct, total, xp }: { correct: number; total: number; xp: number }) {
  const { t } = useApp();
  const c = useTheme();
  return (
    <Card style={[styles.gapLarge, styles.center]}>
      <ThemedText type="subtitle" style={styles.centerText}>
        🎉 {t('done.title')}
      </ThemedText>
      <ThemedText style={styles.centerText}>{t('done.score', { correct, total })}</ThemedText>
      <ThemedText type="subtitle" style={[styles.centerText, { color: c.accent }]}>
        {t('done.xp', { n: xp })}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.two },
  gapLarge: { gap: Spacing.three },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  meaning: { fontSize: 26, lineHeight: 36 },
  noteTitle: { fontSize: 22, lineHeight: 30 },
  bubble: { maxWidth: '85%', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end' },
  choice: { borderWidth: 2, borderRadius: Spacing.three, padding: Spacing.three, minHeight: 56, justifyContent: 'center' },
  choiceText: { fontSize: 18, lineHeight: 26 },
  choiceTarget: { fontSize: 24, lineHeight: 34, textAlign: 'center' },
});
