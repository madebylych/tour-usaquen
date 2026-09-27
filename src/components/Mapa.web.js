import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { ruta } from '../data/lugares';
import { colores, espacio } from '../theme';

// react-native-maps no funciona en web. Mientras se decide cómo hacer el mapa
// de la versión web, se muestra la ruta como lista.
export default function Mapa() {
  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.aviso}>El mapa todavía no está disponible en la versión web.</Text>
      {ruta.map((lugar) => (
        <Pressable key={lugar.id} style={styles.fila} onPress={() => router.push(`/lugar/${lugar.id}`)}>
          <Text style={styles.nombre}>
            {lugar.orden_ruta}. {lugar.nombre}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: espacio.m },
  aviso: { color: colores.textoSuave, marginBottom: espacio.m },
  fila: { paddingVertical: espacio.m, borderBottomWidth: 1, borderColor: colores.borde },
  nombre: { fontSize: 16, color: colores.texto },
});
