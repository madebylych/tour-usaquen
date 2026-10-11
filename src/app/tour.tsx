import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';

import { useDiscoveryFeedback } from '@/audio/useDiscoveryFeedback';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import DiscoveryCard from '@/components/DiscoveryCard';
import MediaImage from '@/components/MediaImage';
import { Appear, Breathe } from '@/components/motion';
import LocationStatus from '@/components/LocationStatus';
import Passport from '@/components/Passport';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import TourMap from '@/components/TourMap';
import Txt from '@/components/Txt';
import { countDiscovered, progress, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { distanceInMeters } from '@/geo/distance';
import { simulator } from '@/geo/simulator';
import { useLocation } from '@/geo/useLocation';
import { useProximity } from '@/geo/useProximity';
import { Place, PlaceWithMedia } from '@/types';
import { line, makeStyles, shadows, space, useTheme } from '@/theme';
import { formatDistance } from '@/utils/format';
import { thud } from '@/audio/haptics';

const NO_PLACES: PlaceWithMedia[] = [];

// Tour activo: mapa con la ruta, las paradas y tu ubicación; detección de
// llegada a cada parada; pasaporte; lista de paradas con distancia y estado.
export default function TourScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  // La pantalla no se apaga mientras se está en el tour: si se apaga,
  // el GPS se detiene y no se detectan las paradas.
  useKeepAwake();

  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  const location = useLocation();
  const { discovered } = useProgress();
  const celebrate = useDiscoveryFeedback();

  const places = state.status === 'ready' && state.data ? state.data.places : NO_PLACES;
  useProximity(places, location, celebrate);

  if (!slug) return <StateMessage message="No se sabe qué recorrido abrir." showHomeButton />;
  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data)
    return <StateMessage message="No se pudo abrir el tour." onRetry={state.reload} showHomeButton />;
  const route = state.data;

  const selectedIndex = route.places.findIndex((p) => p.id === selectedId);
  const selected = selectedIndex >= 0 ? route.places[selectedIndex] : null;
  const openPlace = (id: string) => router.push(`/lugar/${id}?route=${route.slug}`);
  const complete = countDiscovered(route.places.map((p) => p.id), discovered) === route.places.length;
  const finish = () => router.push({ pathname: '/completado', params: { route: route.slug } });
  const distanceTo = (place: Place) =>
    location.position ? distanceInMeters(location.position, place) : null;
  // La primera parada sin descubrir, en el orden de la ruta.
  const nextIndex = route.places.findIndex((p) => !(p.id in discovered));
  const next = nextIndex >= 0 ? route.places[nextIndex] : null;
  const nextDistance = next ? distanceTo(next) : null;

  // "Ya estoy aquí": para cuando el GPS no detecta la llegada.
  const discoverManually = (id: string) => {
    if (progress.discover([id], { announce: true }).length > 0) celebrate();
  };

  // La simulación arranca unos 150 m al sur de la primera parada,
  // para que haya que "caminar" hasta ella.
  const toggleSimulation = () => {
    const first = route.places[0];
    if (first) simulator.toggle({ latitude: first.latitude - 0.0013, longitude: first.longitude });
  };

  return (
    <View style={styles.screen}>

      <View style={[styles.mapArea, { height: height * 0.5 }]}>
        <TourMap
          places={route.places}
          selectedId={selectedId}
          discoveredIds={discovered}
          onSelect={(id) => {
            thud();
            setSelectedId(id);
          }}
          userPosition={location.position}
          userAccuracy={location.accuracy}
          simulated={location.status === 'simulated'}
          onMapPress={simulator.moveTo}
          illustratedMap={
            route.media.map && route.map_bounds ? { uri: route.media.map, bounds: route.map_bounds } : null
          }
        />
        <LocationStatus location={location} onLongPress={toggleSimulation} />
        {selected ? (
          <SelectedPlace
            key={selected.id}
            place={selected}
            position={selectedIndex + 1}
            discovered={selected.id in discovered}
            onOpen={() => openPlace(selected.id)}
            onImHere={() => discoverManually(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Passport places={route.places} discovered={discovered} />
        {next ? (
          // Al descubrir una parada, la siguiente entra desde la derecha.
          <Appear key={next.id} from="right" style={styles.next}>
            <View style={styles.grow}>
              <Txt variant="overline">SIGUIENTE</Txt>
              <Txt variant="heading" numberOfLines={1}>
                {next.name}
              </Txt>
            </View>
            {nextDistance != null ? (
              <Breathe>
                <View style={styles.nextDistance}>
                  <Txt variant="label" color={colors.onAccent}>
                    {formatDistance(nextDistance)}
                  </Txt>
                </View>
              </Breathe>
            ) : null}
          </Appear>
        ) : null}
        <Txt variant="heading" highlight style={styles.listTitle}>
          Paradas
        </Txt>
        <View style={styles.list}>
          {route.places.map((place, index) => (
            <PlaceListItem
              key={place.id}
              place={place}
              position={index + 1}
              distance={distanceTo(place)}
              discovered={place.id in discovered}
              onPress={() => openPlace(place.id)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          {complete ? (
            <Button label="Ver resumen del recorrido" icon="ribbon" onPress={finish} />
          ) : (
            <Button label="Terminar recorrido" variant="secondary" onPress={finish} />
          )}
        </View>
      </BottomBar>

      <DiscoveryCard places={route.places} onOpen={openPlace} />
    </View>
  );
}

// Tarjeta flotante sobre el mapa con la parada tocada.
function SelectedPlace({
  place,
  position,
  discovered,
  onOpen,
  onImHere,
  onClose,
}: {
  place: PlaceWithMedia;
  position: number;
  discovered: boolean;
  onOpen: () => void;
  onImHere: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    // Sube desde abajo cada vez que se toca otro pin (key = id de la parada).
    <Appear style={styles.floating}>
      <View style={styles.floatingRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir parada ${position}: ${place.name}`}
          onPress={onOpen}
          style={styles.floatingMain}
        >
          <MediaImage uri={place.media.image} style={styles.floatingImage} label={place.name} />
          <View style={styles.grow}>
            <Txt variant="overline">
              {discovered ? `PARADA ${position}, DESCUBIERTA` : `PARADA ${position}`}
            </Txt>
            <Txt variant="label" numberOfLines={1}>
              {place.name}
            </Txt>
            <Txt variant="caption">Ver parada</Txt>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
      </View>
      {discovered ? null : <Button label="Ya estoy aquí" variant="light" onPress={onImHere} />}
    </Appear>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  mapArea: { backgroundColor: colors.primarySoft, borderBottomWidth: line, borderColor: colors.border },
  content: { padding: space.m + 4, gap: space.m - 4, paddingBottom: BOTTOM_BAR_SPACE },
  list: { gap: space.m - 4 },
  listTitle: { marginTop: space.s },
  next: { flexDirection: 'row', alignItems: 'center', gap: space.m - 4, paddingVertical: space.xs },
  nextDistance: {
    paddingVertical: space.s,
    paddingHorizontal: space.m - 4,
    backgroundColor: colors.accent,
    borderWidth: line,
    borderColor: colors.border,
  },
  grow: { flex: 1 },
  floating: {
    position: 'absolute',
    left: space.m,
    right: space.m,
    bottom: space.m,
    gap: space.s,
    padding: space.s + 2,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
    boxShadow: shadows(colors).floating,
  },
  floatingRow: { flexDirection: 'row', alignItems: 'center', gap: space.s, paddingRight: space.xs },
  floatingMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.m - 4 },
  floatingImage: { width: 56, height: 56 },
}));
