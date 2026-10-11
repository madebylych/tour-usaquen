import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useReducedMotion } from '@/components/motion';
import { useTheme } from '@/theme';

const PIECES = 26;

// Valores fijos por pieza (no aleatorios en cada render).
const pieces = Array.from({ length: PIECES }, (_, i) => ({
  x: ((i * 37) % 100) / 100, // posición horizontal, repartida
  size: 8 + ((i * 7) % 9),
  delay: (i * 53) % 700,
  spin: (i % 2 ? 1 : -1) * (180 + ((i * 41) % 360)),
  drift: ((i * 29) % 60) - 30,
  round: i % 4 === 0, // algunos puntos de trama entre los cuadros
}));

// Celebración del final: recortes de tinta azul, amarilla y negra que caen
// una sola vez. No bloquea los toques.
export default function InkConfetti() {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const inks = [colors.primary, colors.accent, colors.border];
  const { width, height } = useWindowDimensions();
  const [fall] = useState(() => pieces.map(() => new Animated.Value(0)));

  useEffect(() => {
    if (reduced) return;
    const anim = Animated.parallel(
      fall.map((v, i) =>
        Animated.sequence([
          Animated.delay(pieces[i].delay),
          Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      )
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, fall]);

  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -30,
            left: p.x * width,
            width: p.size,
            height: p.size,
            borderRadius: p.round ? p.size / 2 : 0,
            backgroundColor: inks[i % inks.length],
            opacity: fall[i].interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: fall[i].interpolate({ inputRange: [0, 1], outputRange: [0, height + 60] }) },
              { translateX: fall[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: fall[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
