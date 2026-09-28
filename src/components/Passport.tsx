import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { countDiscovered } from '@/data/progress';
import { Place } from '@/types';
import { colors, radius, shadow, space } from '@/theme';
import { categoryIcon } from '@/utils/categories';

type Props = {
  places: Place[]; // paradas de la ruta, en orden
  discovered: Record<string, number>;
  onPrimary?: boolean; // versión para fondo fucsia (pantalla final)
};

// Pasaporte creativo: cuántas paradas se descubrieron y un sello por parada.
export default function Passport({ places, discovered, onPrimary = false }: Props) {
  const total = places.length;
  const done = countDiscovered(places.map((p) => p.id), discovered);
  const complete = total > 0 && done === total;
  const textColor = onPrimary ? colors.onPrimary : colors.text;

  return (
    <View
      style={[styles.card, onPrimary && styles.cardOnPrimary]}
      accessibilityLabel={`Pasaporte creativo: ${done} de ${total} paradas descubiertas`}
    >
      <View style={styles.header}>
        <Txt variant="caption" color={onPrimary ? colors.onPrimary : colors.primary}>
          PASAPORTE CREATIVO
        </Txt>
        <Txt variant="label" color={textColor}>
          {complete ? '¡Recorrido completo!' : `${done} de ${total} descubiertas`}
        </Txt>
      </View>

      <View style={[styles.track, onPrimary && styles.trackOnPrimary]}>
        <View
          style={[
            styles.fill,
            onPrimary && styles.fillOnPrimary,
            { width: `${total > 0 ? (done / total) * 100 : 0}%` },
          ]}
        />
      </View>

      <View style={styles.stamps}>
        {places.map((place, index) => {
          const isDone = place.id in discovered;
          return (
            <View
              key={place.id}
              style={[
                styles.stamp,
                isDone ? styles.stampDone : styles.stampPending,
                onPrimary && (isDone ? styles.stampDoneOnPrimary : styles.stampPendingOnPrimary),
              ]}
            >
              {isDone ? (
                <Ionicons
                  name={categoryIcon(place.category)}
                  size={20}
                  color={onPrimary ? colors.primary : colors.onPrimary}
                />
              ) : (
                <Txt variant="label" color={onPrimary ? colors.onPrimary : colors.textMuted}>
                  {index + 1}
                </Txt>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const STAMP = 44;

const styles = StyleSheet.create({
  card: {
    padding: space.m,
    gap: space.m - 4,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  cardOnPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    boxShadow: 'none',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  trackOnPrimary: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  fillOnPrimary: { backgroundColor: colors.surface },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s + 2 },
  stamp: {
    width: STAMP,
    height: STAMP,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampDone: { backgroundColor: colors.primary },
  stampPending: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border },
  stampDoneOnPrimary: { backgroundColor: colors.surface },
  stampPendingOnPrimary: { borderColor: 'rgba(255, 255, 255, 0.5)' },
});
