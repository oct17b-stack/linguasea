import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Shown for the moment a course is being read (right after it was chosen). */
export function Loading() {
  const c = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ActivityIndicator color={c.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
