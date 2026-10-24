import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SignInStart, SignInVerify } from '@/lib/api';
import { useApp } from '@/state/app-state';

/** Wrong codes in a row after which the server has burned the code (contract: 5). */
const MAX_TRIES = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const START_ERROR: Record<Exclude<SignInStart, 'sent'>, string> = {
  'invalid-email': 'account.error.invalidEmail',
  'too-many': 'account.error.tooMany',
  unavailable: 'account.error.unavailable',
  offline: 'account.error.offline',
  failed: 'account.error.failed',
};

const VERIFY_ERROR: Record<Exclude<SignInVerify['kind'], 'ok'>, string> = {
  'invalid-code': 'account.error.invalidCode',
  expired: 'account.error.expired',
  'too-many': 'account.error.tooMany',
  unavailable: 'account.error.unavailable',
  offline: 'account.error.offline',
  failed: 'account.error.failed',
};

/**
 * Email sign-in: email → "send code" → 6-digit code → verify. Once it succeeds the app state has the
 * signed-in email, and the screen showing this replaces it with the signed-in view.
 */
export function EmailSignIn({ onSignedIn }: { onSignedIn?: () => void }) {
  const { requestSignInCode, verifySignInCode, t } = useApp();
  const c = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState<'send' | 'verify'>();
  const [error, setError] = useState<string>();
  const [tries, setTries] = useState(0);

  const trimmed = email.trim();
  const codeReady = /^\d{6}$/.test(code) && tries < MAX_TRIES;

  const send = async () => {
    if (!EMAIL.test(trimmed)) {
      setError(t('account.error.invalidEmail'));
      return;
    }
    setBusy('send');
    setError(undefined);
    const result = await requestSignInCode(trimmed);
    setBusy(undefined);
    if (result !== 'sent') {
      setError(t(START_ERROR[result]));
      return;
    }
    setCode('');
    setTries(0);
    setStep('code');
  };

  const verify = async () => {
    if (!codeReady) return;
    setBusy('verify');
    setError(undefined);
    const result = await verifySignInCode(trimmed, code);
    setBusy(undefined);
    if (result.kind === 'ok') {
      onSignedIn?.();
      return;
    }
    const wrong = result.kind === 'invalid-code' ? tries + 1 : tries;
    setTries(wrong);
    setError(t(wrong >= MAX_TRIES ? 'account.error.tooMany' : VERIFY_ERROR[result.kind]));
    if (result.kind === 'invalid-code') setCode('');
  };

  const inputStyle = [styles.input, { color: c.text, backgroundColor: c.background, borderColor: c.border }];

  return (
    <View style={styles.gap}>
      {step === 'email' ? (
        <>
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(undefined);
            }}
            onSubmitEditing={() => void send()}
            placeholder={t('account.emailPlaceholder')}
            placeholderTextColor={c.textSecondary}
            accessibilityLabel={t('account.email')}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            maxLength={254}
            editable={!busy}
            style={inputStyle}
          />
          <Button label={t('account.sendCode')} busy={busy === 'send'} disabled={!trimmed} onPress={() => void send()} />
        </>
      ) : (
        <>
          <ThemedText type="small">{t('account.codeSent', { email: trimmed })}</ThemedText>
          <TextInput
            value={code}
            onChangeText={(v) => {
              setCode(v.replace(/\D/g, '').slice(0, 6));
              setError(undefined);
            }}
            onSubmitEditing={() => void verify()}
            placeholder="000000"
            placeholderTextColor={c.textSecondary}
            accessibilityLabel={t('account.code')}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            editable={!busy}
            style={[inputStyle, styles.code]}
          />
          <Button label={t('account.verify')} busy={busy === 'verify'} disabled={!codeReady || !!busy} onPress={() => void verify()} />
          <View style={styles.links}>
            <TextLink label={t('account.resend')} disabled={!!busy} onPress={() => void send()} />
            <TextLink
              label={t('account.changeEmail')}
              disabled={!!busy}
              onPress={() => {
                setStep('email');
                setError(undefined);
              }}
            />
          </View>
        </>
      )}
      {error ? (
        <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: c.danger }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

function TextLink({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.link, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
      <ThemedText type="linkPrimary">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.two },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  code: { fontSize: 22, letterSpacing: 6, fontVariant: ['tabular-nums'] },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  link: { minHeight: 44, justifyContent: 'center' },
});
