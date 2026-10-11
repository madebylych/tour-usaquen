import { Animated, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import MediaImage from '@/components/MediaImage';
import { Appear, Stamp, usePressSpring, Wobble, Words } from '@/components/motion';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { getRoute, listRoutes } from '@/data/source';
import { countDiscovered, useProgress } from '@/data/progress';
import { useData } from '@/data/useData';
import { line, makeStyles, space, useTheme } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';

// Inicio. Con una sola ruta en el MVP, la ruta destacada es la primera.
async function loadFeaturedRoute() {
  const routes = await listRoutes();
  return routes[0] ? getRoute(routes[0].slug) : null;
}

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
  const done = countDiscovered(route.places.map((p) => p.id), discovered);
  const meta = [
    route.duration_min != null ? formatDuration(route.duration_min) : null,
    route.distance_m != null ? formatDistance(route.distance_m) : null,
    `${route.places.length} paradas`,
    done > 0 ? `${done} descubiertas` : null,
  ].filter(Boolean);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.l, paddingBottom: space.xl }]}
    >
      <View style={styles.topRow}>
        <Txt variant="overline" color={colors.text}>
          USAQUÉN, BOGOTÁ
        </Txt>
        <View style={styles.topRight}>
          <Txt variant="overline">N.º 01</Txt>
          <SettingsButton />
        </View>
      </View>

      {/* El titular entra palabra por palabra. */}
      <View style={styles.headline} accessible accessibilityRole="header" accessibilityLabel="Camina, escucha, descubre.">
        <Words text="Camina, escucha, descubre." delay={80} render={(word) => <Txt variant="display">{word}</Txt>} />
      </View>

      <Appear delay={100}>
        <MediaImage uri={route.media.cover} style={styles.cover} label={route.name} drift />
        <Stamp delay={450} rotate="-6deg" style={styles.sticker}>
          {/* Ya estampado, el sticker se mece un poco. */}
          <Wobble delay={1200} from="0deg" to="4deg">
            <View style={styles.stickerInk}>
              <Txt variant="label" color={colors.onAccent}>
                Recorrido 01
              </Txt>
            </View>
          </Wobble>
        </Stamp>
      </Appear>

      <Appear delay={200} style={styles.routeInfo}>
        <Txt variant="title">{route.name}</Txt>
        <Txt variant="caption">{meta.join(' / ')}</Txt>
      </Appear>
      <Appear delay={280}>
        <Button label="Ver recorrido" icon="arrow-forward" iconRight onPress={openRoute} />
      </Appear>

      <Txt variant="heading" highlight style={styles.sectionTitle}>
        Boletos del recorrido
      </Txt>
      <View style={styles.list}>
        {route.places.map((place, index) => (
          <PlaceListItem
            key={place.id}
            place={place}
            position={index + 1}
            discovered={place.id in discovered}
            onPress={() => router.push(`/lugar/${place.id}?route=${route.slug}`)}
          />
        ))}
      </View>

      <Txt variant="caption" style={styles.footer}>
        Un proyecto de Creación Digital, Arquitectura y Música.
      </Txt>
    </ScrollView>
  );
}

// Engranaje de Ajustes: al tocarlo da media vuelta.
function SettingsButton() {
  const styles = useStyles();
  const { colors } = useTheme();
  const press = usePressSpring(0.88);
  const rotate = press.scale.interpolate({ inputRange: [0.88, 1], outputRange: ['90deg', '0deg'] });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ajustes"
      onPress={() => router.push('/ajustes')}
      onPressIn={press.in}
      onPressOut={press.out}
      hitSlop={8}
      style={({ pressed }) => [styles.themeButton, pressed && styles.themeButtonPressed]}
    >
      <Animated.View style={{ transform: [{ scale: press.scale }, { rotate }] }}>
        <Ionicons name="settings-sharp" size={18} color={colors.text} />
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.m + 6, gap: space.m },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space.m - 4 },
  themeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: line,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  themeButtonPressed: { backgroundColor: colors.accent },
  headline: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.m, marginBottom: space.s },
  cover: { height: 220 },
  sticker: { position: 'absolute', left: space.m - 4, bottom: space.m + 4 },
  stickerInk: {
    paddingVertical: space.s,
    paddingHorizontal: space.m - 4,
    backgroundColor: colors.accent,
    borderWidth: line,
    borderColor: colors.border,
  },
  routeInfo: { gap: space.xs, marginTop: space.s },
  sectionTitle: { marginTop: space.m },
  list: { gap: space.m - 4 },
  footer: { textAlign: 'center', marginTop: space.m },
}));
