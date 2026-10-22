import { kindGroup } from '@linguasea/contract';
import { answersWithText, spoken, type Choice, type Step, type Word } from '@linguasea/core';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { say } from '@/lib/speech';
import { useApp } from '@/state/app-state';

type StepOf<K extends Step['kind']> = Extract<Step, { kind: K }>;

/** Listen / listen slowly. `text` is what TTS reads (item.say when the written form is not speakable). */
function ListenButtons({ text, voice }: { text: string; voice: string }) {
  const { t } = useApp();
  return (
    <View style={styles.row}>
      <Button variant="secondary" label={`🔊 ${t('common.listen')}`} onPress={() => say(text, voice)} style={styles.flex} />
      <Button variant="secondary" label={`🐢 ${t('common.listenSlow')}`} onPress={() => say(text, voice, true)} style={styles.flex} />
    </View>
  );
}

/** Target text with its romanization and the learner-script spelling under it. */
function WordFace({ word, big = true }: { word: Word; big?: boolean }) {
  const c = useTheme();
  return (
    <View style={styles.center}>
      <ThemedText type={big ? 'subtitle' : 'default'} style={styles.centerText}>
        {word.text}
      </ThemedText>
      <ThemedText style={[styles.centerText, { color: c.textSecondary }]}>{word.reading}</ThemedText>
      {word.translit ? (
        <ThemedText type="small" style={[styles.centerText, { color: c.textSecondary }]}>
          ({word.translit})
        </ThemedText>
      ) : null}
    </View>
  );
}

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

export function LearnStep({ step, voice }: { step: StepOf<'learn'>; voice: string }) {
  const { t } = useApp();
  const text = spoken(step.word);
  useEffect(() => say(text, voice), [text, voice]);
  return (
    <Card style={styles.gapLarge}>
      <ThemedText type="smallBold">{t('step.learn')}</ThemedText>
      <WordFace word={step.word} />
      <ThemedText type="subtitle" style={[styles.centerText, styles.meaning]}>
        {step.word.meaning}
      </ThemedText>
      <ListenButtons text={text} voice={voice} />
    </Card>
  );
}

export function DialogueStep({ step, voice }: { step: StepOf<'dialogue'>; voice: string }) {
  const { t } = useApp();
  const c = useTheme();
  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold">{t('step.dialogue')}</ThemedText>
      {step.lines.map((line, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          onPress={() => say(line.text, voice)}
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
  voice,
  picked,
  onPick,
}: {
  step: StepOf<'choose'>;
  voice: string;
  picked?: string;
  onPick: (choice: Choice) => void;
}) {
  const { t } = useApp();
  const c = useTheme();
  const answered = picked !== undefined;
  const right = step.choices.find((x) => x.correct)!;
  const text = spoken(step.word);
  const heard = step.exercise !== 'choose-text';
  const textAnswers = answersWithText(step.exercise);

  useEffect(() => {
    if (heard) say(text, voice);
  }, [heard, text, voice]);

  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold">{t(questionKey(step))}</ThemedText>
      {step.exercise === 'choose-meaning' ? <WordFace word={step.word} /> : null}
      {step.exercise === 'choose-text' ? (
        <ThemedText type="subtitle" style={styles.centerText}>
          {step.prompt}
        </ThemedText>
      ) : null}
      {heard ? <ListenButtons text={text} voice={voice} /> : null}
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

export function SpeakStep({ step, voice }: { step: StepOf<'speak'>; voice: string }) {
  const { t } = useApp();
  const text = spoken(step.word);
  useEffect(() => say(text, voice), [text, voice]);
  return (
    <Card style={styles.gapLarge}>
      <ThemedText type="smallBold">🎙️ {t('step.speak')}</ThemedText>
      <WordFace word={step.word} />
      <ThemedText style={styles.centerText}>{step.word.meaning}</ThemedText>
      <ListenButtons text={text} voice={voice} />
      <ThemedText type="small" style={styles.centerText}>
        {t('step.speakHint')}
      </ThemedText>
    </Card>
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
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
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
