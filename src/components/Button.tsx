import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { colors, radius, space } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'light';
  icon?: ComponentProps<typeof Ionicons>['name'];
};

// Botón tipo píldora. `light` es para usar sobre fondo fucsia.
export default function Button({ label, onPress, variant = 'primary', icon }: Props) {
  const color = variant === 'primary' ? colors.onPrimary : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed]}
    >
      {icon ? <Ionicons name={icon} size={20} color={color} /> : null}
      <Txt variant="label" color={color} style={styles.label}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    minHeight: 54,
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  light: { backgroundColor: colors.surface },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  label: { fontSize: 16 },
});
