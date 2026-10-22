import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Shows a spinner instead of the label and ignores presses. */
  busy?: boolean;
};

export function Button({ label, variant = 'primary', style, disabled, busy, ...rest }: Props) {
  const c = useTheme();
  const background = variant === 'primary' ? c.primary : variant === 'danger' ? c.dangerSoft : c.backgroundElement;
  const color = variant === 'primary' ? c.onPrimary : variant === 'danger' ? c.danger : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled || busy}
      style={(state) => [
        styles.base,
        { backgroundColor: background, opacity: disabled ? 0.4 : state.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <ThemedText type="smallBold" style={[styles.label, { color }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 17, lineHeight: 24, textAlign: 'center' },
});
