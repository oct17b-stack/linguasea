import type { Word } from '@linguasea/core';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';

/** Listen / listen slowly. */
export function ListenButtons({ onListen }: { onListen: (slow: boolean) => void }) {
  const { t } = useApp();
  return (
    <View style={styles.row}>
      <Button variant="secondary" label={`🔊 ${t('common.listen')}`} onPress={() => onListen(false)} style={styles.flex} />
      <Button variant="secondary" label={`🐢 ${t('common.listenSlow')}`} onPress={() => onListen(true)} style={styles.flex} />
    </View>
  );
}

/** Target text with its romanization and the learner-script spelling under it. */
export function WordFace({ word, big = true }: { word: Word; big?: boolean }) {
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
});
