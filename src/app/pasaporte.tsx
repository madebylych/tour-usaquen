import { ComponentProps } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import MediaImage from '@/components/MediaImage';
import { Appear, Breathe, Stamp } from '@/components/motion';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { useAuth } from '@/data/auth';
import { countDiscovered, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { useExplored } from '@/geo/useScratch';
import { fonts, makeStyles, radius, shadows, space, useTheme } from '@/theme';
import { formatDistance } from '@/utils/format';
import { tap } from '@/audio/haptics';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Inclinación de cada sello: así parecen estampados a mano.
const TILT = ['-7deg', '5deg', '-3deg', '8deg', '-5deg', '4deg'];

// Meses escritos a mano: no depende de que el celular traiga Intl en español.
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const formatDay = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// Pasaporte creativo: la libreta del visitante con un sello por parada,
// lo explorado en el mapa para raspar y la opción de compartirlo.
export default function PassportScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);
  const { discovered } = useProgress();
  const auth = useAuth();
  const places = state.status === 'ready' && state.data ? state.data.places : NO_PLACES;
  const explored = useExplored(places);

  if (!slug) return <StateMessage message="No se sabe qué pasaporte mostrar." showHomeButton />;
  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data)
    return <StateMessage message="No se pudo cargar el pasaporte." onRetry={state.reload} showHomeButton />;
  const route = state.data;

  const total = places.length;
  const done = countDiscovered(places.map((p) => p.id), discovered);
  const complete = total > 0 && done === total;
  const dates = places.filter((p) => p.id in discovered).map((p) => discovered[p.id]);
  const since = dates.length > 0 ? formatDay(Math.min(...dates)) : null;
  const holder = auth.status === 'signedIn' ? (auth.name ?? auth.email.split('@')[0]) : 'Visitante';
  // Número del pasaporte: sale de la cuenta (siempre el mismo) o "invitado".
  const number = auth.status === 'signedIn' ? `USQ-${auth.userId.slice(0, 6).toUpperCase()}` : 'USQ-INVITADO';

  const share = () => {
    tap();
    const lines = places.map((p) => `${p.id in discovered ? '✔' : '○'} ${p.name}`);
    const head = complete
      ? `Completé mi pasaporte creativo de "${route.name}" en el Tour Usaquén.`
      : `Llevo ${done} de ${total} sellos en mi pasaporte creativo de "${route.name}" (Tour Usaquén).`;
    const tail = explored.percent > 0 ? `\nExploré el ${explored.percent} % de la ruta caminando.` : '';
    Share.share({ message: `${head}\n\n${lines.join('\n')}${tail}` }).catch(() => {});
  };

  const openPlace = (id: string) => {
    tap();
    router.push(`/lugar/${id}?route=${route.slug}`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + space.l }]}
      >
        <Appear>
          <Txt variant="display" style={styles.title}>
            Mi pasaporte
          </Txt>
          <Txt variant="caption">{route.name}</Txt>
        </Appear>

        {/* La libreta: portada del pasaporte con los datos del visitante. */}
        <Appear delay={120} style={styles.book}>
          <View style={styles.bookTop}>
            <View style={styles.grow}>
              <Txt variant="overline" color={colors.onPrimary} style={styles.dim}>
                PASAPORTE CREATIVO
              </Txt>
              <Txt style={[styles.bookName, { color: colors.onPrimary }]}>Usaquén</Txt>
            </View>
            <Stamp delay={500} rotate="10deg">
              <View style={[styles.seal, { borderColor: colors.onPrimary }]}>
                <Txt style={[styles.sealCount, { color: colors.onPrimary }]}>
                  {done}/{total}
                </Txt>
                <Txt variant="caption" color={colors.onPrimary} style={styles.sealLabel}>
                  {complete ? 'COMPLETO' : 'SELLOS'}
                </Txt>
              </View>
            </Stamp>
          </View>
          <View style={[styles.bookRule, { backgroundColor: colors.onPrimary }]} />
          <View style={styles.bookFields}>
            <Field label="TITULAR" value={holder} />
            <Field label="N.º" value={number} />
          </View>
          <View style={styles.bookFields}>
            <Field label="PRIMER SELLO" value={since ?? 'Todavía ninguno'} />
            <Field label="CIUDAD" value="Bogotá, Colombia" />
          </View>
        </Appear>

        {/* Lo que lleva. */}
        <Appear delay={200} style={styles.stats}>
          <Stat icon="ribbon-outline" label="Sellos" value={`${done} de ${total}`} />
          <Stat icon="map-outline" label="Explorado" value={`${explored.percent} %`} />
          <Stat icon="footsteps-outline" label="Caminado" value={formatDistance(explored.walkedM)} />
        </Appear>

        {/* Un sello por parada, en el orden de la ruta. */}
        <Appear delay={280} style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Txt variant="heading">Sellos</Txt>
            <Txt variant="caption">Toca uno para ver la parada</Txt>
          </View>
          <View style={styles.grid}>
            {places.map((place, index) => {
              const at = discovered[place.id];
              const isDone = at != null;
              const isNext = !isDone && places.findIndex((p) => !(p.id in discovered)) === index;
              const face = isDone ? (
                <Stamp delay={350 + index * 110} rotate={TILT[index % TILT.length]}>
                  <View style={[styles.stampRing, { borderColor: colors.primary }]}>
                    <MediaImage uri={place.media.image} style={styles.stampPhoto} label={place.name} />
                    <View style={styles.stampCheck}>
                      <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                    </View>
                  </View>
                </Stamp>
              ) : (
                <View style={[styles.stampRing, styles.stampEmpty, isNext && { borderColor: colors.primaryText }]}>
                  <Txt style={[styles.stampNumber, { color: isNext ? colors.primaryText : colors.textMuted }]}>
                    {String(index + 1).padStart(2, '0')}
                  </Txt>
                </View>
              );
              return (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${place.name}: ${isDone ? `sellado el ${formatDay(at)}` : 'por descubrir'}`}
                  onPress={() => openPlace(place.id)}
                  style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
                >
                  {isNext ? <Breathe amount={0.08}>{face}</Breathe> : face}
                  <Txt variant="label" numberOfLines={2} style={styles.center}>
                    {place.name}
                  </Txt>
                  <Txt variant="caption" style={styles.center} color={isDone ? colors.success : undefined}>
                    {isDone ? formatDay(at) : isNext ? 'Siguiente' : 'Por descubrir'}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </Appear>

        <Appear delay={360} style={styles.actions}>
          <Button label="Compartir mi pasaporte" variant="accent" icon="share-outline" onPress={share} />
          {done > 0 ? (
            <Button
              label={complete ? 'Ver la celebración' : 'Ver resumen del recorrido'}
              variant="secondary"
              onPress={() => router.push({ pathname: '/completado', params: { route: route.slug } })}
            />
          ) : (
            <Button
              label="Empezar recorrido"
              icon="arrow-forward"
              iconRight
              onPress={() => router.push({ pathname: '/tour', params: { route: route.slug } })}
            />
          )}
        </Appear>
      </ScrollView>
      <BackButton />
    </View>
  );
}

const NO_PLACES: never[] = [];

function Field({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.grow}>
      <Txt variant="caption" color={colors.onPrimary} style={[styles.fieldLabel, styles.dim]}>
        {label}
      </Txt>
      <Txt variant="label" color={colors.onPrimary} numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={20} color={colors.primaryText} />
      <Txt variant="label">{value}</Txt>
      <Txt variant="caption">{label}</Txt>
    </View>
  );
}

const STAMP = 76;

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.m + 4, gap: space.m },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  dim: { opacity: 0.75 },
  title: { fontSize: 38, lineHeight: 42 },
  book: {
    padding: space.m + 4,
    gap: space.m - 2,
    backgroundColor: colors.primary,
    borderRadius: radius.l,
    boxShadow: shadows(colors).floating,
  },
  bookTop: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  bookName: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44 },
  seal: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
  },
  sealCount: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  sealLabel: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 14, letterSpacing: 0.5 },
  bookRule: { height: 1, opacity: 0.3 },
  bookFields: { flexDirection: 'row', gap: space.m },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, letterSpacing: 1.2 },
  stats: { flexDirection: 'row', gap: space.s + 2 },
  stat: {
    flex: 1,
    gap: 2,
    padding: space.m - 2,
    backgroundColor: colors.panel,
    borderRadius: radius.m,
  },
  card: {
    padding: space.m + 4,
    gap: space.m,
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.s },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.l, justifyContent: 'space-between' },
  cell: { width: '47%', alignItems: 'center', gap: space.xs },
  pressed: { opacity: 0.7 },
  stampRing: {
    width: STAMP,
    height: STAMP,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    marginBottom: space.xs,
  },
  stampPhoto: { width: '100%', height: '100%', borderRadius: radius.pill },
  stampCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: radius.pill,
  },
  stampEmpty: { borderColor: colors.border, backgroundColor: colors.panel },
  stampNumber: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  actions: { gap: space.s + 2 },
}));
