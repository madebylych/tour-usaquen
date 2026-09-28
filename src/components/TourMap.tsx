import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Circle, MapStyleElement, Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { Coordinates } from '@/geo/distance';
import { Place } from '@/types';
import { colors, radius, shadow, space } from '@/theme';

type Props = {
  places: Place[]; // en el orden de la ruta
  selectedId: string | null;
  onSelect: (id: string) => void;
  userPosition: Coordinates | null;
  userAccuracy: number | null; // metros; null si es simulada
  simulated: boolean;
  onMapPress: (coordinate: Coordinates) => void;
};

// Mapa del tour (Android / iOS). En web se usa TourMap.web.tsx.
// El mapa ilustrado (fase 8) se agrega aquí.
export default function TourMap({
  places,
  selectedId,
  onSelect,
  userPosition,
  userAccuracy,
  simulated,
  onMapPress,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const coordinates = places.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  // Encuadra todas las paradas cuando el mapa termina de cargar.
  const fitRoute = () => {
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 80, right: 60, bottom: 160, left: 60 },
      animated: false,
    });
  };

  const centerOnUser = () => {
    if (!userPosition) return;
    mapRef.current?.animateToRegion(
      { ...userPosition, latitudeDelta: 0.004, longitudeDelta: 0.004 },
      400
    );
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={regionFor(coordinates)}
        onMapReady={fitRoute}
        onPress={(event) => onMapPress(event.nativeEvent.coordinate)}
        customMapStyle={MUTED_STYLE}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
      >
        <Polyline coordinates={coordinates} strokeColor={colors.primary} strokeWidth={5} />

        {places.map((place, index) => {
          const selected = place.id === selectedId;
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              onPress={() => onSelect(place.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              accessibilityLabel={`Parada ${index + 1}: ${place.name}`}
              // Con pocas paradas el costo es mínimo, y así el marcador
              // se redibuja cuando cambia la selección.
              tracksViewChanges
            >
              <View style={[styles.pin, selected && styles.pinSelected]}>
                <Txt variant="label" color={selected ? colors.primary : colors.onPrimary}>
                  {index + 1}
                </Txt>
              </View>
            </Marker>
          );
        })}

        {userPosition && userAccuracy != null ? (
          // Círculo de precisión: "estás en algún lugar dentro de esto".
          <Circle
            center={userPosition}
            radius={userAccuracy}
            fillColor="rgba(209, 0, 111, 0.10)"
            strokeColor="rgba(209, 0, 111, 0.30)"
            strokeWidth={1}
          />
        ) : null}

        {userPosition ? (
          <Marker
            // Cambiar de key al entrar/salir de la simulación recrea el
            // marcador, porque con tracksViewChanges={false} no se redibuja solo.
            key={simulated ? 'user-simulated' : 'user-real'}
            coordinate={userPosition}
            anchor={{ x: 0.5, y: 0.5 }}
            accessibilityLabel={simulated ? 'Tu posición simulada' : 'Tu posición'}
            tracksViewChanges={false}
            zIndex={10}
          >
            <View style={[styles.user, simulated && styles.userSimulated]}>
              {simulated ? <Ionicons name="flask" size={12} color={colors.onPrimary} /> : null}
            </View>
          </Marker>
        ) : null}
      </MapView>

      {userPosition ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Centrar el mapa en mi ubicación"
          onPress={centerOnUser}
          style={styles.centerButton}
        >
          <Ionicons name="navigate" size={20} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

// Región inicial que contiene todas las paradas (antes de que cargue el mapa).
function regionFor(coords: Coordinates[]) {
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.004),
    longitudeDelta: Math.max((maxLon - minLon) * 1.8, 0.004),
  };
}

// Estilo apagado para Google Maps (Android): menos color y menos comercios,
// para que las paradas y la ruta en fucsia sean lo que se destaca.
// En iOS (Apple Maps) no aplica; ahí se ocultan los puntos de interés con
// showsPointsOfInterests.
const MUTED_STYLE: MapStyleElement[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { elementType: 'geometry', stylers: [{ saturation: -80 }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.card,
  },
  pinSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  user: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
    borderColor: colors.surface,
    boxShadow: '0px 0px 0px 6px rgba(209, 0, 111, 0.25)',
  },
  userSimulated: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  centerButton: {
    position: 'absolute',
    top: space.m + 52,
    right: space.m,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.card,
  },
});
