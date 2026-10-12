import { ComponentProps, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Nudge, useReducedMotion } from '@/components/motion';
import Txt from '@/components/Txt';
import { line, makeStyles, radius, shadows, space, useTheme } from '@/theme';
import { tap } from '@/audio/haptics';

type Props = {
  label: string;
  onPress: () => void;
  // primary: color principal. secondary: blanco con borde suave.
  // light: tono clarito del color principal, con texto en tinta.
  variant?: 'primary' | 'secondary' | 'light';
  icon?: ComponentProps<typeof Ionicons>['name'];
  // Flecha a la derecha y texto a la izquierda (botones de "seguir").
  iconRight?: boolean;
};

export default function Button({ label, onPress, variant = 'primary', icon, iconRight = false }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const [press] = useState(() => new Animated.Value(0));
  const [hover] = useState(() => new Animated.Value(0));
  const color = variant === 'primary' ? colors.onPrimary : variant === 'light' ? colors.onAccent : colors.text;
  const iconColor = variant === 'primary' ? colors.accentOnPrimary : color;
  const iconEl = icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null;

  // Al presionar se encoge un poco y rebota al soltar; con el mouse encima
  // se levanta un poco.
  const springTo = (value: Animated.Value, toValue: number) => {
    if (reduced) return value.setValue(toValue);
    Animated.spring(value, { toValue, friction: 6, tension: 260, useNativeDriver: true }).start();
  };
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const lift = hover.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        tap();
        springTo(press, 1);
      }}
      onPressOut={() => springTo(press, 0)}
      onHoverIn={() => springTo(hover, 1)}
      onHoverOut={() => springTo(hover, 0)}
    >
      <Animated.View
        style={[
          styles.base,
          styles[variant],
          variant !== 'secondary' && { boxShadow: shadows(colors).soft },
          iconRight && styles.spread,
          { transform: [{ translateY: lift }, { scale }] },
        ]}
      >
        {iconRight ? null : iconEl}
        <Txt variant="label" color={color} style={styles.label}>
          {label}
        </Txt>
        {/* La flecha de "seguir" empuja hacia adelante. */}
        {iconRight && iconEl ? <Nudge delay={600}>{iconEl}</Nudge> : null}
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    minHeight: 54,
    paddingHorizontal: space.l - 4,
    borderRadius: radius.m,
  },
  spread: { justifyContent: 'space-between' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: line, borderColor: colors.border },
  light: { backgroundColor: colors.accent },
  label: { fontSize: 16 },
}));
