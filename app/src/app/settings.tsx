import type { L1Bundle } from '@linguasea/contract';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { FLAG } from '@/constants/flags';
import { Spacing } from '@/constants/theme';
import { bundle, courseBundle } from '@/content';
import { useTheme } from '@/hooks/use-theme';
import { legalUrl } from '@/lib/api';
import { confirm, notify } from '@/lib/dialog';
import { openPage } from '@/lib/open-page';
import { restore } from '@/lib/purchases';
import { remindersSupported } from '@/lib/reminders';
import { useApp } from '@/state/app-state';

const appName = Application.applicationName ?? Constants.expoConfig?.name ?? '';

const appVersion = (() => {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '';
  const build = Application.nativeBuildVersion;
  return build && build !== version ? `${version} (${build})` : version;
})();

const interfaceLanguages = Object.values(bundle.l1s).filter((b): b is L1Bundle => !!b);

export default function Settings() {
  const {
    l1,
    target,
    setL1,
    premium,
    reminder,
    setReminder,
    refreshPremium,
    deleteMyData,
    tutorConsent,
    setTutorConsent,
    t,
  } = useApp();
  const c = useTheme();
  const course = target ? courseBundle(l1, target) : undefined;
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reminderDenied, setReminderDenied] = useState(false);

  // Legal pages exist in Thai and English; other interface languages get English for now.
  const lang = l1 === 'th' ? 'th' : 'en';
  const privacy = legalUrl('privacy', lang);
  const terms = legalUrl('terms', lang);

  const changeReminder = async (next: typeof reminder) => {
    setReminderDenied((await setReminder(next)) === 'denied');
  };

  const shiftReminder = (minutes: number) => {
    const total = (((reminder.hour * 60 + reminder.minute + minutes) % 1440) + 1440) % 1440;
    void changeReminder({ ...reminder, hour: Math.floor(total / 60), minute: total % 60 });
  };

  const onRestore = async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);
    refreshPremium();
    notify(
      t(
        result === 'restored'
          ? 'paywall.restored'
          : result === 'nothing'
            ? 'paywall.nothingToRestore'
            : result === 'unavailable'
              ? 'paywall.notReady'
              : 'paywall.failed',
      ),
    );
  };

  const onDelete = async () => {
    const sure = await confirm({
      title: t('settings.deleteTitle'),
      message: t('settings.deleteBody'),
      confirm: t('settings.deleteConfirm'),
      cancel: t('common.cancel'),
      destructive: true,
    });
    if (!sure) return;
    setDeleting(true);
    const deleted = await deleteMyData();
    setDeleting(false);
    if (!deleted) {
      notify(t('settings.deleteFailed'));
      return;
    }
    // Home has no course any more and sends the learner to language selection.
    router.dismissAll();
  };

  return (
    <Screen>
      <Section title={t('settings.learning')}>
        <Row
          label={course && target ? `${FLAG[target]}  ${course.gloss.name}` : '—'}
          action={t('settings.change')}
          onPress={() => router.push('/languages')}
        />
        {course ? (
          <Row
            label={t('settings.placement')}
            action="›"
            onPress={() => router.push({ pathname: '/placement', params: { start: 'test' } })}
          />
        ) : null}
      </Section>

      {interfaceLanguages.length > 1 ? (
        <Section title={t('settings.interface')}>
          {interfaceLanguages.map((b) => (
            <Pressable
              key={b.l1}
              accessibilityRole="radio"
              accessibilityState={{ selected: b.l1 === l1 }}
              onPress={() => setL1(b.l1)}
              style={[styles.row, styles.option, { borderColor: b.l1 === l1 ? c.primary : 'transparent' }]}>
              <ThemedText style={styles.flex}>{b.name}</ThemedText>
              {b.l1 === l1 ? <ThemedText style={{ color: c.primary }}>✓</ThemedText> : null}
            </Pressable>
          ))}
        </Section>
      ) : null}

      {remindersSupported ? (
        <Section title={t('settings.reminder')}>
          <View style={styles.row}>
            <ThemedText style={styles.flex}>{t('settings.reminderDaily')}</ThemedText>
            <Switch
              accessibilityLabel={t('settings.reminderDaily')}
              value={reminder.on}
              onValueChange={(on) => void changeReminder({ ...reminder, on })}
              trackColor={{ true: c.primary }}
            />
          </View>
          {reminder.on ? (
            <>
              <View style={styles.row}>
                <ThemedText style={styles.flex}>{t('settings.reminderTime')}</ThemedText>
                <ThemedText type="smallBold" style={styles.time}>
                  {String(reminder.hour).padStart(2, '0')}:{String(reminder.minute).padStart(2, '0')}
                </ThemedText>
              </View>
              <View style={styles.steppers}>
                <Stepper label={t('settings.hour')} onMinus={() => shiftReminder(-60)} onPlus={() => shiftReminder(60)} />
                <Stepper label={t('settings.minute')} onMinus={() => shiftReminder(-15)} onPlus={() => shiftReminder(15)} />
              </View>
            </>
          ) : null}
          {reminderDenied ? (
            <ThemedText type="small" style={{ color: c.danger }}>
              {t('settings.reminderDenied')}
            </ThemedText>
          ) : null}
        </Section>
      ) : null}

      <Section title={t('settings.subscription')}>
        <ThemedText>{premium ? `👑 ${t('settings.premiumActive')}` : t('settings.free')}</ThemedText>
        {!premium ? <Button label={`👑 ${t('home.premium')}`} onPress={() => router.push('/paywall')} /> : null}
        <Button
          variant="secondary"
          label={t('paywall.restore')}
          busy={restoring}
          onPress={() => void onRestore()}
          style={{ backgroundColor: c.background }}
        />
      </Section>

      {privacy && terms ? (
        <Section title={t('settings.about')}>
          <Row label={t('settings.privacy')} action="↗" onPress={() => void openPage(privacy)} />
          <Row label={t('settings.terms')} action="↗" onPress={() => void openPage(terms)} />
        </Section>
      ) : null}

      <Section title={t('settings.data')}>
        {tutorConsent === 'agreed' ? (
          <Row
            label={t('settings.tutorConsent')}
            action={t('settings.tutorWithdraw')}
            onPress={() => {
              setTutorConsent(undefined);
              notify(t('settings.tutorWithdrawn'));
            }}
          />
        ) : null}
        <ThemedText type="small" style={{ color: c.textSecondary }}>
          {t('settings.deleteHint')}
        </ThemedText>
        <Button variant="danger" label={t('settings.deleteData')} busy={deleting} onPress={() => void onDelete()} />
      </Section>

      <ThemedText type="small" style={[styles.version, { color: c.textSecondary }]}>
        {appName ? `${appName} · ` : ''}
        {t('settings.version', { version: appVersion })}
      </ThemedText>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" style={[styles.sectionTitle, { color: c.textSecondary }]}>
        {title}
      </ThemedText>
      <Card>{children}</Card>
    </View>
  );
}

