import type { CourseBundle, Target } from '@linguasea/contract';
import { spoken, type Step } from '@linguasea/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ListenButtons, WordFace } from '@/components/lesson/word';
import { MicButton } from '@/components/mic-button';
import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useRecorder } from '@/hooks/use-recorder';
import { useTheme } from '@/hooks/use-theme';
import { apiEnabled, scorePronunciation, type PronunciationScore, type ScoreResult, type WordScore } from '@/lib/api';
import { playItem } from '@/lib/audio';
import { MAX_RECORDING_SECONDS } from '@/lib/recording';
import { discardRecording, recordingFile } from '@/lib/recording-file';
import { useApp } from '@/state/app-state';

type SpeakProps = { step: Extract<Step, { kind: 'speak' }>; course: CourseBundle };

/** The server said scoring is not configured (503): later speaking steps skip the microphone this session. */
let scoringOff = false;

/**
 * Listen, then say it. With a server the learner records (tap to start / tap to stop, at most
 * MAX_RECORDING_SECONDS) and gets a pronunciation score; without one, or when scoring is not
 * possible, it stays a self-check ("พูดได้แล้ว" moves on either way).
 */
export function SpeakStep({ step, course }: SpeakProps) {
  const { t } = useApp();
  const { word } = step;
  useEffect(() => playItem(course, word), [course, word]);
  return (
    <Card style={styles.gapLarge}>
      <ThemedText type="smallBold">🎙️ {t('step.speak')}</ThemedText>
      <WordFace word={word} />
      <ThemedText style={styles.centerText}>{word.meaning}</ThemedText>
      <ListenButtons onCard onListen={(slow) => playItem(course, word, slow)} />
      {apiEnabled && !scoringOff ? (
        <Scorer target={course.course.target} text={spoken(word)} />
      ) : (
        <ThemedText type="small" style={styles.centerText}>
          {t('step.speakHint')}
        </ThemedText>
      )}
    </Card>
  );
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'recording' }
  | { kind: 'scoring' }
  | { kind: 'scored'; score: PronunciationScore }
  | { kind: 'limit'; limit?: number }
  | { kind: 'fallback'; reason: 'offline' | 'unavailable' | 'permission' | 'failed' };

const FALLBACK_TEXT = {
  offline: 'speak.offline',
  unavailable: 'speak.unavailable',
  permission: 'speak.noPermission',
  failed: 'speak.failed',
} as const;

