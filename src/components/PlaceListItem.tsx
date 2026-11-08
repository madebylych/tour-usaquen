import { Animated, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MediaImage from '@/components/MediaImage';
import { Appear, Stamp, useHover, usePressSpring } from '@/components/motion';
import Txt from '@/components/Txt';
import { PlaceWithMedia } from '@/types';
import { makeStyles, radius, space, useTheme } from '@/theme';
import { formatDistance } from '@/utils/format';
import { tap } from '@/audio/haptics';

type Props = {
  place: PlaceWithMedia;
  position: number;
  onPress: () => void;
  distance?: number | null; // metros desde el usuario, si se conoce
  discovered?: boolean;
  next?: boolean; // la siguiente parada por descubrir: lleva el botón "Ir"
};

// Parada en una fila sobre panel gris: foto, nombre, dato corto y estado a
// la derecha (anillo con ✓ si se descubrió, "Ir" si es la siguiente,
// anillo gris si falta). Las filas entran una tras otra.
export default function PlaceListItem({ place, position, onPress, distance, discovered = false, next = false }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const press = usePressSpring(0.97);
  const hover = useHover();
  const slide = hover.value.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });
  const detail = discovered
    ? 'Descubierta'
    : distance != null
      ? `A ${formatDistance(distance)}`
      : place.summary || place.category;

  return (
    <Appear index={position - 1} from="right">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Parada ${position}: ${place.name}${discovered ? ', descubierta' : next ? ', siguiente' : ''}`}
        onPress={onPress}
        onPressIn={() => {
          tap();
          press.in();
        }}
        onPressOut={press.out}
        onHoverIn={hover.handlers.onHoverIn}
        onHoverOut={hover.handlers.onHoverOut}
      >
        {({ pressed }) => (
          <Animated.View style={[styles.row, pressed && styles.pressed, { transform: [{ scale: press.scale }, { translateX: slide }] }]}>
            <View>
              <MediaImage uri={place.media.image} style={styles.photo} label={place.name} />
              <View style={styles.number}>
                <Txt variant="caption" color={colors.text} style={styles.numberText}>
                  {position}
                </Txt>
              </View>
            </View>
            <View style={styles.texts}>
              <Txt variant="label" numberOfLines={1}>
                {place.name}
              </Txt>
              <Txt variant="caption" numberOfLines={1} color={discovered ? colors.success : undefined}>
                {detail}
              </Txt>
            </View>
            {next ? (
              <View style={styles.go}>
                <Txt variant="label" color={colors.onPrimary}>
                  Ir
                </Txt>
              </View>
            ) : (
              // Al descubrir la parada, el anillo se estampa.
              <Stamp trigger={discovered} delay={discovered ? 100 : 0}>
                <View style={[styles.ring, discovered && styles.ringDone]}>
                  {discovered ? <Ionicons name="checkmark" size={18} color={colors.primaryText} /> : null}
                </View>
              </Stamp>
            )}
          </Animated.View>
        )}
      </Pressable>
    </Appear>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 4,
    padding: space.s + 2,
    paddingRight: space.m - 2,
    backgroundColor: colors.panel,
    borderRadius: radius.m - 4,
  },
  pressed: { backgroundColor: colors.primarySoft },
  photo: { width: 48, height: 48, borderRadius: radius.s },
  number: {
    position: 'absolute',
    left: -4,
    top: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  numberText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  texts: { flex: 1, gap: 2 },
  go: {
    paddingHorizontal: space.m + 2,
    paddingVertical: space.s,
    backgroundColor: colors.primary,
    borderRadius: radius.s,
  },
  ring: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  ringDone: { borderColor: colors.primary },
}));
