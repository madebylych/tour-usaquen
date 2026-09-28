import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Place } from '@/types';
import { colors, fontSize, space } from '@/theme';

type Props = {
  place: Place;
  position: number;
  onPress: () => void;
};

// Fila de una parada dentro de la lista de la ruta.
export default function PlaceListItem({ place, position, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.number}>
        <Text style={styles.numberText}>{position}</Text>
      </View>
      <View style={styles.texts}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.meta}>{place.category}</Text>
        {place.summary ? <Text style={styles.summary}>{place.summary}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.m,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.onAccent, fontWeight: '700' },
  texts: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.small, color: colors.textMuted },
  summary: { fontSize: fontSize.small, color: colors.text, marginTop: 2 },
});
