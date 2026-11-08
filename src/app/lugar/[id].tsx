import { ComponentProps, ReactNode, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useDiscoveryFeedback } from '@/audio/useDiscoveryFeedback';
import AudioPlayer from '@/components/AudioPlayer';
import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import MediaImage from '@/components/MediaImage';
import { Appear, Stamp, Wobble } from '@/components/motion';
import PlaceStamps from '@/components/PlaceStamps';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { countDiscovered, progress, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { fonts, makeStyles, radius, shadows, space, useTheme } from '@/theme';
import { tap } from '@/audio/haptics';

const SKY = 210;

// La parada, su número y la ruta (para los sellos y la siguiente parada).
async function loadPlace(routeSlug: string, placeId: string) {
  const route = await getRoute(routeSlug);
  const index = route?.places.findIndex((p) => p.id === placeId) ?? -1;
  return index >= 0 && route ? { route, place: route.places[index], position: index + 1 } : null;
}

// Ficha del lugar: cielo con la foto en círculo, el nombre, datos en filas
// y después la consigna de observación, el audio y los textos largos.
export default function PlaceScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id, route: routeSlug } = useLocalSearchParams<{ id: string; route: string }>();
  const state = useData(() => loadPlace(routeSlug, id), `${routeSlug}/${id}`);
  const { discovered } = useProgress();
  const celebrate = useDiscoveryFeedback();
  const scroll = useRef<ScrollView>(null);
  const [audioY, setAudioY] = useState(0);

  if (!routeSlug || !id) return <StateMessage message="No se sabe qué parada abrir." showHomeButton />;
  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error')
    return <StateMessage message="No se pudo cargar la parada." onRetry={state.reload} showHomeButton />;
  if (!state.data) return <StateMessage message="Esta parada no existe." showHomeButton />;
  const { route, place, position } = state.data;

  const isDiscovered = place.id in discovered;
  const total = route.places.length;
  const done = countDiscovered(route.places.map((p) => p.id), discovered);
  const nextPlace = route.places[position]; // la que sigue en el orden de la ruta
  // "Ya estoy aquí": respaldo para cuando el GPS no detecta la llegada.
  const discoverManually = () => {
    if (progress.discover([place.id], { announce: false }).length > 0) celebrate();
  };
  const goNext = () =>
    nextPlace
      ? router.replace(`/lugar/${nextPlace.id}?route=${route.slug}`)
      : router.push({ pathname: '/completado', params: { route: route.slug } });

  return (
    <View style={styles.screen}>
      <BackButton />
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + space.m }}>
        {/* Cielo con nubes y sol; la foto queda montada sobre el borde. */}
        <View style={styles.sky} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.sun} />
          <Wobble from="-3deg" to="3deg" delay={400} style={styles.cloudA}>
            <Cloud />
          </Wobble>
          <Wobble from="2deg" to="-2deg" delay={900} style={styles.cloudB}>
            <Cloud />
          </Wobble>
          <View style={styles.hills}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.hill} />
            ))}
          </View>
        </View>

        <View style={styles.head}>
          <Stamp delay={150} style={styles.photoRing}>
            <MediaImage uri={place.media.image} style={styles.photo} label={place.name} />
          </Stamp>
          <Ionicons name="sparkles" size={20} color="#F9A8C8" style={styles.sparkleA} />
          <Ionicons name="sparkles" size={14} color="#C9B8F5" style={styles.sparkleB} />
          <Appear delay={120} style={styles.titleBlock}>
            <Txt variant="title" style={styles.center}>
              {place.name}
            </Txt>
            <Txt variant="caption" style={styles.center}>
              {place.category}
            </Txt>
          </Appear>
          <Appear delay={200} style={styles.pills}>
            <Pill
              icon="headset-outline"
              label="Escuchar"
              onPress={() => scroll.current?.scrollTo({ y: audioY - space.m, animated: true })}
            />
            <Pill
              icon="map-outline"
              label="Ver en mapa"
              onPress={() => router.push({ pathname: '/tour', params: { route: route.slug } })}
            />
          </Appear>
        </View>

        <View style={styles.divider} />
        <Txt variant="display" color={colors.primaryText} style={styles.number}>
          Parada {String(position).padStart(2, '0')}
        </Txt>
        <View style={styles.divider} />

        {/* Datos en filas: etiqueta a la izquierda, valor a la derecha. */}
        <Row label="Estado">
          <View style={styles.valueRow}>
            <Ionicons
              name={isDiscovered ? 'checkmark-circle-outline' : 'ellipse-outline'}
              size={18}
              color={isDiscovered ? colors.success : colors.textMuted}
            />
            <Txt variant="label" color={isDiscovered ? colors.success : colors.textMuted}>
              {isDiscovered ? 'Descubierta' : 'Por descubrir'}
            </Txt>
          </View>
          <Txt variant="caption" style={styles.right}>
            {isDiscovered ? 'Sello en tu pasaporte' : 'Llega al lugar para ganar el sello'}
          </Txt>
        </Row>
        <Row label="Sellos de la ruta" sub={`${done} de ${total} en tu pasaporte`}>
          <PlaceStamps places={route.places} discovered={discovered} size={34} overlap={9} />
        </Row>
        {nextPlace ? (
          <Row label="Siguiente">
            <Txt variant="label" style={styles.right}>
              {nextPlace.name}
            </Txt>
            <Txt variant="caption" style={styles.right}>
              Parada {String(position + 1).padStart(2, '0')}
            </Txt>
          </Row>
        ) : null}
        {place.image_credit ? (
          <Row label="" leading={<CreditBadge />} sub="Foto" last>
            <Txt variant="caption" style={[styles.right, styles.credit]}>
              {place.image_credit}
            </Txt>
          </Row>
        ) : null}

        <View style={styles.content}>
          {place.observation_prompt ? (
            <Appear delay={150} style={styles.prompt}>
              <View style={styles.promptHead}>
                <Ionicons name="eye-outline" size={18} color={colors.onAccent} />
                <Txt variant="overline" color={colors.onAccent}>
                  OBSERVA
                </Txt>
              </View>
              <Txt variant="label" color={colors.onAccent} style={styles.promptText}>
                {place.observation_prompt}
              </Txt>
            </Appear>
          ) : null}

          <View onLayout={(e) => setAudioY(e.nativeEvent.layout.y)}>
            <AudioPlayer uri={place.media.audio} title={place.audio_title} credit={place.audio_credit} />
          </View>

          {place.history ? <Section title="Historia" text={place.history} /> : null}
          {place.architecture ? <Section title="Arquitectura" text={place.architecture} /> : null}

          {place.did_you_know ? (
            <View style={styles.fact}>
              <Txt variant="overline" color={colors.onAccent}>
                ¿SABÍAS QUE…?
              </Txt>
              <Txt variant="label" color={colors.onAccent} style={styles.factText}>
                {place.did_you_know}
              </Txt>
            </View>
          ) : null}

          {place.sources ? <Txt variant="caption">Fuentes: {place.sources}</Txt> : null}
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          {isDiscovered ? (
            <Button
              label={nextPlace ? 'Siguiente parada' : 'Ver mi pasaporte'}
              icon="arrow-forward"
              iconRight
              onPress={goNext}
            />
          ) : (
            <Button label="Ya estoy aquí" variant="accent" icon="location" onPress={discoverManually} />
          )}
        </View>
      </BottomBar>
    </View>
  );
}

