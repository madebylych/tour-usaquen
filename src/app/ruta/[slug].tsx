import { Animated, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import BackButton from '@/components/BackButton';
import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import DownloadButton from '@/components/DownloadButton';
import MediaImage from '@/components/MediaImage';
import { useParallax } from '@/components/motion';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { useRouteDownload } from '@/data/useRouteDownload';
import { line, makeStyles, space, useTheme } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';

// Detalle de la ruta: datos generales, paradas en orden y descarga offline.
export default function RouteScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  // La foto de arriba se queda un poco atrás al bajar (parallax).
  const parallax = useParallax(290);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const state = useData(() => getRoute(slug), slug);
  const download = useRouteDownload(slug);
  const { discovered } = useProgress();

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

  const meta = [
    route.duration_min != null ? formatDuration(route.duration_min) : null,
    route.distance_m != null ? formatDistance(route.distance_m) : null,
    `${route.places.length} paradas`,
  ].filter(Boolean);

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
          <View style={styles.titleBlock}>
            <Txt variant="overline">RECORRIDO 01</Txt>
            <Txt variant="title" color={colors.primary}>
              {route.name}
            </Txt>
            <Txt variant="caption">{meta.join(' / ')}</Txt>
          </View>
          {route.description ? <Txt variant="body">{route.description}</Txt> : null}

          <Txt variant="heading" highlight style={styles.sectionTitle}>
            Boletos
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
        </View>
      </Animated.ScrollView>

      <BottomBar>
        <DownloadButton status={download.status} onDownload={download.start} onDelete={download.remove} />
        <View style={styles.grow}>
          <Button
            label="Comenzar tour"
            icon="arrow-forward"
            iconRight
            onPress={() => router.push({ pathname: '/tour', params: { route: route.slug } })}
          />
        </View>
      </BottomBar>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 290, overflow: 'hidden', borderBottomWidth: line, borderColor: colors.border },
  heroImage: { height: 290 },
  content: { padding: space.m + 6, gap: space.m },
  titleBlock: { gap: space.s },
  sectionTitle: { marginTop: space.s },
  list: { gap: space.m - 4 },
  grow: { flex: 1 },
}));
