import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import ImagePlaceholder from '@/components/ImagePlaceholder';
import LocationStatus from '@/components/LocationStatus';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import TourMap from '@/components/TourMap';
import Txt from '@/components/Txt';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { distanceInMeters } from '@/geo/distance';
import { simulator } from '@/geo/simulator';
import { useLocation } from '@/geo/useLocation';
import { Place } from '@/types';
import { colors, radius, shadow, space } from '@/theme';

// Tour activo: mapa con la ruta, las paradas y tu ubicación + lista de
// paradas con la distancia a cada una. El progreso llega en la fase 5.
export default function TourScreen() {
  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  const location = useLocation();

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data) return <StateMessage message="No se pudo abrir el tour." />;
  const route = state.data;

  const selectedIndex = route.places.findIndex((p) => p.id === selectedId);
  const selected = selectedIndex >= 0 ? route.places[selectedIndex] : null;
  const openPlace = (id: string) => router.push(`/lugar/${id}`);
  const distanceTo = (place: Place) =>
    location.position ? distanceInMeters(location.position, place) : null;

  // La simulación arranca unos 150 m al sur de la primera parada,
  // para que haya que "caminar" hasta ella.
  const toggleSimulation = () => {
    const first = route.places[0];
    if (first) simulator.toggle({ latitude: first.latitude - 0.0013, longitude: first.longitude });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.mapArea, { height: height * 0.5 }]}>
        <TourMap
          places={route.places}
          selectedId={selectedId}
          onSelect={setSelectedId}
          userPosition={location.position}
          userAccuracy={location.accuracy}
          simulated={location.status === 'simulated'}
          onMapPress={simulator.moveTo}
        />
        <LocationStatus location={location} onLongPress={toggleSimulation} />
        {selected ? (
          <SelectedPlace
            place={selected}
            position={selectedIndex + 1}
            onOpen={() => openPlace(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Txt variant="heading">Paradas</Txt>
        <View style={styles.list}>
          {route.places.map((place, index) => (
            <PlaceListItem
              key={place.id}
              place={place}
              position={index + 1}
              distance={distanceTo(place)}
              onPress={() => openPlace(place.id)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          <Button label="Terminar recorrido" icon="flag" onPress={() => router.push('/completado')} />
        </View>
      </BottomBar>
    </View>
  );
}

// Tarjeta flotante sobre el mapa con la parada tocada.
function SelectedPlace({
  place,
  position,
  onOpen,
  onClose,
}: {
  place: Place;
  position: number;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.floating}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir parada ${position}: ${place.name}`}
        onPress={onOpen}
        style={styles.floatingMain}
      >
        <ImagePlaceholder category={place.category} iconSize={26} style={styles.floatingImage} />
        <View style={styles.grow}>
          <Txt variant="caption" color={colors.primary}>
            PARADA {position}
          </Txt>
          <Txt variant="label" numberOfLines={1}>
            {place.name}
          </Txt>
          <Txt variant="caption">Ver parada</Txt>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10}>
        <Ionicons name="close" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  mapArea: { backgroundColor: colors.primarySoft },
  content: { padding: space.m + 4, gap: space.m - 4, paddingBottom: BOTTOM_BAR_SPACE },
  list: { gap: space.m - 4 },
  grow: { flex: 1 },
  floating: {
    position: 'absolute',
    left: space.m,
    right: space.m,
    bottom: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    padding: space.s + 2,
    paddingRight: space.m - 2,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    boxShadow: shadow.floating,
  },
  floatingMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.m - 4 },
  floatingImage: { width: 56, height: 56, borderRadius: radius.s },
});
