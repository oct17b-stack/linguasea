import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Round record button: 🎙️ to start, ■ (red) while recording, a spinner while busy. */
export function MicButton({
  state,
  label,
  onPress,
  size = 88,
}: {
  state: 'idle' | 'recording' | 'busy';
  /** Accessible name: what a tap does now. */
  label: string;
  onPress: () => void;
  size?: number;
}) {
  const c = useTheme();
  const busy = state === 'busy';
  const recording = state === 'recording';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.mic,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: recording ? c.danger : c.primary,
          opacity: busy ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {busy ? (
        <ActivityIndicator color={c.onPrimary} />
      ) : (
        <ThemedText style={[{ color: c.onPrimary, fontSize: size * 0.4, lineHeight: size * 0.5 }]}>
          {recording ? '■' : '🎙️'}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mic: { alignItems: 'center', justifyContent: 'center' },
});
