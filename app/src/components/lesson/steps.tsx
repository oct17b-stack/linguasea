import { kindGroup, type CourseBundle } from '@linguasea/contract';
import { answersWithText, UNIT_TEST_PASS, type Choice, type Step } from '@linguasea/core';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ListenButtons, WordFace } from '@/components/lesson/word';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playItem, playLine, playSentence } from '@/lib/audio';
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
      <ListenButtons onCard onListen={(slow) => playItem(course, word, slow)} />
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

/** A reader's text: tap a sentence to hear it; reading always shown, translation on request. */
export function ReadStep({ step, course }: { step: StepOf<'read'>; course: CourseBundle }) {
  const { t } = useApp();
  const c = useTheme();
  const [meanings, setMeanings] = useState(false);
  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold">📖 {t('step.read')}</ThemedText>
      <ThemedText type="subtitle" style={styles.noteTitle}>
        {step.title}
      </ThemedText>
      <View style={styles.toggleRow}>
        <ThemedText type="small" style={[styles.flex, { color: c.textSecondary }]}>
          {t('step.readHint')}
        </ThemedText>
        <ThemedText type="smallBold">{t('step.showTranslation')}</ThemedText>
        <Switch
          accessibilityLabel={t('step.showTranslation')}
          value={meanings}
          onValueChange={setMeanings}
          trackColor={{ true: c.primary }}
        />
      </View>
      {step.paragraphs.map((paragraph, p) => (
        <Card key={p} style={styles.paragraph}>
          {paragraph.map((sentence, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={sentence.text}
              onPress={() => playSentence(course, sentence.text)}
              style={({ pressed }) => [styles.sentence, { opacity: pressed ? 0.6 : 1 }]}>
              <ThemedText style={styles.sentenceText}>{sentence.text}</ThemedText>
              <ThemedText type="small" style={{ color: c.textSecondary }}>
                {sentence.reading}
              </ThemedText>
              {meanings && sentence.meaning ? <ThemedText type="small">{sentence.meaning}</ThemedText> : null}
            </Pressable>
          ))}
        </Card>
      ))}
    </View>
  );
}

/** Answers of a question with right / wrong feedback once one is picked. */
function ChoiceList({
  choices,
  picked,
  onPick,
  large = false,
}: {
  choices: Choice[];
  picked?: string;
  onPick: (choice: Choice) => void;
  /** Target-language text answers get a bigger font. */
  large?: boolean;
}) {
  const { t } = useApp();
  const c = useTheme();
  const answered = picked !== undefined;
  const right = choices.find((x) => x.correct);
  return (
    <>
      {choices.map((choice) => {
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
                backgroundColor: state === 'right' ? c.successSoft : state === 'wrong' ? c.dangerSoft : c.background,
              },
            ]}>
            <ThemedText style={large ? styles.choiceTarget : styles.choiceText}>{choice.label}</ThemedText>
          </Pressable>
        );
      })}
      {answered && right ? (
        <ThemedText type="smallBold" style={{ color: right.id === picked ? c.success : c.danger }}>
          {right.id === picked ? t('step.correct') : t('step.wrong', { answer: right.label })}
        </ThemedText>
      ) : null}
    </>
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
  const { word } = step;
  const heard = step.exercise !== 'choose-text';

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
      <ChoiceList choices={step.choices} picked={picked} onPick={onPick} large={answersWithText(step.exercise)} />
    </View>
  );
}

/** Comprehension question about a reader, in the learner's language. */
export function QuestionStep({ step, picked, onPick }: { step: StepOf<'question'>; picked?: string; onPick: (choice: Choice) => void }) {
  const { t } = useApp();
  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold">❓ {t('step.question')}</ThemedText>
      <ThemedText type="subtitle" style={styles.prompt}>
        {step.prompt}
      </ThemedText>
      <ChoiceList choices={step.choices} picked={picked} onPick={onPick} />
    </View>
  );
}

/** Hear a whole sentence (in its speaker's voice), pick its meaning; the sentence is shown afterwards. */
export function LineStep({
  step,
  course,
  picked,
  onPick,
}: {
  step: StepOf<'line'>;
  course: CourseBundle;
  picked?: string;
  onPick: (choice: Choice) => void;
}) {
  const { t } = useApp();
  const c = useTheme();
  const { line } = step;
  useEffect(() => playLine(course, line), [course, line]);
  return (
    <View style={styles.gap}>
      <ThemedText type="smallBold">{t('step.line')}</ThemedText>
      <ListenButtons onListen={(slow) => playLine(course, line, slow)} />
      {picked !== undefined ? (
        <Card style={styles.reveal}>
          <ThemedText style={styles.sentenceText}>{line.text}</ThemedText>
          <ThemedText type="small" style={{ color: c.textSecondary }}>
            {line.reading}
          </ThemedText>
        </Card>
      ) : null}
      <ChoiceList choices={step.choices} picked={picked} onPick={onPick} />
    </View>
  );
}

export type DoneKind = 'lesson' | 'practice' | 'test';

export function DoneStep({
  kind,
  passed = true,
  correct,
  total,
  xp,
  onRetry,
}: {
  kind: DoneKind;
  /** Unit tests only. */
  passed?: boolean;
  correct: number;
  total: number;
  xp: number;
  onRetry?: () => void;
}) {
  const { t } = useApp();
  const c = useTheme();
  const title =
    kind === 'test'
      ? passed
        ? `🏅 ${t('done.testPassed')}`
        : `🌱 ${t('done.testFailed')}`
      : kind === 'practice'
        ? `💪 ${t('done.practiceTitle')}`
        : `🎉 ${t('done.title')}`;
  return (
    <Card style={[styles.gapLarge, styles.center]}>
      <ThemedText type="subtitle" style={styles.centerText}>
        {title}
      </ThemedText>
      <ThemedText style={styles.centerText}>{t('done.score', { correct, total })}</ThemedText>
      {kind === 'test' && !passed ? (
        <ThemedText style={[styles.centerText, { color: c.textSecondary }]}>
          {t('done.testFailedHint', { n: Math.ceil(total * UNIT_TEST_PASS) })}
        </ThemedText>
      ) : null}
      <ThemedText type="subtitle" style={[styles.centerText, { color: c.accent }]}>
        {t('done.xp', { n: xp })}
      </ThemedText>
      {onRetry ? <Button label={t('done.retry')} onPress={onRetry} style={styles.retry} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.two },
  gapLarge: { gap: Spacing.three },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  meaning: { fontSize: 26, lineHeight: 36 },
  noteTitle: { fontSize: 22, lineHeight: 30 },
  prompt: { fontSize: 22, lineHeight: 32 },
  bubble: { maxWidth: '85%', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44 },
  paragraph: { gap: Spacing.one },
  sentence: { paddingVertical: Spacing.two, gap: Spacing.half, minHeight: 44 },
  sentenceText: { fontSize: 22, lineHeight: 32 },
  reveal: { alignItems: 'center', gap: Spacing.half },
  choice: { borderWidth: 2, borderRadius: Spacing.three, padding: Spacing.three, minHeight: 56, justifyContent: 'center' },
  choiceText: { fontSize: 18, lineHeight: 26 },
  choiceTarget: { fontSize: 24, lineHeight: 34, textAlign: 'center' },
  retry: { alignSelf: 'stretch' },
});
