import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { buscarLugar } from '../../data/lugares';
import ReproductorAudio from '../../components/ReproductorAudio';
import { colores, espacio } from '../../theme';

export default function PantallaLugar() {
  const { id } = useLocalSearchParams();
  const lugar = buscarLugar(id);

  if (!lugar) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.texto}>No encontramos este lugar.</Text>
      </View>
    );
  }

  const abrirComoLlegar = () =>
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${lugar.latitud},${lugar.longitud}&travelmode=walking`
    );

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={styles.contenedor}>
      <Stack.Screen options={{ title: lugar.nombre }} />

      {lugar.foto ? (
        <View>
          <Image source={lugar.foto} style={styles.foto} />
          {lugar.credito_foto ? <Text style={styles.credito}>Foto: {lugar.credito_foto}</Text> : null}
        </View>
      ) : (
        <View style={[styles.foto, styles.fotoPendiente]}>
          <Text style={styles.credito}>Foto pendiente</Text>
        </View>
      )}

      <Text style={styles.titulo}>{lugar.nombre}</Text>
      <Text style={styles.detalle}>
        {lugar.categoria} · {lugar.direccion}
      </Text>

      <Pressable style={styles.botonSecundario} onPress={abrirComoLlegar}>
        <Text style={styles.textoBotonSecundario}>Cómo llegar</Text>
      </Pressable>

      <Text style={styles.seccion}>Escucha</Text>
      {lugar.audio ? (
        <ReproductorAudio fuente={lugar.audio} autor={lugar.autor_audio} />
      ) : (
        <Text style={styles.detalle}>Audio pendiente</Text>
      )}

      <Text style={styles.seccion}>Historia</Text>
      <Text style={styles.texto}>{lugar.historia}</Text>

      <Text style={styles.seccion}>Diseño arquitectónico</Text>
      <Text style={styles.texto}>{lugar.diseno_arquitectonico}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: espacio.m, gap: espacio.s },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 8 },
  fotoPendiente: {
    backgroundColor: colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credito: { fontSize: 12, color: colores.textoSuave },
  titulo: { fontSize: 24, fontWeight: '700', color: colores.texto, marginTop: espacio.s },
  detalle: { color: colores.textoSuave },
  seccion: { fontSize: 18, fontWeight: '600', color: colores.texto, marginTop: espacio.l },
  texto: { fontSize: 16, lineHeight: 24, color: colores.texto },
  botonSecundario: {
    borderWidth: 1,
    borderColor: colores.acento,
    borderRadius: 8,
    paddingVertical: espacio.s + 4,
    alignItems: 'center',
    marginTop: espacio.s,
  },
  textoBotonSecundario: { color: colores.acento, fontWeight: '600' },
});
