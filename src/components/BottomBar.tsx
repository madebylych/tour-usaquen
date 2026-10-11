import { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/motion';
import { line, makeStyles, space } from '@/theme';

// Barra fija abajo para la acción principal de la pantalla. Sube al abrir
// la pantalla.
export default function BottomBar({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Appear delay={180} style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
      {children}
    </Appear>
  );
}

// Espacio que el contenido desplazable debe dejar libre para no quedar tapado.
export const BOTTOM_BAR_SPACE = 110;

const useStyles = makeStyles((colors) => ({
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
}));
