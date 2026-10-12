import { Animated, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useDiscoveryFeedback } from '@/audio/useDiscoveryFeedback';
import AudioPlayer from '@/components/AudioPlayer';
import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import MediaImage from '@/components/MediaImage';
import { Appear, useParallax } from '@/components/motion';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { progress, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { line, makeStyles, radius, space, useTheme } from '@/theme';

// La parada y su número dentro de la ruta.
async function loadPlace(routeSlug: string, placeId: string) {
  const route = await getRoute(routeSlug);
  const index = route?.places.findIndex((p) => p.id === placeId) ?? -1;
  return index >= 0 && route ? { place: route.places[index], position: index + 1 } : null;
}

// Ficha del lugar. Orden deliberado: primero la consigna de observación
// (mirar el lugar real), después el audio y al final los textos largos.
export default function PlaceScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  // La foto de arriba se queda un poco atrás al bajar (parallax).
  const parallax = useParallax(280);
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
      <BackButton />
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + space.m }}
        onScroll={parallax.onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <Animated.View style={[styles.heroImage, parallax.heroStyle]}>
            <MediaImage uri={place.media.image} style={styles.heroImage} label={place.name} />
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Appear delay={60} style={styles.titleBlock}>
            <Txt variant="overline">
              PARADA {String(position).padStart(2, '0')}, {place.category.toUpperCase()}
            </Txt>
            <Txt variant="title" color={colors.primary}>
              {place.name}
            </Txt>
          </Appear>

          {place.observation_prompt ? (
            <Appear delay={150} style={styles.prompt}>
              <Txt variant="label" color={colors.onAccent} style={styles.promptText}>
                {place.observation_prompt}
              </Txt>
            </Appear>
          ) : null}

          <Appear delay={250}>
            <AudioPlayer uri={place.media.audio} title={place.audio_title} credit={place.audio_credit} />
          </Appear>

          {place.history ? <Section title="Historia" text={place.history} delay={330} /> : null}
          {place.architecture ? <Section title="Arquitectura" text={place.architecture} delay={400} /> : null}

          {place.did_you_know ? (
            <Appear delay={470} style={styles.fact}>
              <Txt variant="overline" color={colors.onAccent}>
                ¿SABÍAS QUE…?
              </Txt>
              <Txt variant="label" color={colors.onAccent} style={styles.factText}>
                {place.did_you_know}
              </Txt>
            </Appear>
          ) : null}

          {credits.length > 0 ? (
            <Txt variant="caption" style={styles.credits}>
              {credits.join('\n')}
            </Txt>
          ) : null}
        </View>
      </Animated.ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          {isDiscovered ? (
            <View style={styles.discoveredBadge} accessibilityRole="text">
              <Ionicons name="checkmark" size={22} color={colors.onAccent} />
              <Txt variant="label" color={colors.onAccent}>
                Parada descubierta
              </Txt>
            </View>
          ) : (
            <Button label="Ya estoy aquí" onPress={discoverManually} />
          )}
        </View>
      </BottomBar>
    </View>
  );
}

function Section({ title, text, delay = 0 }: { title: string; text: string; delay?: number }) {
  const styles = useStyles();
  return (
    <Appear delay={delay} style={styles.card}>
      <Txt variant="heading" highlight>
        {title}
      </Txt>
      <Txt variant="body">{text}</Txt>
    </Appear>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 280, overflow: 'hidden', borderBottomWidth: line, borderColor: colors.border },
  heroImage: { height: 280 },
  content: { padding: space.m + 6, gap: space.m },
  titleBlock: { gap: space.s + 2, marginBottom: space.xs },
  prompt: {
    padding: space.m,
    backgroundColor: colors.accent,
    borderWidth: line,
    borderColor: colors.border,
    borderRadius: radius.m,
  },
  promptText: { fontSize: 16, lineHeight: 23 },
  grow: { flex: 1 },
  card: {
    padding: space.m + 2,
    gap: space.s,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
    borderRadius: radius.m,
  },
  fact: { padding: space.m + 2, gap: space.s, backgroundColor: colors.accent, borderWidth: line, borderColor: colors.border, borderRadius: radius.m },
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
    borderRadius: radius.pill,
  },
}));
