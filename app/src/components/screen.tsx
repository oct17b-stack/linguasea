import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Page frame: safe area, scrolling body, optional footer pinned to the bottom (e.g. the "next" button). */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const c = useTheme();
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer ? <View style={[styles.inner, styles.footer]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', padding: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  footer: { alignSelf: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
});
