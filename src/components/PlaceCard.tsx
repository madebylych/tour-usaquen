import { Pressable, StyleSheet, View } from 'react-native';

import ImagePlaceholder from '@/components/ImagePlaceholder';
import Txt from '@/components/Txt';
import { Place } from '@/types';
import { colors, radius, shadow, space } from '@/theme';

type Props = {
  place: Place;
  position: number;
  onPress: () => void;
};

// Tarjeta vertical para carruseles horizontales.
export default function PlaceCard({ place, position, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Parada ${position}: ${place.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <ImagePlaceholder category={place.category} style={styles.image} />
        <View style={styles.badge}>
          <Txt variant="label" color={colors.onPrimary}>
            {position}
          </Txt>
        </View>
      </View>
      <View style={styles.body}>
        <Txt variant="label" numberOfLines={1}>
          {place.name}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {place.category}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    boxShadow: shadow.card,
  },
  pressed: { transform: [{ scale: 0.97 }] },
  image: {
    height: 120,
    borderTopLeftRadius: radius.m,
    borderTopRightRadius: radius.m,
  },
  badge: {
    position: 'absolute',
    top: space.s,
    left: space.s,
    minWidth: 28,
    height: 28,
    paddingHorizontal: space.s,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: space.m - 4, gap: 2 },
});