type IconName = ComponentProps<typeof Ionicons>['name'];

function Pill({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
    >
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Txt variant="body" color={colors.textMuted}>
        {label}
      </Txt>
    </Pressable>
  );
}

function Row({
  label,
  sub,
  leading,
  children,
  last = false,
}: {
  label: string;
  sub?: string;
  leading?: ReactNode;
  children: ReactNode;
  last?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      {leading}
      <View style={styles.rowLabel}>
        {label ? <Txt variant="label">{label}</Txt> : null}
        {sub ? <Txt variant="caption">{sub}</Txt> : null}
      </View>
      <View style={styles.rowValue}>{children}</View>
    </View>
  );
}

function CreditBadge() {
  const styles = useStyles();
  return (
    <View style={styles.cc}>
      <Txt variant="label" style={styles.ccText}>
        CC
      </Txt>
    </View>
  );
}

function Cloud() {
  const styles = useStyles();
  return (
    <View style={styles.cloud}>
      <View style={[styles.puff, { width: 46, height: 30, left: 0, top: 12 }]} />
      <View style={[styles.puff, { width: 44, height: 40, left: 22, top: 0 }]} />
      <View style={[styles.puff, { width: 40, height: 28, left: 50, top: 14 }]} />
    </View>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Txt variant="heading">{title}</Txt>
      <Txt variant="body">{text}</Txt>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  sky: { height: SKY, overflow: 'hidden', backgroundColor: '#A8D8F8' },
  sun: {
    position: 'absolute',
    right: -40,
    top: -46,
    width: 170,
    height: 170,
    backgroundColor: '#FFA94D',
    borderRadius: radius.pill,
    boxShadow: '0px 0px 40px #FFC46B',
  },
  cloudA: { position: 'absolute', left: 30, top: 54 },
  cloudB: { position: 'absolute', left: 200, top: 96 },
  cloud: { width: 92, height: 42 },
  puff: { position: 'absolute', backgroundColor: '#FFFFFFEB', borderRadius: radius.pill },
  hills: { position: 'absolute', left: -30, right: -30, bottom: -50, flexDirection: 'row' },
  hill: { flex: 1, height: 96, marginHorizontal: -12, backgroundColor: colors.background, borderRadius: radius.pill },
  head: { alignItems: 'center', marginTop: -90, paddingHorizontal: space.l, gap: space.m },
  photoRing: {
    padding: 5,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    boxShadow: shadows(colors).soft,
  },
  photo: { width: 120, height: 120, borderRadius: radius.pill },
  sparkleA: { position: 'absolute', left: 70, top: 120 },
  sparkleB: { position: 'absolute', right: 80, top: 140 },
  titleBlock: { gap: 2 },
  pills: { flexDirection: 'row', gap: space.m - 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    paddingHorizontal: space.m + 4,
    paddingVertical: space.s + 4,
    backgroundColor: colors.panel,
    borderRadius: radius.pill,
  },
  pillPressed: { opacity: 0.7 },
  divider: { height: 1, backgroundColor: colors.border, marginTop: space.l },
  number: { textAlign: 'center', marginTop: space.m, fontSize: 40, lineHeight: 46 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m - 4, paddingVertical: space.m - 2, paddingHorizontal: space.l },
  rowLine: { borderBottomWidth: 1, borderColor: colors.border },
  rowLabel: { flexShrink: 0, gap: 2 },
  rowValue: { flex: 1, alignItems: 'flex-end', gap: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  right: { textAlign: 'right' },
  credit: { maxWidth: 220 },
  cc: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EEF6',
    borderRadius: 6,
  },
  ccText: { color: '#3B6FD8', fontFamily: fonts.bold },
  content: { padding: space.m + 4, gap: space.m, marginTop: space.s },
  prompt: { padding: space.m + 2, gap: space.s, backgroundColor: colors.accent, borderRadius: radius.m },
  promptHead: { flexDirection: 'row', alignItems: 'center', gap: space.s - 2 },
  promptText: { fontSize: 16, lineHeight: 23 },
  card: { padding: space.m + 2, gap: space.s, backgroundColor: colors.panel, borderRadius: radius.m },
  fact: { padding: space.m + 2, gap: space.s, backgroundColor: colors.accent, borderRadius: radius.m },
  factText: { fontSize: 16, lineHeight: 23 },
}));
