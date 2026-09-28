import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import BottomBar, { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import Button from '@/components/Button';
import PlaceListItem from '@/components/PlaceListItem';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, radius, space } from '@/theme';

// Tour activo. Por ahora lista las paradas; el mapa llega en la fase 2,
// la ubicación en la 3 y el progreso en la 5.
export default function TourScreen() {
  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data) return <StateMessage message="No se pudo abrir el tour." />;
  const route = state.data;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color={colors.primary} />
          <Txt variant="caption" color={colors.primary}>
            Aquí irá el mapa con tu ubicación
          </Txt>
        </View>

        <Txt variant="heading">Paradas</Txt>
        <View style={styles.list}>
          {route.places.map((place, index) => (
            <PlaceListItem
              key={place.id}
              place={place}
              position={index + 1}
              onPress={() => router.push(`/lugar/${place.id}`)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          <Button label="Terminar recorrido" icon="flag" onPress={() => router.push('/completado')} />
        </View>
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.m + 4, gap: space.m - 4, paddingBottom: BOTTOM_BAR_SPACE },
  mapPlaceholder: {
    height: 220,
    borderRadius: radius.l,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    marginBottom: space.s,
  },
  list: { gap: space.m - 4 },
  grow: { flex: 1 },
});
