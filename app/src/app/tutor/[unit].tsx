import type { CourseBundle, Target } from '@linguasea/contract';
import Constants from 'expo-constants';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { MicButton } from '@/components/mic-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { courseBundle } from '@/content';
import { useRecorder } from '@/hooks/use-recorder';
import { useTheme } from '@/hooks/use-theme';
import { legalUrl, transcribe, TUTOR_LINE_MAX, tutorTurn, type TutorLine, type TutorTurn } from '@/lib/api';
import { stopAudio } from '@/lib/audio';
import { SUPPORT_EMAIL } from '@/lib/config';
import { openPage } from '@/lib/open-page';
import { discardRecording, recordingFile } from '@/lib/recording-file';
import { say } from '@/lib/speech';
import { useApp } from '@/state/app-state';

/** A spoken answer to the tutor may be a little longer than a pronunciation take. */
const VOICE_ANSWER_SECONDS = 15;

/** Section 3.5 (AI tutor) of the privacy policy, as anchored on the published pages. */
const PRIVACY_SECTION = { th: '35-บทสนทนากับครู-ai', en: '35-ai-tutor-conversations' } as const;

/**
 * AI conversation partner for one unit (Premium; free accounts get a few turns a day, counted by
 * the server). The conversation lives only in this screen's memory. Consent is asked once, first.
 */
export default function TutorScreen() {
  const { unit } = useLocalSearchParams<{ unit: string }>();
  const { l1, target, tutorConsent, t } = useApp();
  const course = target ? courseBundle(l1, target) : undefined;
  if (!course || !target || !course.course.stages.some((s) => s.units.some((u) => u.id === unit))) return null;
  const title = course.gloss.units[unit]?.title ?? unit;
  return (
    <>
      <Stack.Screen options={{ title: `${t('tutor.title')} · ${title}` }} />
      {tutorConsent === 'agreed' ? <Chat course={course} target={target} unitId={unit} /> : <Consent />}
    </>
  );
}

/** One-time consent (Apple 5.1.2(i)); wording follows the privacy policy, section 3.5. */
function Consent() {
  const { l1, setTutorConsent, t } = useApp();
  const c = useTheme();
  const lang = l1 === 'th' ? 'th' : 'en';
  const policy = legalUrl('privacy', lang, PRIVACY_SECTION[lang]);
  const points = ['sent', 'masked', 'anthropic', 'notStored', 'personal', 'report'];
  return (
    <Screen
      footer={
        <View style={styles.gap}>
          <Button label={t('tutor.consent.agree')} onPress={() => setTutorConsent('agreed')} />
          <Button
            variant="secondary"
            label={t('tutor.consent.later')}
            onPress={() => {
              setTutorConsent('declined');
              router.back();
            }}
          />
        </View>
      }>
      <ThemedText type="subtitle" style={styles.consentTitle}>
        🤖 {t('tutor.consent.title')}
      </ThemedText>
      <ThemedText>{t('tutor.consent.intro')}</ThemedText>
      <Card>
        {points.map((p) => (
          <View key={p} style={styles.point}>
            <ThemedText>•</ThemedText>
            <ThemedText style={styles.flex}>{t(`tutor.consent.${p}`)}</ThemedText>
          </View>
        ))}
      </Card>
      {policy ? (
        <Pressable accessibilityRole="link" onPress={() => void openPage(policy)} style={styles.link}>
          <ThemedText type="linkPrimary">{t('tutor.consent.policy')}</ThemedText>
        </Pressable>
      ) : null}
      <ThemedText type="small" style={{ color: c.textSecondary }}>
        {t('tutor.consent.withdraw')}
      </ThemedText>
    </Screen>
  );
}

type Entry =
  | { id: number; role: 'tutor'; turn: TutorTurn }
  | { id: number; role: 'learner'; text: string; feedback?: string; correction?: string };

