import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import ImagePlaceholder from '@/components/ImagePlaceholder';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, radius, space } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';

// Detalle de la ruta: datos generales y paradas en orden.
// La descarga offline llega en la fase 7.
export default function RouteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const state = useData(() => getRoute(slug), slug);

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error') return <StateMessage message="No se pudo cargar el recorrido." />;
  const route = state.data;
  if (!route) return <StateMessage message="Este recorrido no existe." />;

  return (
    <View style={styles.screen}>
      {/* Barra de estado oscura sobre la imagen clara. */}
      <StatusBar style="dark" />
      <BackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE }}>
        <ImagePlaceholder style={styles.hero} iconSize={64} />

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
                onPress={() => router.push(`/lugar/${place.id}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomBar>
        <Button label="Descargar" icon="download-outline" variant="secondary" onPress={() => {}} />
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
