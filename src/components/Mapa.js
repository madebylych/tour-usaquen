import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { CENTRO_USAQUEN, lugares, ruta } from '../data/lugares';
import { colores } from '../theme';

// Mapa del tour (Android / iOS). En web se usa Mapa.web.js.
export default function Mapa() {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...CENTRO_USAQUEN, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
      showsUserLocation
      showsMyLocationButton
    >
      <Polyline
        coordinates={ruta.map((l) => ({ latitude: l.latitud, longitude: l.longitud }))}
        strokeColor={colores.acento}
        strokeWidth={4}
      />
      {lugares.map((lugar) => (
        <Marker
          key={lugar.id}
          coordinate={{ latitude: lugar.latitud, longitude: lugar.longitud }}
          title={`${lugar.orden_ruta}. ${lugar.nombre}`}
          description="Toca para ver el lugar"
          pinColor={colores.acento}
          onCalloutPress={() => router.push(`/lugar/${lugar.id}`)}
        />
      ))}
    </MapView>
  );
}
