import { ComponentProps } from 'react';
import { Alert, Animated, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import MediaImage from '@/components/MediaImage';
import { Appear, Stamp, useHover, usePressSpring, Wobble } from '@/components/motion';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { getRoute, listRoutes } from '@/data/source';
import { countDiscovered, useProgress } from '@/data/progress';
import { useData } from '@/data/useData';
import { useRouteDownload } from '@/data/useRouteDownload';
import { fonts, makeStyles, radius, shadows, space, useTheme } from '@/theme';
import { RouteWithPlaces } from '@/types';
import { formatDistance, formatDuration } from '@/utils/format';
import { tap } from '@/audio/haptics';

// Inicio. Con una sola ruta en el MVP, la ruta destacada es la primera.
async function loadFeaturedRoute() {
  const routes = await listRoutes();
  return routes[0] ? getRoute(routes[0].slug) : null;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const state = useData(loadFeaturedRoute, 'featured');
  const { discovered } = useProgress();

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error')
    return <StateMessage message="No se pudo cargar el contenido. Revisa tu conexión." onRetry={state.reload} />;
  const route = state.data;
  if (!route)
    return (
      <StateMessage
        message="No hay recorridos disponibles. Si no tienes conexión, conéctate para cargarlos."
        onRetry={state.reload}
      />
    );

  const openRoute = () => router.push(`/ruta/${route.slug}`);
  const openTour = () => router.push({ pathname: '/tour', params: { route: route.slug } });
  const openPlace = (id: string) => router.push(`/lugar/${id}?route=${route.slug}`);
  const done = countDiscovered(route.places.map((p) => p.id), discovered);
  const nextPlace = route.places.find((p) => !(p.id in discovered)) ?? route.places[0];

  const meta: { icon: IconName; text: string }[] = [
    { icon: 'location-outline', text: `${route.places.length} paradas` },
    ...(route.distance_m != null ? [{ icon: 'walk-outline' as IconName, text: formatDistance(route.distance_m) }] : []),
    ...(route.duration_min != null ? [{ icon: 'time-outline' as IconName, text: formatDuration(route.duration_min) }] : []),
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE }}>
        {/* Cabecera: "Usaquén" gigante detrás de la postal de la ruta. */}
        <View style={[styles.hero, { paddingTop: insets.top + space.s }]}>
          <Txt style={[styles.giant, { top: insets.top + space.l + 6 }]} accessible={false} numberOfLines={1}>
            Usaquén
          </Txt>
          <View style={styles.topRow}>
            <Txt variant="overline" color={colors.text}>
              BOGOTÁ, COLOMBIA
            </Txt>
            <SettingsButton />
          </View>
          <Wobble delay={900} from="-6deg" to="6deg" style={styles.noteLeft}>
            <Ionicons name="musical-notes" size={30} color="#FFFFFF" />
          </Wobble>
          <Wobble delay={1300} from="8deg" to="-4deg" style={styles.noteRight}>
            <Ionicons name="sparkles" size={22} color="#FFFFFF" />
          </Wobble>
          <Appear delay={100}>
            <MiniPostcard uri={route.media.cover} label={route.name} onPress={openRoute} />
          </Appear>
        </View>

        <View style={styles.content}>
          {/* Tarjeta de la ruta con sus accesos. */}
          <Appear delay={180} style={styles.card}>
            <Pressable accessibilityRole="button" onPress={openRoute} style={styles.cardHeader}>
              <View style={styles.grow}>
                <Txt variant="heading">{route.name}</Txt>
                <View style={styles.metaRow}>
                  {meta.map((m) => (
                    <View key={m.text} style={styles.meta}>
                      <Ionicons name={m.icon} size={14} color={colors.textMuted} />
                      <Txt variant="caption">{m.text}</Txt>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.chevronBox}>
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </View>
            </Pressable>
            <View style={styles.divider} />
            <View style={styles.shortcuts}>
              <Shortcut icon="map-outline" label="Mapa" onPress={openTour} />
              <Shortcut icon="headset-outline" label="Audios" onPress={() => router.push(`/ruta/${route.slug}?tab=audios`)} />
              <Shortcut icon="eye-outline" label="Observa" onPress={() => openPlace(nextPlace.id)} />
              <Shortcut
                icon="book-outline"
                label="Sellos"
                badge={done}
                onPress={() => router.push({ pathname: '/completado', params: { route: route.slug } })}
              />
            </View>
          </Appear>

          {/* Paradas del recorrido. */}
          <Appear delay={260} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Txt variant="heading">Paradas del recorrido</Txt>
              <Txt variant="caption">
                {done} de {route.places.length}
              </Txt>
            </View>
            {route.places.map((place, index) => {
              const isDone = place.id in discovered;
              return (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Parada ${index + 1}: ${place.name}${isDone ? ', descubierta' : ''}`}
                  onPress={() => {
                    tap();
                    openPlace(place.id);
                  }}
                  style={({ pressed }) => [styles.stop, pressed && styles.stopPressed]}
                >
                  <MediaImage uri={place.media.image} style={styles.stopPhoto} label={place.name} />
                  <View style={[styles.grow, index < route.places.length - 1 && styles.stopLine]}>
                    <Txt variant="label" numberOfLines={1}>
                      {place.name}
                    </Txt>
                    <Txt variant="caption" color={isDone ? colors.success : undefined}>
                      {isDone ? 'Descubierta' : place.id === nextPlace.id ? 'Siguiente parada' : `Parada ${index + 1}`}
                    </Txt>
                  </View>
                  <View style={[styles.stopIcon, isDone && styles.stopIconDone]}>
                    <Ionicons
                      name={isDone ? 'checkmark' : 'chevron-forward'}
                      size={16}
                      color={isDone ? colors.primaryText : colors.textMuted}
                    />
                  </View>
                </Pressable>
              );
            })}
          </Appear>

          <OfflineBanner route={route} />

          <Txt variant="caption" style={styles.footer}>
            Un proyecto de Creación Digital, Arquitectura y Música.
          </Txt>
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          <Button
            label={done > 0 && done < route.places.length ? 'Seguir recorrido' : 'Empezar recorrido'}
            icon="arrow-forward"
            iconRight
            onPress={openTour}
          />
        </View>
      </BottomBar>
    </View>
  );
}

// Postal pequeña y torcida; con hover (o al presionarla) se endereza.
function MiniPostcard({ uri, label, onPress }: { uri: string | null; label: string; onPress: () => void }) {
  const styles = useStyles();
  const hover = useHover();
  const rotate = hover.value.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '0deg'] });
  const lift = hover.value.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver recorrido: ${label}`}
      onPress={() => {
        tap();
        onPress();
      }}
      {...hover.handlers}
      style={styles.postcardWrap}
    >
      <Animated.View style={[styles.postcard, { transform: [{ translateY: lift }, { rotate }] }]}>
        <MediaImage uri={uri} style={styles.postcardPhoto} label={label} />
        <Stamp delay={500} rotate="8deg" style={styles.postcardStamp}>
          <View style={styles.stampInner}>
            <Txt variant="caption" color="#15151A" style={styles.stampText}>
              RUTA 01
            </Txt>
          </View>
        </Stamp>
      </Animated.View>
    </Pressable>
  );
}

function Shortcut({ icon, label, onPress, badge }: { icon: IconName; label: string; onPress: () => void; badge?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const press = usePressSpring(0.88);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      onPress={onPress}
      onPressIn={() => {
        tap();
        press.in();
      }}
      onPressOut={press.out}
      style={styles.shortcut}
    >
      <Animated.View style={{ transform: [{ scale: press.scale }] }}>
        <Ionicons name={icon} size={26} color={colors.text} />
        {badge ? (
          <View style={styles.badge}>
            <Txt variant="caption" color={colors.onPrimary} style={styles.badgeText}>
              {badge}
            </Txt>
          </View>
        ) : null}
      </Animated.View>
      <Txt variant="caption" color={colors.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

// Aviso para descargar la ruta antes de salir. No aparece donde no se puede
// descargar (vista previa web o sin servidor de contenido).
function OfflineBanner({ route }: { route: RouteWithPlaces }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const download = useRouteDownload(route.slug);
  const status = download.status;
  if (status.kind === 'unavailable') return null;

  const ready = status.kind === 'downloaded' && !status.outdated;
  const action =
    status.kind === 'downloading'
      ? `Descargando ${status.done}/${status.total}`
      : ready
        ? 'Lista para usar sin señal'
        : status.kind === 'downloaded'
          ? 'Hay una versión nueva: actualizar'
          : status.kind === 'error'
            ? 'Falló la descarga: reintentar'
            : 'Descarga la ruta antes de salir';
  const onPress = () => {
    tap();
    if (status.kind === 'downloading') return;
    if (ready)
      Alert.alert('Recorrido descargado', 'Está guardado en tu celular y funciona sin conexión.', [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Borrar descarga', style: 'destructive', onPress: download.remove },
      ]);
    else download.start();
  };

  return (
    <Appear delay={340}>
      <Pressable accessibilityRole="button" accessibilityLabel={`¿Sin señal? ${action}`} onPress={onPress} style={styles.banner}>
        <View style={styles.grow}>
          <Txt variant="display" style={styles.bannerTitle}>
            ¿Sin{'\n'}señal?
          </Txt>
          <Txt variant="caption" color={colors.text} style={styles.bannerText}>
            {action}
          </Txt>
        </View>
        <View style={styles.bannerArt}>
          <MediaImage uri={route.places[route.places.length - 1]?.media.image ?? route.media.cover} style={styles.bannerPhoto} />
          <View style={styles.bannerButton}>
            <Ionicons name={ready ? 'checkmark' : 'download-outline'} size={22} color={colors.onInk} />
          </View>
        </View>
      </Pressable>
    </Appear>
  );
}

// Engranaje de Ajustes: al tocarlo da media vuelta.
function SettingsButton() {
  const styles = useStyles();
  const { colors } = useTheme();
  const press = usePressSpring(0.88);
  const hover = useHover();
  const rotate = Animated.add(
    press.scale.interpolate({ inputRange: [0.88, 1], outputRange: [1, 0] }),
    hover.value
  ).interpolate({ inputRange: [0, 2], outputRange: ['0deg', '180deg'] });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ajustes"
      onPress={() => router.push('/ajustes')}
      onPressIn={() => {
        tap();
        press.in();
      }}
      onPressOut={press.out}
      onHoverIn={hover.handlers.onHoverIn}
      onHoverOut={hover.handlers.onHoverOut}
      hitSlop={8}
      style={styles.settingsButton}
    >
      <Animated.View style={{ transform: [{ scale: press.scale }, { rotate }] }}>
        <Ionicons name="settings-sharp" size={18} color={colors.text} />
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  grow: { flex: 1 },
  hero: {
    height: 372,
    overflow: 'hidden',
    paddingHorizontal: space.m + 4,
    backgroundColor: colors.hero,
  },
  giant: {
    position: 'absolute',
    left: -14,
    width: 700,
    fontFamily: fonts.display,
    fontSize: 128,
    lineHeight: 140,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    boxShadow: shadows(colors).soft,
  },
  noteLeft: { position: 'absolute', left: 30, top: 230 },
  noteRight: { position: 'absolute', right: 34, top: 180 },
  postcardWrap: { alignSelf: 'center', marginTop: 74 },
  postcard: {
    width: 230,
    padding: space.s,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.s,
    boxShadow: '0px 12px 28px #15151A40',
  },
  postcardPhoto: { height: 150, borderRadius: space.s },
  postcardStamp: { position: 'absolute', right: -10, top: -12 },
  stampInner: {
    paddingHorizontal: space.s,
    paddingVertical: space.xs,
    backgroundColor: '#FFE08A',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#15151A',
    borderRadius: 6,
  },
  stampText: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, letterSpacing: 1 },
  content: { paddingHorizontal: space.m + 4, gap: space.m, marginTop: -78 },
  card: {
    padding: space.m + 4,
    gap: space.m - 4,
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    boxShadow: shadows(colors).floating,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.m - 4, marginTop: space.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chevronBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: 9,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: -(space.m + 4) },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: space.xs },
  shortcut: { alignItems: 'center', gap: space.s - 2, minWidth: 64 },
  badge: {
    position: 'absolute',
    right: -10,
    top: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  stop: { flexDirection: 'row', alignItems: 'center', gap: space.m - 2, borderRadius: radius.s },
  stopPressed: { opacity: 0.7 },
  stopPhoto: { width: 48, height: 48, borderRadius: radius.pill },
  stopLine: { paddingVertical: space.s + 2 },
  stopIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderRadius: radius.pill,
  },
  stopIconDone: { backgroundColor: colors.primarySoft },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    minHeight: 132,
    padding: space.m + 4,
    backgroundColor: colors.hero,
    borderRadius: radius.l,
    overflow: 'hidden',
  },
  bannerTitle: { fontSize: 32, lineHeight: 34, color: colors.text },
  bannerText: { marginTop: space.s, fontFamily: fonts.medium },
  bannerArt: { width: 120, height: 96 },
  bannerPhoto: { width: 116, height: 88, borderRadius: radius.s, borderWidth: 4, borderColor: '#FFFFFF', transform: [{ rotate: '6deg' }] },
  bannerButton: {
    position: 'absolute',
    right: -6,
    bottom: -8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: radius.pill,
  },
  footer: { textAlign: 'center', marginTop: space.s },
}));
