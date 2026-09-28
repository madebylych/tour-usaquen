import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { MapStyleElement, Marker, Polyline } from 'react-native-maps';

import Txt from '@/components/Txt';
import { Place } from '@/types';
import { colors, radius, shadow } from '@/theme';

type Props = {
  places: Place[]; // en el orden de la ruta
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Mapa del tour (Android / iOS). En web se usa TourMap.web.tsx.
// El mapa ilustrado (fase 8) y la ubicación del usuario (fase 3) se agregan aquí.
export default function TourMap({ places, selectedId, onSelect }: Props) {
  const mapRef = useRef<MapView>(null);
  const coordinates = places.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  // Encuadra todas las paradas cuando el mapa termina de cargar.
  const fitRoute = () => {
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 80, right: 60, bottom: 160, left: 60 },
      animated: false,
    });
  };

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={regionFor(coordinates)}
      onMapReady={fitRoute}
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
            // se redibuja solo cuando cambia la selección.
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
    </MapView>
  );
}

// Región inicial que contiene todas las paradas (antes de que cargue el mapa).
function regionFor(coords: { latitude: number; longitude: number }[]) {
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
});
