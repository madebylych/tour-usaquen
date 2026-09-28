import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import Button from '@/components/Button';
import PlaceListItem from '@/components/PlaceListItem';
import Screen from '@/components/Screen';
import StateMessage from '@/components/StateMessage';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, fontSize } from '@/theme';

// Tour activo. Por ahora lista las paradas; el mapa llega en la fase 2,
// la ubicación en la 3 y el progreso en la 5.
export default function TourScreen() {
  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data) return <StateMessage message="No se pudo abrir el tour." />;
  const route = state.data;

  return (
    <Screen>
      <Text style={styles.muted}>Aquí irá el mapa con tu ubicación y las paradas.</Text>
      <View>
        {route.places.map((place, index) => (
          <PlaceListItem
            key={place.id}
            place={place}
            position={index + 1}
            onPress={() => router.push(`/lugar/${place.id}`)}
          />
        ))}
      </View>
      <Button label="Terminar recorrido" onPress={() => router.push('/completado')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: fontSize.body, color: colors.textMuted },
});
