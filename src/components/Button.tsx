import { ComponentProps, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Nudge, useReducedMotion } from '@/components/motion';
import Txt from '@/components/Txt';
import { line, makeStyles, space, useTheme } from '@/theme';
import { tap } from '@/audio/haptics';

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

const DEPTH = 5; // cuánto se corre la sombra (la "segunda tinta")

export default function Button({ label, onPress, variant = 'primary', icon, iconRight = false }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const [press] = useState(() => new Animated.Value(0));
  const [hover] = useState(() => new Animated.Value(0));
  const color = variant === 'primary' ? colors.onPrimary : variant === 'light' ? colors.onAccent : colors.text;
  const iconColor = variant === 'primary' ? colors.accentOnPrimary : color;
  const iconEl = icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null;
  const shadowColor = variant === 'primary' ? colors.accent : variant === 'light' ? colors.border : null;

  // Al presionar, la cara del botón "baja" sobre su sombra y rebota al soltar.
  // Con el mouse encima se levanta un poco (la sombra se ve más grande).
  const springTo = (value: Animated.Value, toValue: number) => {
    if (reduced) return value.setValue(toValue);
    Animated.spring(value, { toValue, friction: 6, tension: 260, useNativeDriver: true }).start();
  };
  const offset = Animated.subtract(
    press.interpolate({ inputRange: [0, 1], outputRange: [0, DEPTH - 1] }),
    hover.interpolate({ inputRange: [0, 1], outputRange: [0, 2] })
  );
  const grow = hover.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

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
      style={shadowColor ? styles.withShadow : null}
    >
      {shadowColor ? <View style={[styles.shadow, { backgroundColor: shadowColor }]} /> : null}
      <Animated.View
        style={[
          styles.base,
          styles[variant],
          iconRight && styles.spread,
          // Sin sombra (secundario), el hover lo agranda un poco.
          { transform: shadowColor ? [{ translateX: offset }, { translateY: offset }] : [{ scale: grow }] },
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
  withShadow: { marginRight: DEPTH, marginBottom: DEPTH },
  shadow: { position: 'absolute', top: DEPTH, left: DEPTH, right: -DEPTH, bottom: -DEPTH },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    minHeight: 54,
    paddingHorizontal: space.l - 4,
  },
  spread: { justifyContent: 'space-between' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: line, borderColor: colors.border },
  light: { backgroundColor: colors.accent },
  label: { fontSize: 16 },
}));
