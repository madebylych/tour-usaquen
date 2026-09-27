import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, space } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export default function Button({ label, onPress, variant = 'primary' }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: primary ? colors.onAccent : colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space.m - 2,
    paddingHorizontal: space.l,
    borderRadius: 10,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { borderWidth: 1, borderColor: colors.accent },
  pressed: { opacity: 0.7 },
  label: { fontSize: fontSize.body, fontWeight: '600' },
});
