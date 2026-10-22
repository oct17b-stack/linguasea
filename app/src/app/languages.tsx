import { TARGETS, type Target } from '@linguasea/contract';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { courseBundle } from '@/content';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';

const FLAG: Record<Target, string> = { zh: '🇨🇳', en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷' };

export default function Languages() {
  const { l1, target, setTarget, t } = useApp();
  const c = useTheme();
  const choose = (next: Target) => {
    setTarget(next);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <Screen>
      <ThemedText type="subtitle">{t('languages.title')}</ThemedText>
      <ThemedText style={{ color: c.textSecondary }}>{t('languages.subtitle')}</ThemedText>
      {TARGETS.map((code) => {
        const course = courseBundle(l1, code);
        if (!course) return null;
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            onPress={() => choose(code)}
            style={[
              styles.option,
              { backgroundColor: c.backgroundElement, borderColor: code === target ? c.primary : 'transparent' },
            ]}>
            <ThemedText style={styles.flag}>{FLAG[code]}</ThemedText>
            <ThemedText type="smallBold" style={styles.name}>
              {course.gloss.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
    minHeight: 64,
  },
  flag: { fontSize: 32, lineHeight: 40 },
  name: { fontSize: 20, lineHeight: 28 },
});
