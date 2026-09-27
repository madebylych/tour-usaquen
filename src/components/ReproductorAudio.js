import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { colores, espacio } from '../theme';

// Solo se debe montar cuando el lugar tiene audio (fuente no nula).
export default function ReproductorAudio({ fuente, autor }) {
  const player = useAudioPlayer(fuente);
  const status = useAudioPlayerStatus(player);

  return (
    <View style={styles.contenedor}>
      <Pressable
        style={styles.boton}
        onPress={() => (status.playing ? player.pause() : player.play())}
      >
        <Text style={styles.textoBoton}>{status.playing ? 'Pausar' : 'Reproducir'}</Text>
      </Pressable>
      <Text style={styles.tiempo}>
        {formatear(status.currentTime)} / {formatear(status.duration)}
      </Text>
      {autor ? <Text style={styles.autor}>Audio: {autor}</Text> : null}
    </View>
  );
}

function formatear(segundos = 0) {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  contenedor: { gap: espacio.s },
  boton: {
    backgroundColor: colores.acento,
    paddingVertical: espacio.s + 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBoton: { color: '#FFFFFF', fontWeight: '600' },
  tiempo: { color: colores.textoSuave },
  autor: { color: colores.textoSuave, fontSize: 12 },
});
