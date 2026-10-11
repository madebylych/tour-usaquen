import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useDiscoveryFeedback } from '@/audio/useDiscoveryFeedback';
import AudioPlayer from '@/components/AudioPlayer';
import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import MediaImage from '@/components/MediaImage';
import { Appear } from '@/components/motion';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { progress, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, line, space } from '@/theme';

// La parada y su número dentro de la ruta.
async function loadPlace(routeSlug: string, placeId: string) {
  const route = await getRoute(routeSlug);
  const index = route?.places.findIndex((p) => p.id === placeId) ?? -1;
  return index >= 0 && route ? { place: route.places[index], position: index + 1 } : null;
}

// Ficha del lugar. Orden deliberado: primero la consigna de observación
// (mirar el lugar real), después el audio y al final los textos largos.
export default function PlaceScreen() {
  const { id, route: routeSlug } = useLocalSearchParams<{ id: string; route: string }>();
  const state = useData(() => loadPlace(routeSlug, id), `${routeSlug}/${id}`);
  const { discovered } = useProgress();
  const celebrate = useDiscoveryFeedback();

  if (!routeSlug || !id) return <StateMessage message="No se sabe qué parada abrir." showHomeButton />;
  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error')
    return <StateMessage message="No se pudo cargar la parada." onRetry={state.reload} showHomeButton />;
  if (!state.data) return <StateMessage message="Esta parada no existe." showHomeButton />;
  const { place, position } = state.data;

  const isDiscovered = place.id in discovered;
  // "Ya estoy aquí": respaldo para cuando el GPS no detecta la llegada.
  const discoverManually = () => {
    if (progress.discover([place.id], { announce: false }).length > 0) celebrate();
  };

  const credits = [
    place.image_credit ? `Imagen: ${place.image_credit}` : null,
    place.sources ? `Fuentes: ${place.sources}` : null,
  ].filter(Boolean);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <BackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + space.m }}>
        <MediaImage uri={place.media.image} style={styles.hero} label={place.name} />

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <Txt variant="overline">
              PARADA {String(position).padStart(2, '0')}, {place.category.toUpperCase()}
            </Txt>
            <Txt variant="title" riso color={colors.primary}>
              {place.name}
            </Txt>
          </View>

          {place.observation_prompt ? (
            <Appear delay={150} style={styles.prompt}>
              <Txt variant="label" style={styles.promptText}>
                {place.observation_prompt}
              </Txt>
            </Appear>
          ) : null}

          <Appear delay={250}>
            <AudioPlayer uri={place.media.audio} title={place.audio_title} credit={place.audio_credit} />
          </Appear>

          {place.history ? <Section title="Historia" text={place.history} /> : null}
          {place.architecture ? <Section title="Arquitectura" text={place.architecture} /> : null}

          {place.did_you_know ? (
            <View style={styles.fact}>
              <Txt variant="overline" color={colors.accent}>
                ¿SABÍAS QUE…?
              </Txt>
              <Txt variant="label" color={colors.onPrimary} style={styles.factText}>
                {place.did_you_know}
              </Txt>
            </View>
          ) : null}

          {credits.length > 0 ? (
            <Txt variant="caption" style={styles.credits}>
              {credits.join('\n')}
            </Txt>
          ) : null}
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          {isDiscovered ? (
            <View style={styles.discoveredBadge} accessibilityRole="text">
              <Ionicons name="checkmark" size={22} color={colors.text} />
              <Txt variant="label">Parada descubierta</Txt>
            </View>
          ) : (
            <Button label="Ya estoy aquí" onPress={discoverManually} />
          )}
        </View>
      </BottomBar>
    </View>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.card}>
      <Txt variant="heading">{title}</Txt>
      <Txt variant="body">{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 280, borderBottomWidth: line, borderColor: colors.border },
  content: { padding: space.m + 6, gap: space.m },
  titleBlock: { gap: space.s + 2, marginBottom: space.xs },
  prompt: {
    padding: space.m,
    backgroundColor: colors.accent,
    borderWidth: line,
    borderColor: colors.border,
  },
  promptText: { fontSize: 16, lineHeight: 23 },
  grow: { flex: 1 },
  card: {
    padding: space.m + 2,
    gap: space.s,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  fact: { padding: space.m + 2, gap: space.s, backgroundColor: colors.primary },
  factText: { fontSize: 16, lineHeight: 23 },
  credits: { marginTop: space.s },
  discoveredBadge: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    backgroundColor: colors.accent,
    borderWidth: line,
    borderColor: colors.border,
  },
});