type Status =
  | { kind: 'waiting' }
  | { kind: 'ready' }
  | { kind: 'done' }
  /** The model declined to continue (empty reply). */
  | { kind: 'declined' }
  | { kind: 'limit'; limit?: number }
  | { kind: 'unavailable' }
  | { kind: 'offline' }
  | { kind: 'failed' };

function Chat({ course, target, unitId }: { course: CourseBundle; target: Target; unitId: string }) {
  const { l1, premium, t } = useApp();
  const c = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'waiting' });
  const [input, setInput] = useState('');
  const [hint, setHint] = useState(false);
  const [voice, setVoice] = useState<'idle' | 'starting' | 'recording' | 'transcribing'>('idle');
  const [voiceNote, setVoiceNote] = useState<string>();
  const [voiceOff, setVoiceOff] = useState(false);
  const nextId = useRef(0);
  const list = useRef<FlatList<Entry>>(null);
  const alive = useRef(true);
  /** The history the last request was made with, for "try again". */
  const lastHistory = useRef<TutorLine[]>([]);

  const ask = async (history: TutorLine[]) => {
    lastHistory.current = history;
    setStatus({ kind: 'waiting' });
    setHint(false);
    const out = await tutorTurn({ target, l1, unitId, history });
    if (!alive.current) return;
    if (out.kind !== 'ok') {
      setStatus(out);
      return;
    }
    const turn = out.value;
    if (!turn.reply) {
      setStatus({ kind: 'declined' });
      return;
    }
    setEntries((prev) => {
      // Feedback and correction are about the learner's last line.
      const next = prev.map((e, i) =>
        i === prev.length - 1 && e.role === 'learner'
          ? { ...e, feedback: turn.feedback || undefined, correction: turn.correction || undefined }
          : e,
      );
      return [...next, { id: nextId.current++, role: 'tutor', turn }];
    });
    setStatus({ kind: turn.done ? 'done' : 'ready' });
    say(turn.reply, course.course.voice);
  };

  useEffect(() => {
    alive.current = true;
    void ask([]);
    return () => {
      alive.current = false;
      stopAudio();
    };
    // Opening line once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const history = (extra?: string): TutorLine[] => [
    ...entries.map((e): TutorLine => (e.role === 'tutor' ? { role: 'tutor', text: e.turn.reply } : { role: 'learner', text: e.text })),
    ...(extra ? [{ role: 'learner' as const, text: extra }] : []),
  ];

  const send = () => {
    const text = input.trim();
    if (!text || status.kind !== 'ready') return;
    setInput('');
    setVoiceNote(undefined);
    const h = history(text);
    setEntries((prev) => [...prev, { id: nextId.current++, role: 'learner', text }]);
    void ask(h);
  };

  const restart = () => {
    setEntries([]);
    setInput('');
    void ask([]);
  };

  // Voice answer → text in the box (the learner can check it before sending). The file goes once answered.
  const recorder = useRecorder(VOICE_ANSWER_SECONDS, async (uri) => {
    setVoice('transcribing');
    let note: string | undefined = t('tutor.voiceFailed');
    if (uri) {
      try {
        const out = await transcribe({ target, audio: await recordingFile(uri) });
        if (out.kind === 'ok') {
          note = out.value.trim() ? undefined : t('tutor.voiceEmpty');
          if (out.value.trim()) setInput((prev) => `${prev ? `${prev} ` : ''}${out.value.trim()}`.slice(0, TUTOR_LINE_MAX));
        } else if (out.kind === 'unavailable') {
          note = t('tutor.voiceUnavailable');
          setVoiceOff(true);
        } else if (out.kind === 'offline') note = t('tutor.offline');
        else if (out.kind === 'limit') note = t('tutor.limitShort');
      } catch {}
      discardRecording(uri);
    }
    if (!alive.current) return;
    setVoiceNote(note);
    setVoice('idle');
  });

  const pressMic = async () => {
    if (voice === 'recording') {
      setVoice('transcribing');
      await recorder.stop();
      return;
    }
    setVoiceNote(undefined);
    setVoice('starting');
    const started = await recorder.start();
    if (!alive.current) return;
    if (started === 'recording') setVoice('recording');
    else {
      setVoice('idle');
      setVoiceNote(started === 'denied' ? t('tutor.voiceNoPermission') : t('tutor.voiceFailed'));
    }
  };

  // Keep the newest line (and any status card) in view.
  useEffect(() => {
    const id = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [entries, status]);

  const lastTurn = [...entries].reverse().find((e): e is Extract<Entry, { role: 'tutor' }> => e.role === 'tutor')?.turn;
  const canType = status.kind === 'ready';

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.root, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={96}>
        <FlatList
          ref={list}
          data={entries}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) =>
            item.role === 'tutor' ? (
              <TutorBubble turn={item.turn} course={course} unitId={unitId} />
            ) : (
              <LearnerBubble entry={item} />
            )
          }
          ListFooterComponent={
            <View style={styles.gap}>
              {status.kind === 'waiting' ? (
                <View style={[styles.typing, { backgroundColor: c.backgroundElement }]}>
                  <ActivityIndicator color={c.textSecondary} />
                  <ThemedText type="small" style={{ color: c.textSecondary }}>
                    {t('tutor.thinking')}
                  </ThemedText>
                </View>
              ) : null}
              <StatusCard status={status} premium={premium} onRetry={() => void ask(lastHistory.current)} onRestart={restart} />
            </View>
          }
        />
        {canType ? (
          <View style={[styles.composer, { borderTopColor: c.border, backgroundColor: c.background }]}>
            {hint && lastTurn?.hint ? (
              <Card style={styles.hint}>
                <ThemedText type="small">💡 {lastTurn.hint}</ThemedText>
              </Card>
            ) : null}
            {voiceNote ? (
              <ThemedText type="small" style={{ color: c.textSecondary }}>
                {voiceNote}
              </ThemedText>
            ) : null}
            <View style={styles.inputRow}>
              {lastTurn?.hint ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('tutor.hint')}
                  accessibilityState={{ expanded: hint }}
                  onPress={() => setHint((h) => !h)}
                  style={[styles.roundButton, { backgroundColor: c.backgroundElement }]}>
                  <ThemedText style={styles.roundIcon}>💡</ThemedText>
                </Pressable>
              ) : null}
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={t('tutor.placeholder', { language: course.gloss.name })}
                placeholderTextColor={c.textSecondary}
                maxLength={TUTOR_LINE_MAX}
                multiline
                accessibilityLabel={t('tutor.placeholder', { language: course.gloss.name })}
                style={[styles.input, { color: c.text, backgroundColor: c.backgroundElement }]}
              />
              {!voiceOff ? (
                <MicButton
                  size={44}
                  state={voice === 'recording' ? 'recording' : voice === 'idle' ? 'idle' : 'busy'}
                  label={voice === 'recording' ? t('tutor.voiceStop') : t('tutor.voice')}
                  onPress={() => void pressMic()}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('tutor.send')}
                accessibilityState={{ disabled: !input.trim() }}
                disabled={!input.trim()}
                onPress={send}
                style={[styles.roundButton, { backgroundColor: c.primary, opacity: input.trim() ? 1 : 0.4 }]}>
                <ThemedText style={[styles.roundIcon, { color: c.onPrimary }]}>➤</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TutorBubble({ turn, course, unitId }: { turn: TutorTurn; course: CourseBundle; unitId: string }) {
  const { t } = useApp();
  const c = useTheme();
  const [translated, setTranslated] = useState(false);
  const report = () => {
    const version = Constants.expoConfig?.version ?? '';
    const subject = t('tutor.reportSubject', { unit: unitId });
    const body = [t('tutor.reportBody'), '', '—', turn.reply, turn.reading, turn.translation, '', `unit: ${unitId}`, `app: ${version}`].join('\n');
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`).catch(() => {});
  };
  return (
    <View style={[styles.bubble, styles.left, { backgroundColor: c.backgroundElement }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('common.listen')}: ${turn.reply}`}
        onPress={() => say(turn.reply, course.course.voice)}
        style={styles.gapSmall}>
        <ThemedText style={styles.reply}>🔊 {turn.reply}</ThemedText>
        {turn.reading ? (
          <ThemedText type="small" style={{ color: c.textSecondary }}>
            {turn.reading}
          </ThemedText>
        ) : null}
      </Pressable>
      {translated && turn.translation ? <ThemedText type="small">{turn.translation}</ThemedText> : null}
      <View style={styles.bubbleActions}>
        {turn.translation ? (
          <Pressable accessibilityRole="button" onPress={() => setTranslated((v) => !v)} hitSlop={8} style={styles.action}>
            <ThemedText type="smallBold" style={{ color: c.primary }}>
              {translated ? t('tutor.hideTranslation') : t('tutor.showTranslation')}
            </ThemedText>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={report} hitSlop={8} style={styles.action}>
          <ThemedText type="small" style={{ color: c.textSecondary }}>
            ⚑ {t('tutor.report')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function LearnerBubble({ entry }: { entry: Extract<Entry, { role: 'learner' }> }) {
  const { t } = useApp();
  const c = useTheme();
  return (
    <View style={styles.gapSmall}>
      <View style={[styles.bubble, styles.right, { backgroundColor: c.successSoft }]}>
        <ThemedText>{entry.text}</ThemedText>
      </View>
      {entry.feedback || entry.correction ? (
        <View style={[styles.feedback, styles.right, { borderColor: c.border }]}>
          {entry.feedback ? <ThemedText type="small">💬 {entry.feedback}</ThemedText> : null}
          {entry.correction ? (
            <ThemedText type="small">
              <ThemedText type="smallBold">{t('tutor.correction')} </ThemedText>
              {entry.correction}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function StatusCard({
  status,
  premium,
  onRetry,
  onRestart,
}: {
  status: Status;
  premium: boolean;
  onRetry: () => void;
  onRestart: () => void;
}) {
  const { t } = useApp();
  if (status.kind === 'waiting' || status.kind === 'ready') return null;
  const message =
    status.kind === 'done'
      ? `🎉 ${t('tutor.done')}`
      : status.kind === 'declined'
        ? t('tutor.declined')
        : status.kind === 'limit'
          ? status.limit
            ? t('tutor.limit', { n: status.limit })
            : t('tutor.limitShort')
          : status.kind === 'unavailable'
            ? t('tutor.unavailable')
            : status.kind === 'offline'
              ? t('tutor.offline')
              : t('tutor.failed');
  return (
    <Card style={styles.status}>
      <ThemedText style={styles.center}>{message}</ThemedText>
      {status.kind === 'limit' && !premium ? (
        <>
          <ThemedText type="small" style={styles.center}>
            {t('tutor.limitPremium')}
          </ThemedText>
          <Button label={`👑 ${t('home.premium')}`} onPress={() => router.push('/paywall')} />
        </>
      ) : null}
      {status.kind === 'offline' || status.kind === 'failed' ? <Button label={t('tutor.retry')} onPress={onRetry} /> : null}
      {status.kind === 'done' ? <Button label={t('tutor.again')} onPress={onRestart} /> : null}
      <Button variant="secondary" label={t('tutor.back')} onPress={() => router.back()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  gap: { gap: Spacing.two },
  gapSmall: { gap: Spacing.one },
  center: { textAlign: 'center' },
  consentTitle: { fontSize: 26, lineHeight: 36 },
  point: { flexDirection: 'row', gap: Spacing.two },
  link: { minHeight: 44, justifyContent: 'center' },
  messages: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  bubble: { maxWidth: '88%', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end' },
  reply: { fontSize: 20, lineHeight: 30 },
  bubbleActions: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
  action: { minHeight: 32, justifyContent: 'center' },
  feedback: { maxWidth: '88%', borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.half },
  typing: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  status: { gap: Spacing.three },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hint: { padding: Spacing.two },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  roundButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roundIcon: { fontSize: 20, lineHeight: 24 },
});
