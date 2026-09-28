import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import DownloadButton from '@/components/DownloadButton';
import MediaImage from '@/components/MediaImage';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { useRouteDownload } from '@/data/useRouteDownload';
import { colors, radius, space } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';

// Detalle de la ruta: datos generales, paradas en orden y descarga offline.
export default function RouteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const state = useData(() => getRoute(slug), slug);
  const download = useRouteDownload(slug);

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error') return <StateMessage message="No se pudo cargar el recorrido. Revisa tu conexión." showHomeButton />;
  const route = state.data;
  if (!route) return <StateMessage message="Este recorrido no existe." showHomeButton />;

  return (
    <View style={styles.screen}>
      {/* Barra de estado oscura sobre la imagen clara. */}
      <StatusBar style="dark" />
      <BackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE }}>
        <MediaImage uri={route.media.cover} style={styles.hero} iconSize={64} label={route.name} />

        <View style={styles.sheet}>
          <Txt variant="title">{route.name}</Txt>
          <View style={styles.chipRow}>
            {route.duration_min != null ? (
              <Chip icon="time-outline" label={formatDuration(route.duration_min)} />
            ) : null}
            {route.distance_m != null ? (
              <Chip icon="walk-outline" label={formatDistance(route.distance_m)} />
            ) : null}
            <Chip icon="flag-outline" label={`${route.places.length} paradas`} />
          </View>
          {route.description ? <Txt variant="body">{route.description}</Txt> : null}

          <Txt variant="heading" style={styles.sectionTitle}>
            Paradas
          </Txt>
          <View style={styles.list}>
            {route.places.map((place, index) => (
              <PlaceListItem
                key={place.id}
                place={place}
                position={index + 1}
                onPress={() => router.push(`/lugar/${place.id}?route=${route.slug}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomBar>
        <DownloadButton status={download.status} onDownload={download.start} onDelete={download.remove} />
        <View style={styles.grow}>
          <Button
            label="Comenzar tour"
            icon="navigate"
            onPress={() => router.push({ pathname: '/tour', params: { route: route.slug } })}
          />
        </View>
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 280 },
  sheet: {
    marginTop: -radius.l,
    padding: space.m + 4,
    paddingTop: space.l,
    gap: space.m - 4,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  sectionTitle: { marginTop: space.m },
  list: { gap: space.m - 4 },
  grow: { flex: 1 },
});
