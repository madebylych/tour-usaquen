import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { countDiscovered } from '@/data/progress';
import { Place } from '@/types';
import { colors, fonts, line, space } from '@/theme';

type Props = {
  places: Place[]; // paradas de la ruta, en orden
  discovered: Record<string, number>;
};

// Inclinación de cada sello descubierto: así parecen estampados a mano.
const TILT = ['-6deg', '4deg', '-3deg', '7deg', '-5deg', '3deg'];

// Pasaporte creativo: cuántas paradas se descubrieron y un sello por parada.
export default function Passport({ places, discovered }: Props) {
  const total = places.length;
  const done = countDiscovered(places.map((p) => p.id), discovered);
  const complete = total > 0 && done === total;

  return (
    <View style={styles.card} accessibilityLabel={`Pasaporte creativo: ${done} de ${total} paradas descubiertas`}>
      <View style={styles.header}>
        <Txt variant="overline">PASAPORTE CREATIVO</Txt>
        <Txt variant="label">{complete ? '¡Completo!' : `${done} de ${total}`}</Txt>
      </View>

      <View style={styles.stamps}>
        {places.map((place, index) => {
          const isDone = place.id in discovered;
          return (
            <View
              key={place.id}
              style={[
                styles.stamp,
                isDone ? [styles.stampDone, { transform: [{ rotate: TILT[index % TILT.length] }] }] : styles.stampPending,
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={22} color={colors.text} />
              ) : (
                <Txt variant="label" color={colors.textMuted} style={styles.number}>
                  {String(index + 1).padStart(2, '0')}
                </Txt>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const STAMP = 46;

const styles = StyleSheet.create({
  card: {
    padding: space.m + 2,
    gap: space.m - 4,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s + 2 },
  stamp: { width: STAMP, height: STAMP, alignItems: 'center', justifyContent: 'center' },
  stampDone: { backgroundColor: colors.accent, borderWidth: line, borderColor: colors.border },
  stampPending: { borderWidth: line, borderStyle: 'dashed', borderColor: colors.textMuted },
  number: { fontFamily: fonts.display },
});
