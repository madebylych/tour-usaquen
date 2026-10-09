import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, line, space } from '@/theme';

// Barra fija abajo para la acción principal de la pantalla.
export default function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.m) }]}>{children}</View>
  );
}

// Espacio que el contenido desplazable debe dejar libre para no quedar tapado.
export const BOTTOM_BAR_SPACE = 110;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: space.s + 4,
    paddingTop: space.m,
    paddingHorizontal: space.m + 4,
    backgroundColor: colors.surface,
    borderTopWidth: line,
    borderColor: colors.border,
  },
});
