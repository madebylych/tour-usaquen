import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import Chip from '@/components/Chip';
import ImagePlaceholder from '@/components/ImagePlaceholder';
import PlaceCard from '@/components/PlaceCard';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { getRoute, listRoutes } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, radius, shadow, space } from '@/theme';
import { categoryIcon } from '@/utils/categories';
import { formatDistance, formatDuration } from '@/utils/format';

// Inicio. Con una sola ruta en el MVP, la ruta destacada es la primera.
async function loadFeaturedRoute() {
  const routes = await listRoutes();
  return routes[0] ? getRoute(routes[0].slug) : null;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const state = useData(loadFeaturedRoute, 'featured');
  const [category, setCategory] = useState<string | null>(null);

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error') return <StateMessage message="No se pudo cargar el contenido." />;
  const route = state.data;
  if (!route) return <StateMessage message="No hay recorridos disponibles." />;

  const categories = [...new Set(route.places.map((p) => p.category))];
  const visiblePlaces = route.places
    .map((place, index) => ({ place, position: index + 1 }))
    .filter(({ place }) => !category || place.category === category);

  const openRoute = () => router.push(`/ruta/${route.slug}`);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: space.xl }}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + space.m }]}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={colors.onPrimary} />
          <Txt variant="label" color={colors.onPrimary}>
            Usaquén, Bogotá
          </Txt>
        </View>
        <Txt variant="display" color={colors.onPrimary}>
          ¿Qué vas a descubrir hoy?
        </Txt>
        <Txt variant="body" color={colors.onPrimary} style={styles.headerSubtitle}>
          Camina, escucha y explora el Distrito Creativo.
        </Txt>
      </View>

      <View style={styles.featured}>
        <ImagePlaceholder style={styles.featuredImage} iconSize={48} />
        <View style={styles.featuredBody}>
          <Txt variant="caption" color={colors.primary}>
            RECORRIDO DESTACADO
          </Txt>
          <Txt variant="title">{route.name}</Txt>
          <View style={styles.chipRow}>
            {route.duration_min != null ? (
              <Chip icon="time-outline" label={formatDuration(route.duration_min)} />
            ) : null}
            {route.distance_m != null ? (
              <Chip icon="walk-outline" label={formatDistance(route.distance_m)} />
            ) : null}
            <Chip icon="flag-outline" label={`${route.places.length} paradas`} />
          </View>
          <Button label="Ver recorrido" icon="arrow-forward" onPress={openRoute} />
        </View>
      </View>

      <Txt variant="heading" style={styles.sectionTitle}>
        Paradas del recorrido
      </Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
        <Chip label="Todas" active={category === null} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c}
            label={c}
            icon={categoryIcon(c)}
            active={category === c}
            onPress={() => setCategory(category === c ? null : c)}
          />
        ))}
      </ScrollView>
      <FlatList
        horizontal
        data={visiblePlaces}
        keyExtractor={({ place }) => place.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.hList, styles.cards]}
        renderItem={({ item }) => (
          <PlaceCard
            place={item.place}
            position={item.position}
            onPress={() => router.push(`/lugar/${item.place.id}`)}
          />
        )}
      />

      <Txt variant="caption" style={styles.footer}>
        Un proyecto de Creación Digital, Arquitectura y Música.
      </Txt>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: space.l,
    paddingBottom: space.xl + space.l,
    borderBottomLeftRadius: radius.l + 8,
    borderBottomRightRadius: radius.l + 8,
    gap: space.s,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    paddingVertical: space.xs,
    paddingHorizontal: space.s + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: space.s,
  },
  headerSubtitle: { opacity: 0.9 },
  featured: {
    marginTop: -space.xl,
    marginHorizontal: space.m + 4,
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    boxShadow: shadow.floating,
    overflow: 'hidden',
  },
  featuredImage: { height: 150 },
  featuredBody: { padding: space.m + 4, gap: space.m - 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  sectionTitle: { marginTop: space.l + 4, marginBottom: space.m - 4, paddingHorizontal: space.m + 4 },
  hList: { paddingHorizontal: space.m + 4, gap: space.s + 2 },
  cards: { paddingTop: space.m, paddingBottom: space.m },
  footer: { textAlign: 'center', marginTop: space.m, paddingHorizontal: space.l },
});
