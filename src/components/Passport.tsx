import { ReactNode, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Breathe, Stamp, useHover } from '@/components/motion';
import Txt from '@/components/Txt';
import { countDiscovered } from '@/data/progress';
import { Place } from '@/types';
import { fonts, line, makeStyles, space, useTheme } from '@/theme';

type Props = {
  places: Place[]; // paradas de la ruta, en orden
  discovered: Record<string, number>;
};

// Inclinación de cada sello descubierto: así parecen estampados a mano.
const TILT = ['-6deg', '4deg', '-3deg', '7deg', '-5deg', '3deg'];

// Pasaporte creativo: cuántas paradas se descubrieron y un sello por parada.
export default function Passport({ places, discovered }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const total = places.length;
  const done = countDiscovered(places.map((p) => p.id), discovered);
  const complete = total > 0 && done === total;
  const nextIndex = places.findIndex((p) => !(p.id in discovered));

  return (
    <View style={styles.card} accessibilityLabel={`Pasaporte creativo: ${done} de ${total} paradas descubiertas`}>
      <View style={styles.header}>
        <Txt variant="overline">PASAPORTE CREATIVO</Txt>
        <Txt variant="label">{complete ? '¡Completo!' : `${done} de ${total}`}</Txt>
      </View>

      <ProgressBar value={total > 0 ? done / total : 0} />

      <View style={styles.stamps}>
        {places.map((place, index) => {
          const isDone = place.id in discovered;
          // El sello se estampa al descubrir la parada (y al abrir la
          // pantalla, uno tras otro).
          return isDone ? (
            <Stamp key={place.id} rotate={TILT[index % TILT.length]} delay={150 + index * 90} trigger={isDone}>
              <Wiggle>
                <View style={[styles.stamp, styles.stampDone]}>
                  <Ionicons name="checkmark" size={22} color={colors.onAccent} />
                </View>
              </Wiggle>
            </Stamp>
          ) : index === nextIndex ? (
            // La próxima casilla por llenar "respira" para que se note cuál sigue.
            <Breathe key={place.id} amount={0.1}>
              <View style={[styles.stamp, styles.stampNext]}>
                <Txt variant="label" color={colors.primary} style={styles.number}>
                  {String(index + 1).padStart(2, '0')}
                </Txt>
              </View>
            </Breathe>
          ) : (
            <View key={place.id} style={[styles.stamp, styles.stampPending]}>
              <Txt variant="label" color={colors.textMuted} style={styles.number}>
                {String(index + 1).padStart(2, '0')}
              </Txt>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Sello que se sacude un poco con el mouse encima (o al tocarlo).
function Wiggle({ children }: { children: ReactNode }) {
  const hover = useHover();
  const rotate = hover.value.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-12deg', '8deg'] });
  const scale = hover.value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  return (
    <Pressable {...hover.handlers} accessible={false}>
      <Animated.View style={{ transform: [{ rotate }, { scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

// Barra del pasaporte: se llena con resorte cada vez que se descubre una
// parada (escala desde la izquierda, con el driver nativo).
function ProgressBar({ value }: { value: number }) {
  const styles = useStyles();
  const [fill] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(fill, { toValue: value, friction: 7, tension: 60, delay: 250, useNativeDriver: true }).start();
  }, [value, fill]);
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { transform: [{ scaleX: fill }] }]} />
    </View>
  );
}

const STAMP = 46;

const useStyles = makeStyles((colors) => ({
  card: {
    padding: space.m + 2,
    gap: space.m - 4,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s },
  track: { height: 10, borderWidth: line, borderColor: colors.border, backgroundColor: colors.background, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill, backgroundColor: colors.accent, transformOrigin: 'left' },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s + 2 },
  stamp: { width: STAMP, height: STAMP, alignItems: 'center', justifyContent: 'center' },
  stampDone: { backgroundColor: colors.accent, borderWidth: line, borderColor: colors.border },
  stampNext: { borderWidth: line, borderStyle: 'dashed', borderColor: colors.primary },
  stampPending: { borderWidth: line, borderStyle: 'dashed', borderColor: colors.textMuted },
  number: { fontFamily: fonts.display },
}));
