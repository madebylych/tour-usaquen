import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ImagePlaceholder from '@/components/ImagePlaceholder';
import Txt from '@/components/Txt';
import { Place } from '@/types';
import { colors, radius, shadow, space } from '@/theme';

type Props = {
  place: Place;
  position: number;
  onPress: () => void;
};

// Tarjeta horizontal de una parada dentro de una lista.
export default function PlaceListItem({ place, position, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Parada ${position}: ${place.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <ImagePlaceholder category={place.category} iconSize={28} style={styles.image} />
        <View style={styles.badge}>
          <Txt variant="caption" color={colors.onPrimary} style={styles.badgeText}>
            {position}
          </Txt>
        </View>
      </View>
      <View style={styles.texts}>
        <Txt variant="label" numberOfLines={1}>
          {place.name}
        </Txt>
        <Txt variant="caption">{place.category}</Txt>
        {place.summary ? (
          <Txt variant="caption" color={colors.text} numberOfLines={2}>
            {place.summary}
          </Txt>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 4,
    padding: space.s + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    boxShadow: shadow.card,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  image: { width: 72, height: 72, borderRadius: radius.s },
  badge: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, lineHeight: 14 },
  texts: { flex: 1, gap: 2 },
});