function Row({ label, action, onPress }: { label: string; action: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <ThemedText style={styles.flex}>{label}</ThemedText>
      <ThemedText type="smallBold" style={{ color: c.primary }}>
        {action}
      </ThemedText>
    </Pressable>
  );
}

/** − label + for one part of the reminder time (hours, minutes). */
function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  const { t } = useApp();
  return (
    <View style={styles.stepper}>
      <StepButton text="−" label={t('settings.less', { what: label })} onPress={onMinus} />
      <ThemedText type="small" style={styles.stepLabel}>
        {label}
      </ThemedText>
      <StepButton text="+" label={t('settings.more', { what: label })} onPress={onPlus} />
    </View>
  );
}

function StepButton({ text, label, onPress }: { text: string; label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, { backgroundColor: c.background, opacity: pressed ? 0.6 : 1 }]}>
      <ThemedText type="smallBold" style={styles.stepText}>
        {text}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: Spacing.two },
  sectionTitle: { paddingHorizontal: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 48 },
  option: { borderWidth: 2, borderRadius: Spacing.two, paddingHorizontal: Spacing.three },
  time: { fontSize: 24, lineHeight: 32, fontVariant: ['tabular-nums'] },
  steppers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepLabel: { minWidth: 48, textAlign: 'center' },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, lineHeight: 26 },
  version: { textAlign: 'center', marginTop: Spacing.two },
});
