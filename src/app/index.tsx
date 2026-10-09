import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import MediaImage from '@/components/MediaImage';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { getRoute, listRoutes } from '@/data/source';
import { countDiscovered, useProgress } from '@/data/progress';
import { useData } from '@/data/useData';
import { colors, line, space } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';

// Inicio. Con una sola ruta en el MVP, la ruta destacada es la primera.
async function loadFeaturedRoute() {
  const routes = await listRoutes();
  return routes[0] ? getRoute(routes[0].slug) : null;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const state = useData(loadFeaturedRoute, 'featured');
  const { discovered } = useProgress();

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error')
    return <StateMessage message="No se pudo cargar el contenido. Revisa tu conexión." onRetry={state.reload} />;
  const route = state.data;
  if (!route)
    return (
      <StateMessage
        message="No hay recorridos disponibles. Si no tienes conexión, conéctate para cargarlos."
        onRetry={state.reload}
      />
    );

  const openRoute = () => router.push(`/ruta/${route.slug}`);
  const done = countDiscovered(route.places.map((p) => p.id), discovered);
  const meta = [
    route.duration_min != null ? formatDuration(route.duration_min) : null,
    route.distance_m != null ? formatDistance(route.distance_m) : null,
    `${route.places.length} paradas`,
    done > 0 ? `${done} descubiertas` : null,
  ].filter(Boolean);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.l, paddingBottom: space.xl }]}
    >
      <StatusBar style="dark" />
      <View style={styles.topRow}>
        <Txt variant="overline" color={colors.text}>
          USAQUÉN, BOGOTÁ
        </Txt>
        <Txt variant="overline">N.º 01</Txt>
      </View>

      <Txt variant="display" riso style={styles.headline}>
        Camina, escucha, descubre.
      </Txt>

      <View>
        <MediaImage uri={route.media.cover} style={styles.cover} label={route.name} />
        <View style={styles.sticker}>
          <Txt variant="label">Recorrido 01</Txt>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <Txt variant="title">{route.name}</Txt>
        <Txt variant="caption">{meta.join(' / ')}</Txt>
      </View>
      <Button label="Ver recorrido" icon="arrow-forward" iconRight onPress={openRoute} />

      <Txt variant="heading" style={styles.sectionTitle}>
        Boletos del recorrido
      </Txt>
      <View style={styles.list}>
        {route.places.map((place, index) => (
          <PlaceListItem
            key={place.id}
            place={place}
            position={index + 1}
            discovered={place.id in discovered}
            onPress={() => router.push(`/lugar/${place.id}?route=${route.slug}`)}
          />
        ))}
      </View>

      <Txt variant="caption" style={styles.footer}>
        Un proyecto de Creación Digital, Arquitectura y Música.
      </Txt>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.m + 6, gap: space.m },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headline: { marginTop: space.m, marginBottom: space.s },
  cover: { height: 220 },
  sticker: {
    position: 'absolute',
    left: space.m - 4,
    bottom: space.m + 4,
    paddingVertical: space.s,
    paddingHorizontal: space.m - 4,
    backgroundColor: colors.accent,
    borderWidth: line,
    borderColor: colors.border,
    transform: [{ rotate: '-6deg' }],
  },
  routeInfo: { gap: space.xs, marginTop: space.s },
  sectionTitle: { marginTop: space.m },
  list: { gap: space.m - 4 },
  footer: { textAlign: 'center', marginTop: space.m },
});
