import { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import InkConfetti from '@/components/InkConfetti';
import MediaImage from '@/components/MediaImage';
import { Appear, Stamp, Wobble } from '@/components/motion';
import Passport from '@/components/Passport';
import PlaceStamps from '@/components/PlaceStamps';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { countDiscovered, progress, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { forgetRemote } from '@/data/progressSync';
import { scratch } from '@/data/scratch';
import { useData } from '@/data/useData';
import { makeStyles, radius, shadows, space, useTheme } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';
import { tap } from '@/audio/haptics';

// Inclinación y altura de cada foto en la banda de la celebración.
const BOB = [10, -2, 6, -4, 10, 0];

// Final del recorrido (y pasaporte): celebración, sellos, compartir y créditos.
export default function CompleteScreen() {
  const { colors, dark } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);
  const { discovered } = useProgress();

  if (!slug) return <StateMessage message="No se sabe qué recorrido resumir." showHomeButton />;
  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data)
    return <StateMessage message="No se pudo cargar el resumen." onRetry={state.reload} showHomeButton />;
  const route = state.data;

  const ids = route.places.map((p) => p.id);
  const done = countDiscovered(ids, discovered);
  const complete = done === ids.length;

  // Cierra las pantallas hasta el inicio; si el inicio no está en la pila
  // (la app se abrió directo aquí), lo pone en su lugar.
  const goHome = () => router.dismissTo('/');

  const share = () => {
    tap();
    const message = complete
      ? `Completé el pasaporte de "${route.name}" en el Tour Usaquén: ${done} de ${ids.length} paradas descubiertas.`
      : `Voy ${done} de ${ids.length} paradas en "${route.name}" del Tour Usaquén.`;
    Share.share({ message }).catch(() => {});
  };

  const confirmReset = () =>
    Alert.alert(
      'Reiniciar recorrido',
      'Se borrarán las paradas descubiertas de este recorrido para empezar de nuevo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            progress.reset(ids);
            scratch.reset();
            forgetRemote(ids).catch(() => {});
            goHome();
          },
        },
      ]
    );

  return (
    <View style={[styles.screen, !dark && styles.screenWarm]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l },
        ]}
      >
        <Appear style={styles.card}>
          {/* Banda con las fotos de las paradas y globos de diálogo. */}
          <View style={styles.band}>
            <Stamp delay={300} rotate="-4deg" style={styles.bubbleLeft}>
              <View style={styles.bubble}>
                <Txt variant="label" color="#15151A">
                  {complete ? '¡Qué ruta!' : '¡Vamos bien!'}
                </Txt>
              </View>
            </Stamp>
            <Stamp delay={450} rotate="5deg" style={styles.bubbleRight}>
              <View style={styles.bubble}>
                <Txt variant="label" color="#15151A">
                  {done} de {ids.length}
                </Txt>
              </View>
            </Stamp>
            <View style={styles.faces}>
              {route.places.map((place, i) => (
                <Wobble key={place.id} delay={600 + i * 120} from="-3deg" to="3deg" style={{ marginTop: BOB[i % BOB.length] }}>
                  <MediaImage
                    uri={place.id in discovered ? place.media.image : null}
                    style={[styles.face, i > 0 && styles.faceOverlap, !(place.id in discovered) && styles.faceMissing]}
                    label={place.name}
                  />
                </Wobble>
              ))}
            </View>
          </View>

          <Txt variant="title" style={styles.center}>
            {complete ? '¡Recorrido completo!' : '¡Buen recorrido!'}
          </Txt>
          <Txt variant="body" style={[styles.center, styles.muted]}>
            {complete
              ? `Descubriste las ${ids.length} paradas. Gracias por caminar y escuchar Usaquén con nosotros.`
              : `Descubriste ${done} de ${ids.length} paradas. Vuelve cuando quieras a completar el pasaporte.`}
          </Txt>
          <Button label="Compartir mi pasaporte" variant="accent" icon="share-outline" onPress={share} />
          <Pressable onPress={goHome} style={styles.link} accessibilityRole="button">
            <Txt variant="label" color={colors.textMuted}>
              Volver al inicio
            </Txt>
          </Pressable>
        </Appear>

        <Appear delay={200} style={styles.pill}>
          <PlaceStamps places={route.places} discovered={discovered} size={38} overlap={10} animate />
          <View style={styles.grow}>
            <View style={styles.pillTitle}>
              <Txt variant="label">
                {done} de {ids.length} sellos
              </Txt>
              {complete ? <Ionicons name="star" size={15} color="#FFB020" /> : null}
            </View>
            <Txt variant="caption">{complete ? 'Todas las paradas descubiertas' : 'Tu pasaporte de Usaquén'}</Txt>
          </View>
        </Appear>

        <Appear delay={300}>
          <Passport places={route.places} discovered={discovered} />
        </Appear>

        <Appear delay={380} style={styles.list}>
          <InfoRow
            icon="footsteps-outline"
            title="Resumen del recorrido"
            text={[
              route.distance_m != null ? formatDistance(route.distance_m) : null,
              route.duration_min != null ? formatDuration(route.duration_min) : null,
              `${ids.length} paradas`,
            ]
              .filter(Boolean)
              .join('   ')}
          />
          <InfoRow
            icon="musical-notes-outline"
            title="Créditos del equipo"
            text="Un proyecto interdisciplinar de Creación Digital, Arquitectura y Música."
          />
        </Appear>

        <Pressable onPress={confirmReset} style={styles.link} accessibilityRole="button">
          <Txt variant="label" color={colors.textMuted}>
            Reiniciar recorrido
          </Txt>
        </Pressable>
      </ScrollView>
      {complete ? <InkConfetti /> : null}
    </View>
  );
}

function InfoRow({ icon, title, text }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <View style={styles.grow}>
        <Txt variant="label">{title}</Txt>
        <Txt variant="caption">{text}</Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  // En claro, fondo cálido como la celebración de la referencia.
  screenWarm: { backgroundColor: '#FFF1CC' },
  grow: { flex: 1 },
  content: { paddingHorizontal: space.m + 4, gap: space.m },
  card: {
    padding: space.m + 2,
    gap: space.m - 2,
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    boxShadow: shadows(colors).floating,
  },
  band: {
    height: 180,
    justifyContent: 'flex-end',
    paddingBottom: space.m,
    backgroundColor: '#FFE9A8',
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  faces: { flexDirection: 'row', justifyContent: 'center' },
  face: { width: 64, height: 64, borderRadius: radius.pill, borderWidth: 4, borderColor: '#FFFFFF' },
  faceOverlap: { marginLeft: -12 },
  faceMissing: { opacity: 0.55 },
  bubbleLeft: { position: 'absolute', left: space.m, top: space.m },
  bubbleRight: { position: 'absolute', right: space.m, top: space.m + 6 },
  bubble: {
    paddingHorizontal: space.m - 2,
    paddingVertical: space.s - 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#15151A',
    borderRadius: radius.pill,
  },
  center: { textAlign: 'center' },
  muted: { color: colors.textMuted },
  link: { alignItems: 'center', paddingVertical: space.s + 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 4,
    padding: space.m - 2,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
  },
  pillTitle: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  list: { gap: space.s + 2 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 2,
    padding: space.m,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
  },
}));
