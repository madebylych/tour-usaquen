import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { listRoutes } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, fontSize, space } from '@/theme';

// Intro: qué es el proyecto y cómo se usa. Textos provisionales.
// Con una sola ruta en el MVP, el botón lleva directo a ella.
export default function IntroScreen() {
  const routes = useData(listRoutes, 'routes');
  const firstRoute = routes.status === 'ready' ? routes.data[0] : undefined;

  return (
    <Screen>
      <Text style={styles.title}>Distrito Creativo de Usaquén</Text>
      <Text style={styles.body}>
        Una experiencia de exploración espacial y sonora. Camina, descubre y escucha el territorio.
      </Text>
      {firstRoute ? (
        <Button label="Ver recorrido" onPress={() => router.push(`/ruta/${firstRoute.slug}`)} />
      ) : routes.status === 'loading' ? null : (
        <Text style={styles.muted}>No hay recorridos disponibles.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: space.xl },
  body: { fontSize: fontSize.body, lineHeight: 24, color: colors.text },
  muted: { fontSize: fontSize.body, color: colors.textMuted },
});
