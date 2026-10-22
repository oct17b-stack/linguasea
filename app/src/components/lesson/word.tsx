import type { Word } from '@linguasea/core';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';

/** Listen / listen slowly. `onCard`: drawn on a Card, so the buttons take the page colour to stand out. */
export function ListenButtons({ onListen, onCard = false }: { onListen: (slow: boolean) => void; onCard?: boolean }) {
  const { t } = useApp();
  const c = useTheme();
  const style = [styles.flex, onCard ? { backgroundColor: c.background } : null];
  return (
    <View style={styles.row}>
      <Button variant="secondary" label={`🔊 ${t('common.listen')}`} onPress={() => onListen(false)} style={style} />
      <Button variant="secondary" label={`🐢 ${t('common.listenSlow')}`} onPress={() => onListen(true)} style={style} />
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
