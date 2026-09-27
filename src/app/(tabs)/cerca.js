import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { lugares } from '../../data/lugares';
import { useUbicacion } from '../../hooks/useUbicacion';
import { distanciaEnMetros, formatearDistancia } from '../../utils/distancia';
import { colores, espacio } from '../../theme';

export default function PantallaCerca() {
  const { ubicacion, permisoDenegado } = useUbicacion();

  const ordenados = ubicacion
    ? lugares
        .map((lugar) => ({
          ...lugar,
          distancia: distanciaEnMetros(
            ubicacion.latitude,
            ubicacion.longitude,
            lugar.latitud,
            lugar.longitud
          ),
        }))
        .sort((a, b) => a.distancia - b.distancia)
    : lugares;

  return (
    <View style={styles.contenedor}>
      {permisoDenegado ? (
        <Text style={styles.aviso}>
          Sin permiso de ubicación no podemos ordenar los lugares por cercanía.
        </Text>
      ) : !ubicacion ? (
        <Text style={styles.aviso}>Buscando tu ubicación…</Text>
      ) : null}

      <FlatList
        data={ordenados}
        keyExtractor={(lugar) => lugar.id}
        renderItem={({ item }) => (
          <Pressable style={styles.fila} onPress={() => router.push(`/lugar/${item.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.categoria}>{item.categoria}</Text>
            </View>
            {item.distancia != null ? (
              <Text style={styles.distancia}>{formatearDistancia(item.distancia)}</Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  aviso: { padding: espacio.m, color: colores.textoSuave },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: espacio.m,
    borderBottomWidth: 1,
    borderColor: colores.borde,
  },
  nombre: { fontSize: 16, color: colores.texto },
  categoria: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  distancia: { fontSize: 14, color: colores.acento, fontWeight: '600' },
});
