import { ComponentProps, useState } from 'react';
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
import PlaceListItem from '@/components/PlaceListItem';
import PlaceStamps from '@/components/PlaceStamps';
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
import { makeStyles, radius, shadows, space, useTheme } from '@/theme';
import { formatDistance } from '@/utils/format';
import { tap, thud } from '@/audio/haptics';

const NO_PLACES: PlaceWithMedia[] = [];
const WALK_SPEED = 1.2; // m/s, paso tranquilo de paseo

type IconName = ComponentProps<typeof Ionicons>['name'];

// Tour activo: mapa con la ruta, las paradas y tu ubicación; detección de
// llegada a cada parada; selector de paradas, datos del recorrido y lista.
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
  const total = route.places.length;
  const done = countDiscovered(route.places.map((p) => p.id), discovered);
  const complete = done === total;
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

  const gps =
    location.status === 'simulated'
      ? 'Simulado'
      : location.accuracy != null
        ? `± ${Math.round(location.accuracy)} m`
        : location.status === 'requesting'
          ? 'Buscando…'
          : 'Sin señal';

  return (
    <View style={styles.screen}>
      <View style={[styles.mapArea, { height: height * 0.45 }]}>
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

      {/* Hoja que se monta sobre el mapa. */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        {/* Selector de paradas: la siguiente en color. */}
        <View style={styles.selector}>
          {route.places.map((place, i) => {
            const isNext = place.id === next?.id;
            const isDone = place.id in discovered;
            const isSelected = place.id === selectedId;
            return (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={`Parada ${i + 1}: ${place.name}${isDone ? ', descubierta' : isNext ? ', siguiente' : ''}`}
                onPress={() => {
                  tap();
                  setSelectedId(place.id);
                }}
                style={[styles.day, isNext && styles.dayNext, isSelected && styles.daySelected]}
              >
                <Txt variant="caption" numberOfLines={1} color={isNext ? colors.onPrimary : colors.textMuted} style={styles.dayName}>
                  {shortName(place.name)}
                </Txt>
                {isDone ? (
                  <Ionicons name="checkmark-circle" size={22} color={isNext ? colors.onPrimary : colors.primaryText} />
                ) : (
                  <Txt variant="heading" color={isNext ? colors.onPrimary : colors.textMuted}>
                    {String(i + 1).padStart(2, '0')}
                  </Txt>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Pastilla de progreso. */}
        <Appear key={next?.id ?? 'fin'} from="right" style={styles.pill}>
          <PlaceStamps places={route.places} discovered={discovered} size={34} overlap={11} />
          <View style={styles.grow}>
            <Txt variant="label" style={styles.pillTitle}>
              {complete ? '¡Pasaporte completo!' : `${done} de ${total} sellos`}
            </Txt>
            <Txt variant="caption" numberOfLines={2}>
              {next ? `Camina hacia ${next.name}` : 'Descubriste todas las paradas'}
            </Txt>
          </View>
        </Appear>

        <Txt variant="title" style={styles.sectionTitle}>
          Tu recorrido
        </Txt>
        <View style={styles.grid}>
          <Stat
            icon="location-outline"
            color="#F28BB0"
            label="Siguiente parada"
            value={next ? (nextDistance != null ? formatDistance(nextDistance) : '—') : 'Listo'}
            breathe={nextDistance != null}
          />
          <Stat
            icon="walk-outline"
            color="#8E9BEA"
            label="Tiempo a pie"
            value={nextDistance != null ? `${Math.max(1, Math.round(nextDistance / WALK_SPEED / 60))} min` : '—'}
          />
          <Stat icon="star-outline" color="#FFB020" label="Sellos" value={`${done} de ${total}`} />
          <Stat icon="locate-outline" color="#5FBF73" label="Precisión GPS" value={gps} />
        </View>

        <Txt variant="title" style={styles.sectionTitle}>
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
              next={place.id === next?.id}
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

// Nombre corto para el selector: "Plaza de Usaquén" -> "Plaza".
function shortName(name: string): string {
  return name.split(/\s+/)[0];
}

function Stat({
  icon,
  color,
  label,
  value,
  breathe = false,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: string;
  breathe?: boolean;
}) {
  const styles = useStyles();
  const valueEl = <Txt variant="heading">{value}</Txt>;
  return (
    <View style={styles.stat}>
      <View style={styles.statHead}>
        <Ionicons name={icon} size={18} color={color} />
        <Txt variant="label" style={styles.statLabel} numberOfLines={1}>
          {label}
        </Txt>
      </View>
      {breathe ? <Breathe>{valueEl}</Breathe> : valueEl}
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
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
      {discovered ? null : <Button label="Ya estoy aquí" variant="accent" icon="location" onPress={onImHere} />}
    </Appear>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  grow: { flex: 1 },
  mapArea: { backgroundColor: colors.panel },
  sheet: {
    flex: 1,
    marginTop: -26,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.l + 4,
    borderTopRightRadius: radius.l + 4,
    boxShadow: `0px -6px 20px ${colors.text}14`,
  },
  content: { padding: space.m + 4, paddingTop: space.l, gap: space.m, paddingBottom: BOTTOM_BAR_SPACE },
  selector: { flexDirection: 'row', gap: space.s },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.m - 4,
    backgroundColor: colors.panel,
    borderRadius: radius.m - 4,
  },
  dayNext: { backgroundColor: colors.primary },
  daySelected: { boxShadow: `0px 0px 0px 2px ${colors.text}` },
  dayName: { fontSize: 11, lineHeight: 14 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 4,
    padding: space.m - 2,
    backgroundColor: colors.panel,
    borderRadius: radius.m,
  },
  pillTitle: { fontSize: 14 },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginTop: space.s },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s + 2 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: space.s + 2,
    padding: space.m - 2,
    backgroundColor: colors.panel,
    borderRadius: radius.m - 2,
  },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: space.s - 2 },
  statLabel: { fontSize: 13, flexShrink: 1 },
  list: { gap: space.s + 2 },
  floating: {
    position: 'absolute',
    left: space.m,
    right: space.m,
    bottom: space.l + 14,
    gap: space.s,
    padding: space.s + 2,
    backgroundColor: colors.surface,
    boxShadow: shadows(colors).floating,
    borderRadius: radius.m,
  },
  floatingRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  floatingMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.m - 4 },
  floatingImage: { width: 56, height: 56, borderRadius: radius.s },
  close: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderRadius: radius.pill,
  },
}));
