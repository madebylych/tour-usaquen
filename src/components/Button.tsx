import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { colors, line, shadow, space } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  // primary: azul con eco amarillo. secondary: blanco con borde de tinta.
  // light: amarillo con eco de tinta, para usar sobre fondo azul.
  variant?: 'primary' | 'secondary' | 'light';
  icon?: ComponentProps<typeof Ionicons>['name'];
  // Flecha a la derecha y texto a la izquierda (botones de "seguir").
  iconRight?: boolean;
};

export default function Button({ label, onPress, variant = 'primary', icon, iconRight = false }: Props) {
  const color = variant === 'primary' ? colors.onPrimary : colors.text;
  const iconColor = variant === 'primary' ? colors.accent : colors.text;
  const iconEl = icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        iconRight && styles.spread,
        // Al presionar, el botón "baja" sobre su sombra.
        pressed && styles.pressed,
      ]}
    >
      {iconRight ? null : iconEl}
      <Txt variant="label" color={color} style={styles.label}>
        {label}
      </Txt>
      {iconRight ? iconEl : null}
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
    paddingHorizontal: space.l - 4,
  },
  spread: { justifyContent: 'space-between' },
  primary: { backgroundColor: colors.primary, boxShadow: shadow.accent },
  secondary: { backgroundColor: colors.surface, borderWidth: line, borderColor: colors.border },
  light: { backgroundColor: colors.accent, boxShadow: shadow.ink },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: 'none' },
  label: { fontSize: 16 },
});
