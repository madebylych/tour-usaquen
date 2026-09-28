import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import Screen from '@/components/Screen';
import StateMessage from '@/components/StateMessage';
import { getPlace } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, fontSize, space } from '@/theme';

// Ficha del lugar. Orden deliberado: primero la consigna de observación
// (mirar el lugar real), después el audio y al final los textos largos.
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useData(() => getPlace(id), id);

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error') return <StateMessage message="No se pudo cargar la parada." />;
  const place = state.data;
  if (!place) return <StateMessage message="Esta parada no existe." />;

  const credits = [
    place.image_credit ? `Imagen: ${place.image_credit}` : null,
    place.audio_credit ? `Audio: ${place.audio_credit}` : null,
    place.sources ? `Fuentes: ${place.sources}` : null,
  ].filter(Boolean);

  return (
    <Screen>
      <Stack.Screen options={{ title: place.name }} />

      {/* La imagen se carga desde los archivos descargados (fase 7). */}
      <View style={styles.imagePlaceholder}>
        <Text style={styles.muted}>Imagen pendiente</Text>
      </View>

      <View>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.muted}>{place.category}</Text>
      </View>

      {place.observation_prompt ? (
        <View style={styles.prompt}>
          <Text style={styles.promptText}>{place.observation_prompt}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Escucha este lugar</Text>
      {/* El reproductor se conecta cuando haya audios reales o de prueba. */}
      <Text style={styles.muted}>{place.audio_path ? place.audio_title ?? 'Audio' : 'Audio pendiente'}</Text>

      {place.history ? (
        <>
          <Text style={styles.section}>Historia</Text>
          <Text style={styles.body}>{place.history}</Text>
        </>
      ) : null}

      {place.architecture ? (
        <>
          <Text style={styles.section}>Arquitectura</Text>
          <Text style={styles.body}>{place.architecture}</Text>
        </>
      ) : null}

      {place.did_you_know ? (
        <>
          <Text style={styles.section}>¿Sabías que...?</Text>
          <Text style={styles.body}>{place.did_you_know}</Text>
        </>
      ) : null}

      {credits.length > 0 ? <Text style={styles.credits}>{credits.join('\n')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  muted: { fontSize: fontSize.body, color: colors.textMuted },
  prompt: {
    borderLeftWidth: 4,
    borderColor: colors.accent,
    paddingVertical: space.s,
    paddingLeft: space.m,
  },
  promptText: { fontSize: 18, lineHeight: 26, color: colors.text, fontStyle: 'italic' },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: space.s },
  body: { fontSize: fontSize.body, lineHeight: 24, color: colors.text },
  credits: { fontSize: fontSize.small, color: colors.textMuted, marginTop: space.l },
});
