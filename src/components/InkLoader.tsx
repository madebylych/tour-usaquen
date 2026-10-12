import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { useReducedMotion } from '@/components/motion';
import { line, makeStyles, useTheme } from '@/theme';

// Indicador de carga: tres cuadros de tinta (azul, amarillo, negro) que
// saltan uno tras otro, como los tambores de la risógrafa.
export default function InkLoader() {
  const styles = useStyles();
  const { colors } = useTheme();
  const inks = [colors.primary, colors.accent, colors.border];
  const reduced = useReducedMotion();
  const [values] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    if (reduced) return;
    const hop = (v: Animated.Value) =>
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 260, easing: Easing.bounce, useNativeDriver: true }),
      ]);
    const loop = Animated.loop(Animated.stagger(140, values.map(hop)));
    loop.start();
    return () => loop.stop();
  }, [reduced, values]);

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Cargando">
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.square,
            { backgroundColor: inks[i] },
            {
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
                { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', i % 2 ? '-12deg' : '12deg'] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', gap: 10, height: 40, alignItems: 'flex-end' },
  square: { width: 18, height: 18, borderWidth: line, borderColor: colors.border, borderRadius: 5 },
}));
