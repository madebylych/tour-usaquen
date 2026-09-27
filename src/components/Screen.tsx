import { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { colors, space } from '@/theme';

// Contenedor común de las pantallas con contenido desplazable.
export default function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.l, gap: space.m },
});
