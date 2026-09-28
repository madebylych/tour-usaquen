import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FromMap, MapImage, ToMap } from '@/components/map/bridge';
import { imageUrlForMap } from '@/components/map/imageUrl';
import { buildMapHtml } from '@/components/map/mapHtml';
import MapSurface, { MapSurfaceHandle } from '@/components/map/MapSurface';
import Txt from '@/components/Txt';
import { Coordinates } from '@/geo/distance';
import { MapBounds, Place } from '@/types';
import { colors, radius, shadow, space } from '@/theme';

type Props = {
  places: Place[]; // en el orden de la ruta
  selectedId: string | null;
  discoveredIds: Record<string, number>;
  onSelect: (id: string) => void;
  userPosition: Coordinates | null;
  userAccuracy: number | null; // metros; null si es simulada
  simulated: boolean;
  onMapPress: (coordinate: Coordinates) => void;
  // Mapa ilustrado de la ruta (imagen descargada o URL) y sus esquinas.
  illustratedMap: { uri: string; bounds: MapBounds } | null;
};

// Mapa del tour: MapLibre + OpenFreeMap (OpenStreetMap), sin API key, con
// el mapa ilustrado de la ruta encima (funciona sin conexión).
// El dibujo ocurre en una página web embebida (map/mapHtml.ts); este
// componente le envía el estado y recibe los toques.
export default function TourMap({
  places,
  selectedId,
  discoveredIds,
  onSelect,
  userPosition,
  userAccuracy,
  simulated,
  onMapPress,
  illustratedMap,
}: Props) {
  const html = useMemo(() => buildMapHtml(), []);
  const surface = useRef<MapSurfaceHandle>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapImage, setMapImage] = useState<MapImage | null>(null);

  // La imagen descargada se convierte a un formato que la página del mapa
  // pueda leer (ver map/imageUrl).
  const imageUri = illustratedMap?.uri ?? null;
  const imageBounds = illustratedMap?.bounds ?? null;
  useEffect(() => {
    if (!imageUri || !imageBounds) return;
    let active = true;
    imageUrlForMap(imageUri)
      .then((url) => active && setMapImage({ url, bounds: imageBounds }))
      .catch(() => active && setMapImage(null));
    return () => {
      active = false;
    };
    // imageBounds cambia de referencia en cada render; importa su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUri, JSON.stringify(imageBounds)]);

  const state: ToMap = useMemo(
    () => ({
      type: 'state',
      places: places.map((p, i) => ({ id: p.id, n: i + 1, lat: p.latitude, lng: p.longitude })),
      selectedId,
      discovered: Object.keys(discoveredIds),
      user: userPosition
        ? { lat: userPosition.latitude, lng: userPosition.longitude, accuracy: userAccuracy, simulated }
        : null,
      mapImage: imageUri ? mapImage : null,
    }),
    [places, selectedId, discoveredIds, userPosition, userAccuracy, simulated, imageUri, mapImage]
  );

  // Cada cambio de estado se envía completo; la página actualiza lo necesario.
  useEffect(() => {
    if (ready) surface.current?.send(state);
  }, [ready, state]);

  // Último estado, para reenviarlo si la página del mapa se recarga (Android
  // puede reiniciar un WebView por falta de memoria): en ese caso `ready` ya
  // era true y el efecto de arriba no se volvería a ejecutar.
  const latestState = useRef(state);
  useEffect(() => {
    latestState.current = state;
  }, [state]);

  const handleMessage = useCallback(
    (msg: FromMap) => {
      if (msg.type === 'ready') {
        setReady(true);
        setError(null);
        surface.current?.send(latestState.current);
      } else if (msg.type === 'select') onSelect(msg.id);
      else if (msg.type === 'press') onMapPress({ latitude: msg.lat, longitude: msg.lng });
      else if (msg.type === 'error') setError(msg.message);
    },
    [onSelect, onMapPress]
  );

  const centerOnUser = () => {
    if (userPosition) {
      surface.current?.send({ type: 'center', lat: userPosition.latitude, lng: userPosition.longitude });
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapSurface ref={surface} html={html} onMessage={handleMessage} />

      {error && !ready ? (
        <View style={[StyleSheet.absoluteFill, styles.errorBox]}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.primary} />
          <Txt variant="caption" color={colors.primary} style={styles.errorText}>
            No se pudo cargar el mapa. Revisa tu conexión. La lista de paradas sigue funcionando.
          </Txt>
        </View>
      ) : null}

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

const styles = StyleSheet.create({
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    padding: space.l,
    backgroundColor: colors.primarySoft,
  },
  errorText: { textAlign: 'center' },
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
