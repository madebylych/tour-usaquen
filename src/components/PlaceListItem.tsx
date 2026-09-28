import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MediaImage from '@/components/MediaImage';
import Txt from '@/components/Txt';
import { PlaceWithMedia } from '@/types';
import { colors, radius, shadow, space } from '@/theme';
import { formatDistance } from '@/utils/format';

type Props = {
  place: PlaceWithMedia;
  position: number;
  onPress: () => void;
  distance?: number | null; // metros desde el usuario, si se conoce
  discovered?: boolean;
};

// Tarjeta horizontal de una parada dentro de una lista.
export default function PlaceListItem({ place, position, onPress, distance, discovered = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Parada ${position}: ${place.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <MediaImage uri={place.media.image} category={place.category} iconSize={28} style={styles.image} label={place.name} />
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
        {discovered ? (
          <View style={styles.discovered}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Txt variant="caption" color={colors.primary}>
              Descubierta
            </Txt>
          </View>
        ) : (
          <Txt variant="caption">{place.category}</Txt>
        )}
        {place.summary ? (
          <Txt variant="caption" color={colors.text} numberOfLines={2}>
            {place.summary}
          </Txt>
        ) : null}
      </View>
      {distance != null ? (
        <Txt variant="label" color={colors.primary}>
          {formatDistance(distance)}
        </Txt>
      ) : null}
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
  discovered: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
