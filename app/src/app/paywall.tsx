import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { legalUrl } from '@/lib/api';
import { notify } from '@/lib/dialog';
import { openPage } from '@/lib/open-page';
import { loadPlans, PLACEHOLDER_PLANS, purchase, purchasesReady, restore, type Plan } from '@/lib/purchases';
import { useApp } from '@/state/app-state';

/** What Premium really includes (keep in step with the store listing). */
const FEATURES = ['allLevels', 'readers', 'practice', 'speaking'];

export default function Paywall() {
  const { l1, premium, refreshPremium, unlockForTesting, t } = useApp();
  const c = useTheme();
  // Store prices replace the placeholders once the offering has loaded.
  const [plans, setPlans] = useState<Plan[]>(() => (purchasesReady ? PLACEHOLDER_PLANS.map(({ id }) => ({ id })) : PLACEHOLDER_PLANS));
  const [plan, setPlan] = useState<Plan['id']>('yearly');
  const [busy, setBusy] = useState<'buy' | 'restore'>();

  useEffect(() => {
    let live = true;
    loadPlans()
      .then((loaded) => {
        if (!live) return;
        setPlans(loaded);
        setPlan((current) => (loaded.some((p) => p.id === current) ? current : (loaded[0]?.id ?? current)));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const buy = async () => {
    setBusy('buy');
    const result = await purchase(plan);
    setBusy(undefined);
    if (result === 'purchased') {
      notify(t('paywall.success'));
      router.back();
    } else if (result === 'pending') notify(t('paywall.pending'));
    else if (result === 'unavailable') notify(t(purchasesReady ? 'paywall.storeUnavailable' : 'paywall.notReady'));
    else if (result === 'failed') notify(t('paywall.failed'));
  };

  const restorePurchases = async () => {
    setBusy('restore');
    const result = await restore();
    setBusy(undefined);
    refreshPremium();
    if (result === 'restored') {
      notify(t('paywall.restored'));
      router.back();
    } else if (result === 'nothing') notify(t('paywall.nothingToRestore'));
    else if (result === 'unavailable') notify(t(purchasesReady ? 'paywall.storeUnavailable' : 'paywall.notReady'));
    else notify(t('paywall.failed'));
  };

  const lang = l1 === 'th' ? 'th' : 'en';
  const privacy = legalUrl('privacy', lang);
  const terms = legalUrl('terms', lang);

  return (
    <Screen
      footer={
        <View style={styles.gap}>
          {premium ? (
            <Button label={t('common.close')} onPress={() => router.back()} />
          ) : (
            <Button label={t('paywall.subscribe')} busy={busy === 'buy'} disabled={!!busy} onPress={() => void buy()} />
          )}
          <Button
            variant="secondary"
            label={t('paywall.restore')}
            busy={busy === 'restore'}
            disabled={!!busy}
            onPress={() => void restorePurchases()}
          />
          {__DEV__ && !purchasesReady && !premium ? (
            <Button
              variant="secondary"
              label={t('paywall.devUnlock')}
              onPress={() => {
                unlockForTesting();
                router.back();
              }}
            />
          ) : null}
        </View>
      }>
      <ThemedText type="subtitle">👑 {t('paywall.title')}</ThemedText>
      {premium ? (
        <ThemedText type="smallBold" style={{ color: c.success }}>
          ✓ {t('settings.premiumActive')}
        </ThemedText>
      ) : null}
      <ThemedText>{t('paywall.subtitle')}</ThemedText>
      <View style={styles.gap}>
        {FEATURES.map((f) => (
          <ThemedText key={f}>✓ {t(`paywall.feature.${f}`)}</ThemedText>
        ))}
      </View>
      {plans.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="radio"
          accessibilityState={{ selected: plan === p.id }}
          onPress={() => setPlan(p.id)}
          style={[styles.plan, { borderColor: plan === p.id ? c.primary : c.border }]}>
          <ThemedText type="smallBold">{t(`paywall.${p.id}`)}</ThemedText>
          <ThemedText style={styles.price}>
            {p.price ? t(p.id === 'yearly' ? 'paywall.perYear' : 'paywall.perMonth', { price: p.price }) : '…'}
          </ThemedText>
          {p.perMonth ? (
            <ThemedText type="small" style={{ color: c.textSecondary }}>
              {t('paywall.perMonthEquivalent', { price: p.perMonth })}
            </ThemedText>
          ) : null}
          {p.trialDays ? (
            <ThemedText type="small" style={{ color: c.success }}>
              {t('paywall.trialDays', { n: p.trialDays })}
            </ThemedText>
          ) : null}
        </Pressable>
      ))}
      <ThemedText type="small" style={{ color: c.textSecondary }}>
        {t('paywall.terms')}
      </ThemedText>
      {privacy && terms ? (
        <View style={styles.links}>
          <LegalLink label={t('settings.terms')} url={terms} />
          <LegalLink label={t('settings.privacy')} url={privacy} />
        </View>
      ) : null}
    </Screen>
  );
}

function LegalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void openPage(url)}
      style={styles.link}
      hitSlop={8}>
      <ThemedText type="linkPrimary">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.two },
  plan: { borderWidth: 2, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
  price: { fontSize: 18, lineHeight: 26 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  link: { minHeight: 44, justifyContent: 'center' },
});
