import { Animated, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Appear, Stamp, useHover, usePressSpring } from '@/components/motion';
import Txt from '@/components/Txt';
import { Place } from '@/types';
import { fonts, line, makeStyles, space, useTheme } from '@/theme';
import { formatDistance } from '@/utils/format';

type Props = {
  place: Place;
  position: number;
  onPress: () => void;
  distance?: number | null; // metros desde el usuario, si se conoce
  discovered?: boolean;
};

// Parada como boleto: talón con el número (amarillo si ya se descubrió),
// línea punteada de corte y los datos de la parada. Los boletos salen uno
// tras otro, como de una impresora.
export default function PlaceListItem({ place, position, onPress, distance, discovered = false }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const press = usePressSpring(0.97);
  const hover = useHover();
  const slide = hover.value.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  return (
    <Appear index={position - 1} from="right">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Parada ${position}: ${place.name}${discovered ? ', descubierta' : ''}`}
        onPress={onPress}
        onPressIn={press.in}
        onPressOut={press.out}
        // Con el mouse encima el boleto se corre un poco y la flecha avanza.
        onHoverIn={hover.handlers.onHoverIn}
        onHoverOut={hover.handlers.onHoverOut}
      >
        {({ pressed }) => (
          <Animated.View style={[styles.ticket, pressed && styles.pressed, { transform: [{ scale: press.scale }, { translateX: slide }] }]}>
            <View style={[styles.stub, discovered ? styles.stubDone : styles.stubPending]}>
              {/* Al descubrir la parada, el número se vuelve a estampar. */}
              <Stamp trigger={discovered} delay={discovered ? 100 : 0} rotate={discovered ? '-8deg' : '0deg'}>
                <Txt variant="heading" color={discovered ? colors.onAccent : colors.primary} style={styles.number}>
                  {String(position).padStart(2, '0')}
                </Txt>
              </Stamp>
            </View>
            {/* Línea de corte del boleto. Se dibuja con guiones porque el borde
                punteado de un solo lado falla en Android. */}
            <View style={styles.cut}>
              {DASHES.map((i) => (
                <View key={i} style={styles.dash} />
              ))}
            </View>
            <View style={styles.body}>
              <View style={styles.texts}>
                <Txt variant="label" numberOfLines={1}>
                  {place.name}
                </Txt>
                {discovered ? (
                  <View style={styles.discovered}>
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                    <Txt variant="caption" color={colors.primary}>
                      Descubierta
                    </Txt>
                  </View>
                ) : (
                  <Txt variant="caption" numberOfLines={1}>
                    {place.category}
                  </Txt>
              )}
            </View>
            {distance != null ? (
              <Txt variant="label" color={colors.primary}>
                {formatDistance(distance)}
              </Txt>
            ) : null}
            <Animated.View style={{ transform: [{ translateX: slide }] }}>
              <Ionicons name="arrow-forward" size={18} color={colors.text} />
            </Animated.View>
          </View>
        </Animated.View>
        )}
      </Pressable>
    </Appear>
  );
}

const DASHES = [0, 1, 2, 3, 4, 5, 6, 7];

const useStyles = makeStyles((colors) => ({
  ticket: {
    flexDirection: 'row',
    minHeight: 66,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.primarySoft },
  stub: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cut: { width: line, justifyContent: 'space-between', paddingVertical: 3 },
  dash: { height: 4, backgroundColor: colors.border },
  stubDone: { backgroundColor: colors.accent },
  stubPending: { backgroundColor: colors.primarySoft },
  number: { fontFamily: fonts.display, fontSize: 20 },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 4,
    paddingVertical: space.s + 2,
    paddingHorizontal: space.m - 2,
  },
  texts: { flex: 1, gap: 2 },
  discovered: { flexDirection: 'row', alignItems: 'center', gap: 3 },
}));
