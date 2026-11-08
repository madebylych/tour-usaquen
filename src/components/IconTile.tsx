import { ComponentProps } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useHover, usePressSpring } from '@/components/motion';
import Txt from '@/components/Txt';
import { makeStyles, radius, space, useTheme } from '@/theme';
import { tap } from '@/audio/haptics';

// Colores pastel fijos de las baldosas (no cambian con el color de acento):
// cada acceso tiene su color, como las baldosas de la referencia.
export const TILE_COLORS = {
  verde: '#A6E3A9',
  morado: '#D3BFF7',
  rosado: '#FFC1D6',
  lima: '#E2F39A',
  amarillo: '#FFE08A',
  lavanda: '#C5CCF8',
  menta: '#B6E5D6',
  durazno: '#FFD0B5',
} as const;

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
  badge?: string | number | null; // numerito en la esquina
  size?: number;
};

// Acceso rápido: baldosa de color con brillo arriba y el ícono en tinta,
// con su nombre debajo. Se hunde un poco al tocarla.
export default function IconTile({ icon, label, color, onPress, badge, size = 64 }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const press = usePressSpring(0.92);
  const hover = useHover();
  const lift = hover.value.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={hover.handlers.onHoverIn}
      onHoverOut={hover.handlers.onHoverOut}
      onPressIn={() => {
        tap();
        press.in();
      }}
      onPressOut={press.out}
      style={styles.wrap}
    >
      <Animated.View
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: size * 0.32, backgroundColor: color },
          { transform: [{ scale: press.scale }, { translateY: lift }] },
        ]}
      >
        <View style={[styles.shine, { width: size * 0.46, height: size * 0.24, borderRadius: size }]} />
        <Ionicons name={icon} size={size * 0.46} color="#2B2B36" />
        {badge != null && badge !== 0 ? (
          <View style={styles.badge}>
            <Txt variant="caption" color={colors.onPrimary} style={styles.badgeText}>
              {badge}
            </Txt>
          </View>
        ) : null}
      </Animated.View>
      <Txt variant="caption" numberOfLines={1} style={styles.label}>
        {label}
      </Txt>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { alignItems: 'center', gap: space.s - 2 },
  tile: { alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 10px #15151A1F' },
  shine: { position: 'absolute', top: 6, left: 8, backgroundColor: '#FFFFFF73' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  label: { color: colors.text, fontSize: 12 },
}));
