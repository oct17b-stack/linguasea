import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PLACEHOLDER_PLANS, purchase, purchasesReady, restore, type Plan } from '@/lib/purchases';
import { useApp } from '@/state/app-state';

const FEATURES = ['allLevels', 'speaking', 'exams', 'offline'];

export default function Paywall() {
  const { setPremium, t } = useApp();
  const c = useTheme();
  const [plan, setPlan] = useState<Plan['id']>('yearly');

  const done = (ok: boolean) => {
    if (!ok) {
      Alert.alert(t('paywall.notReady'));
      return;
    }
    setPremium(true);
    router.back();
  };

  return (
    <Screen
      footer={
        <View style={styles.gap}>
          <Button label={t('paywall.subscribe')} onPress={() => purchase(plan).then(done)} />
          <Button variant="secondary" label={t('paywall.restore')} onPress={() => restore().then(done)} />
          {__DEV__ && !purchasesReady ? (
            <Button variant="secondary" label={t('paywall.devUnlock')} onPress={() => done(true)} />
          ) : null}
        </View>
      }>
      <ThemedText type="subtitle">👑 {t('paywall.title')}</ThemedText>
      <ThemedText>{t('paywall.subtitle')}</ThemedText>
      <View style={styles.gap}>
        {FEATURES.map((f) => (
          <ThemedText key={f}>✓ {t(`paywall.feature.${f}`)}</ThemedText>
        ))}
      </View>
      {PLACEHOLDER_PLANS.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="radio"
          accessibilityState={{ selected: plan === p.id }}
          onPress={() => setPlan(p.id)}
          style={[styles.plan, { borderColor: plan === p.id ? c.primary : c.border }]}>
          <ThemedText type="smallBold">{t(`paywall.${p.id}`)}</ThemedText>
          <ThemedText>{p.price}</ThemedText>
          {p.trial ? (
            <ThemedText type="small" style={{ color: c.success }}>
              {t('paywall.trial')}
            </ThemedText>
          ) : null}
        </Pressable>
      ))}
      <ThemedText type="small" style={{ color: c.textSecondary }}>
        {t('paywall.terms')}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.two },
  plan: { borderWidth: 2, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
});
