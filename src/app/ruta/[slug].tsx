import { useState } from 'react';
import { Alert, Animated, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import IconTile, { TILE_COLORS } from '@/components/IconTile';
import MediaImage from '@/components/MediaImage';
import { Appear, useParallax } from '@/components/motion';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { countDiscovered, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { DownloadStatus, useRouteDownload } from '@/data/useRouteDownload';
import { makeStyles, radius, shadows, space, useTheme } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';
import { tap } from '@/audio/haptics';

const HERO = 260;

// Detalle de la ruta: progreso del pasaporte, accesos, paradas en orden e
// información de la ruta.
export default function RouteScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  // La foto de arriba se queda un poco atrás al bajar (parallax).
  const parallax = useParallax(HERO);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const state = useData(() => getRoute(slug), slug);
  const download = useRouteDownload(slug);
  const { discovered } = useProgress();
  const [tab, setTab] = useState<'paradas' | 'info'>('paradas');

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error')
    return (
      <StateMessage
        message="No se pudo cargar el recorrido. Revisa tu conexión."
        onRetry={state.reload}
        showHomeButton
      />
    );
  const route = state.data;
  if (!route) return <StateMessage message="Este recorrido no existe." showHomeButton />;

  const total = route.places.length;
  const done = countDiscovered(route.places.map((p) => p.id), discovered);
  const nextPlace = route.places.find((p) => !(p.id in discovered));
  const meta = [
    `${total} paradas`,
    route.distance_m != null ? formatDistance(route.distance_m) : null,
    route.duration_min != null ? formatDuration(route.duration_min) : null,
  ].filter(Boolean);
  const startTour = () => router.push({ pathname: '/tour', params: { route: route.slug } });

  return (
    <View style={styles.screen}>
      <BackButton />
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE }}
        onScroll={parallax.onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <Animated.View style={[styles.heroImage, parallax.heroStyle]}>
            <MediaImage uri={route.media.cover} style={styles.heroImage} label={route.name} drift />
          </Animated.View>
        </View>

        <View style={styles.content}>
          {/* Tarjeta del pasaporte: cuántas paradas lleva. */}
          <Appear delay={60} style={styles.card}>
            <View style={styles.progressRow}>
              <MediaImage uri={route.places[0]?.media.image ?? route.media.cover} style={styles.avatar} />
              <View style={styles.grow}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(done / total, 0.06) * 100}%` }]} />
                </View>
                <Txt variant="caption" style={styles.progressText}>
                  {done === total ? '¡Pasaporte completo!' : `${done} de ${total} sellos en tu pasaporte`}
                </Txt>
              </View>
            </View>
            <View>
              <Txt variant="overline">RUTA 01</Txt>
              <Txt variant="title">{route.name}</Txt>
              <Txt variant="caption">{meta.join('   ')}</Txt>
            </View>
          </Appear>

          {/* Accesos rápidos. */}
          <Appear delay={120} style={styles.tiles}>
            <IconTile icon="map-outline" label="Mapa" color={TILE_COLORS.verde} onPress={startTour} />
            <IconTile
              icon="book-outline"
              label="Pasaporte"
              color={TILE_COLORS.amarillo}
              badge={done || null}
              onPress={() => router.push({ pathname: '/completado', params: { route: route.slug } })}
            />
            <OfflineTile status={download.status} onDownload={download.start} onDelete={download.remove} />
            <IconTile icon="settings-outline" label="Ajustes" color={TILE_COLORS.menta} onPress={() => router.push('/ajustes')} />
          </Appear>

          {/* Pestañas: paradas o información de la ruta. */}
          <View style={styles.tabs} accessibilityRole="tablist">
            {(
              [
                ['paradas', 'Paradas', 'location-outline'],
                ['info', 'Sobre la ruta', 'information-circle-outline'],
              ] as const
            ).map(([key, label, icon]) => {
              const on = tab === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    tap();
                    setTab(key);
                  }}
                  style={[styles.tab, on && styles.tabOn]}
                >
                  <Ionicons name={icon} size={16} color={on ? colors.primaryText : colors.textMuted} />
                  <Txt variant="label" color={on ? colors.text : colors.textMuted} style={styles.tabText}>
                    {label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          {tab === 'paradas' ? (
            <View style={styles.list}>
              {route.places.map((place, index) => (
                <PlaceListItem
                  key={place.id}
                  place={place}
                  position={index + 1}
                  discovered={place.id in discovered}
                  next={place.id === nextPlace?.id}
                  onPress={() => router.push(`/lugar/${place.id}?route=${route.slug}`)}
                />
              ))}
            </View>
          ) : (
            <Appear style={styles.info}>
              <Txt variant="body">
                {route.description || 'Pronto vas a encontrar aquí más información sobre esta ruta.'}
              </Txt>
              <View style={styles.infoFacts}>
                {meta.map((m) => (
                  <View key={m} style={styles.infoChip}>
                    <Txt variant="label">{m}</Txt>
                  </View>
                ))}
              </View>
            </Appear>
          )}
        </View>
      </Animated.ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          <Button
            label={done > 0 && done < total ? 'Seguir recorrido' : 'Comenzar tour'}
            icon="arrow-forward"
            iconRight
            onPress={startTour}
          />
        </View>
      </BottomBar>
    </View>
  );
}

// Baldosa "Sin señal": descarga la ruta para usarla sin conexión y muestra
// en qué va la descarga.
function OfflineTile({ status, onDownload, onDelete }: { status: DownloadStatus; onDownload: () => void; onDelete: () => void }) {
  const ready = status.kind === 'downloaded' && !status.outdated;
  const label =
    status.kind === 'downloading'
      ? `${status.done}/${status.total}`
      : ready
        ? 'Descargada'
        : status.kind === 'downloaded'
          ? 'Actualizar'
          : status.kind === 'error'
            ? 'Reintentar'
            : 'Sin señal';
  const onPress = () => {
    if (status.kind === 'unavailable')
      return Alert.alert('Sin señal', 'La descarga para usar sin conexión funciona en la app instalada en el celular.');
    if (status.kind === 'downloading') return;
    if (ready)
      return Alert.alert('Recorrido descargado', 'Está guardado en tu celular y funciona sin conexión.', [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Borrar descarga', style: 'destructive', onPress: onDelete },
      ]);
    onDownload();
  };
  return (
    <IconTile
      icon={ready ? 'checkmark-circle-outline' : status.kind === 'error' ? 'refresh' : 'cloud-download-outline'}
      label={label}
      color={TILE_COLORS.lavanda}
      onPress={onPress}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  grow: { flex: 1 },
  hero: { height: HERO, overflow: 'hidden' },
  heroImage: { height: HERO },
  content: { paddingHorizontal: space.m + 4, gap: space.m + 4, marginTop: -64 },
  card: {
    padding: space.m + 4,
    gap: space.m,
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    boxShadow: shadows(colors).floating,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.m - 4 },
  avatar: { width: 52, height: 52, borderRadius: radius.pill, borderWidth: 3, borderColor: colors.surface, boxShadow: shadows(colors).soft },
  track: { height: 14, backgroundColor: colors.accent, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  progressText: { marginTop: space.xs + 2 },
  tiles: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.xs },
  tabs: { flexDirection: 'row', padding: space.xs, gap: space.xs, backgroundColor: colors.panel, borderRadius: radius.m - 4 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s - 2,
    paddingVertical: space.s + 2,
    borderRadius: radius.s,
  },
  tabOn: { backgroundColor: colors.surface, boxShadow: shadows(colors).soft },
  tabText: { fontSize: 14 },
  list: { gap: space.s + 2 },
  info: { gap: space.m },
  infoFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  infoChip: { paddingHorizontal: space.m - 2, paddingVertical: space.s, backgroundColor: colors.panel, borderRadius: radius.pill },
}));
