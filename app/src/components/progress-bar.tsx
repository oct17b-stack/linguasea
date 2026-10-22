import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function ProgressBar({ value }: { value: number }) {
  const c = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: c.backgroundSelected }]}>
      <View style={[styles.fill, { backgroundColor: c.primary, width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