function Scorer({ target, text }: { target: Target; text: string }) {
  const { t, premium } = useApp();
  const c = useTheme();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const score = async (uri: string | null) => {
    setPhase({ kind: 'scoring' });
    let result: ScoreResult = { kind: 'failed' };
    if (uri) {
      try {
        result = await scorePronunciation({ target, text, audio: await recordingFile(uri) });
      } catch {}
      discardRecording(uri);
    }
    if (result.kind === 'unavailable') scoringOff = true;
    if (!alive.current) return;
    if (result.kind === 'scored') setPhase({ kind: 'scored', score: result.score });
    else if (result.kind === 'limit') setPhase({ kind: 'limit', limit: result.limit });
    else setPhase({ kind: 'fallback', reason: result.kind });
  };

  const recorder = useRecorder(MAX_RECORDING_SECONDS, (uri) => void score(uri));

  const press = async () => {
    if (phase.kind === 'recording') {
      setPhase({ kind: 'scoring' });
      await recorder.stop();
      return;
    }
    setPhase({ kind: 'starting' });
    const started = await recorder.start();
    if (!alive.current) return;
    if (started === 'denied') setPhase({ kind: 'fallback', reason: 'permission' });
    else if (started === 'failed') setPhase({ kind: 'fallback', reason: 'failed' });
    else setPhase({ kind: 'recording' });
  };

  const busy = phase.kind === 'starting' || phase.kind === 'scoring';
  const isRecording = phase.kind === 'recording';
  // Scoring is switched off on the server, or today's scorings are used up: no point recording again.
  const canRecord = phase.kind !== 'limit' && !(phase.kind === 'fallback' && phase.reason === 'unavailable');
  const caption = isRecording
    ? t('speak.tapToStop')
    : phase.kind === 'scoring'
      ? t('speak.scoring')
      : phase.kind === 'idle' || phase.kind === 'starting'
        ? t('speak.tapToStart')
        : t('speak.again');

  return (
    <View style={styles.scorer}>
      {phase.kind === 'scored' ? <ScoreView score={phase.score} /> : null}
      {phase.kind === 'limit' ? (
        <View style={styles.gap}>
          <ThemedText style={styles.centerText}>
            {phase.limit ? t('speak.limit', { n: phase.limit }) : t('speak.limitNoCount')}
          </ThemedText>
          {!premium ? (
            <>
              <ThemedText type="small" style={[styles.centerText, { color: c.textSecondary }]}>
                {t('speak.limitPremium')}
              </ThemedText>
              <Button
                variant="secondary"
                label={`👑 ${t('home.premium')}`}
                onPress={() => router.push('/paywall')}
                style={{ backgroundColor: c.background }}
              />
            </>
          ) : null}
        </View>
      ) : null}
      {phase.kind === 'fallback' ? (
        <ThemedText type="small" style={[styles.centerText, styles.notice, { backgroundColor: c.backgroundSelected }]}>
          {t(FALLBACK_TEXT[phase.reason])}
        </ThemedText>
      ) : null}

      {canRecord ? (
        <View style={styles.micArea}>
          <MicButton state={busy ? 'busy' : isRecording ? 'recording' : 'idle'} label={caption} onPress={() => void press()} />
          <ThemedText type="smallBold" style={styles.centerText}>
            {caption}
          </ThemedText>
          {isRecording ? (
            <View style={styles.meter}>
              <ProgressBar value={Math.min(1, recorder.elapsed / (MAX_RECORDING_SECONDS * 1000))} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type Band = 'great' | 'good' | 'low';

function band(score: number): Band {
  return score >= 80 ? 'great' : score >= 60 ? 'good' : 'low';
}

function useBandColors() {
  const c = useTheme();
  return {
    great: { fg: c.success, bg: c.successSoft },
    good: { fg: c.warning, bg: c.warningSoft },
    low: { fg: c.danger, bg: c.dangerSoft },
  } satisfies Record<Band, { fg: string; bg: string }>;
}

/** Said badly or not at all; prosody notes (breaks, monotone) alone do not count. */
function missed(w: WordScore): boolean {
  return w.error === 'Mispronunciation' || w.error === 'Omission' || w.accuracy < 60;
}

function ScoreView({ score }: { score: PronunciationScore }) {
  const { t } = useApp();
  const c = useTheme();
  const colors = useBandColors();

  if (score.status === 'no-speech') {
    return (
      <ThemedText type="small" style={[styles.centerText, styles.notice, { backgroundColor: c.backgroundSelected }]}>
        {t('speak.noSpeech')}
      </ThemedText>
    );
  }

  const b = band(score.overall);
  // Words the learner added are not part of what they were asked to say.
  const words = score.words.filter((w) => w.error !== 'Insertion');
  const anyMissed = words.some(missed);
  return (
    <View style={styles.result} accessibilityLiveRegion="polite">
      <View style={styles.scoreRow}>
        <View style={[styles.badge, { backgroundColor: colors[b].bg, borderColor: colors[b].fg }]}>
          <ThemedText style={[styles.badgeNumber, { color: colors[b].fg }]}>{score.overall}</ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText type="smallBold" style={[styles.verdict, { color: colors[b].fg }]}>
            {t(`speak.${b}`)}
          </ThemedText>
          <ThemedText type="small" style={{ color: c.textSecondary }}>
            {t('speak.score', { n: score.overall })}
          </ThemedText>
        </View>
      </View>
      {words.length ? (
        <View style={styles.words}>
          {words.map((w, i) => {
            const tone = missed(w) ? colors.low : colors[band(w.accuracy)];
            return (
              <View key={i} style={[styles.word, { backgroundColor: tone.bg, borderColor: tone.fg }]}>
                <ThemedText
                  style={[
                    styles.wordText,
                    { color: tone.fg },
                    w.error === 'Omission' ? styles.omitted : null,
                  ]}>
                  {w.word}
                </ThemedText>
              </View>
            );
          })}
        </View>
      ) : null}
      {anyMissed ? (
        <ThemedText type="small" style={[styles.centerText, { color: c.textSecondary }]}>
          {t('speak.missedHint')}
        </ThemedText>
      ) : null}
      {score.recognized ? (
        <ThemedText type="small" style={[styles.centerText, { color: c.textSecondary }]}>
          {t('speak.heard', { text: score.recognized })}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: Spacing.two },
  gapLarge: { gap: Spacing.three },
  centerText: { textAlign: 'center' },
  scorer: { gap: Spacing.three },
  notice: { borderRadius: Spacing.two, padding: Spacing.three, overflow: 'hidden' },
  micArea: { alignItems: 'center', gap: Spacing.two },
  meter: { alignSelf: 'stretch' },
  result: { gap: Spacing.two },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  badge: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  badgeNumber: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
  verdict: { fontSize: 20, lineHeight: 28 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'center' },
  word: { borderWidth: 1.5, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  wordText: { fontSize: 20, lineHeight: 28 },
  omitted: { textDecorationLine: 'line-through' },
});
