import { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useDiscoveryFeedback } from '@/audio/useDiscoveryFeedback';
import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import ImagePlaceholder from '@/components/ImagePlaceholder';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { progress, useProgress } from '@/data/progress';
import { getPlace } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, radius, shadow, space } from '@/theme';
import { categoryIcon } from '@/utils/categories';

// Ficha del lugar. Orden deliberado: primero la consigna de observación
// (mirar el lugar real), después el audio y al final los textos largos.
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useData(() => getPlace(id), id);
  const { discovered } = useProgress();
  const celebrate = useDiscoveryFeedback();

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error') return <StateMessage message="No se pudo cargar la parada." />;
  const place = state.data;
  if (!place) return <StateMessage message="Esta parada no existe." />;

  const isDiscovered = place.id in discovered;
  // "Ya estoy aquí": respaldo para cuando el GPS no detecta la llegada.
  const discoverManually = () => {
    if (progress.discover([place.id], { announce: false }).length > 0) celebrate();
  };

  const credits = [
    place.image_credit ? `Imagen: ${place.image_credit}` : null,
    place.audio_credit ? `Audio: ${place.audio_credit}` : null,
    place.sources ? `Fuentes: ${place.sources}` : null,
  ].filter(Boolean);

  return (
    <View style={styles.screen}>
      {/* Barra de estado oscura sobre la imagen clara. */}
      <StatusBar style="dark" />
      <BackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE }}>
        {/* La imagen real se carga desde los archivos descargados (fase 7). */}
        <ImagePlaceholder category={place.category} style={styles.hero} iconSize={72} />

        <View style={styles.sheet}>
          <View style={styles.chipRow}>
            <Chip icon={categoryIcon(place.category)} label={place.category} />
          </View>
          <Txt variant="title">{place.name}</Txt>

          {place.observation_prompt ? (
            <View style={styles.prompt}>
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
              <Txt variant="heading" style={styles.promptText}>
                {place.observation_prompt}
              </Txt>
            </View>
          ) : null}

          {/* El reproductor se conecta cuando haya audios (de prueba o reales). */}
          <View style={styles.audio}>
            <View style={[styles.playButton, !place.audio_path && styles.playDisabled]}>
              <Ionicons name="play" size={26} color={colors.onPrimary} />
            </View>
            <View style={styles.grow}>
              <Txt variant="label">Escucha este lugar</Txt>
              <Txt variant="caption">
                {place.audio_path ? (place.audio_title ?? 'Experiencia sonora') : 'Audio pendiente'}
              </Txt>
            </View>
            <Ionicons name="headset-outline" size={22} color={colors.textMuted} />
          </View>

          {place.history ? <Section icon="time-outline" title="Historia" text={place.history} /> : null}
          {place.architecture ? (
            <Section icon="business-outline" title="Arquitectura" text={place.architecture} />
          ) : null}

          {place.did_you_know ? (
            <View style={styles.fact}>
              <View style={styles.factTitle}>
                <Ionicons name="bulb" size={20} color={colors.onPrimary} />
                <Txt variant="label" color={colors.onPrimary}>
                  ¿Sabías que...?
                </Txt>
              </View>
              <Txt variant="body" color={colors.onPrimary}>
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
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <Txt variant="label" color={colors.primary}>
                Parada descubierta
              </Txt>
            </View>
          ) : (
            <Button label="Ya estoy aquí" icon="hand-left-outline" onPress={discoverManually} />
          )}
        </View>
      </BottomBar>
    </View>
  );
}

function Section({
  icon,
  title,
  text,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitle}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Txt variant="heading">{title}</Txt>
      </View>
      <Txt variant="body">{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 320 },
  sheet: {
    marginTop: -radius.l,
    padding: space.m + 4,
    paddingTop: space.l,
    gap: space.m,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
  },
  chipRow: { flexDirection: 'row' },
  prompt: {
    flexDirection: 'row',
    gap: space.m - 4,
    padding: space.m + 2,
    borderRadius: radius.m,
    backgroundColor: colors.primarySoft,
  },
  promptText: { flex: 1, color: colors.primaryDark },
  audio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 2,
    padding: space.m - 2,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3, // centra ópticamente el triángulo de play
  },
  playDisabled: { opacity: 0.35 },
  grow: { flex: 1 },
  card: {
    padding: space.m + 2,
    gap: space.s,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  fact: {
    padding: space.m + 2,
    gap: space.s,
    borderRadius: radius.m,
    backgroundColor: colors.primary,
  },
  factTitle: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  credits: { marginTop: space.s },
  discoveredBadge: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
});
