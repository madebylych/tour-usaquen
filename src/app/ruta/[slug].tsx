import { StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import Button from '@/components/Button';
import PlaceListItem from '@/components/PlaceListItem';
import Screen from '@/components/Screen';
import StateMessage from '@/components/StateMessage';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, fontSize, space } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/format';

// Detalle de la ruta: datos generales y paradas en orden.
// La descarga offline llega en la fase 7.
export default function RouteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const state = useData(() => getRoute(slug), slug);

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error') return <StateMessage message="No se pudo cargar el recorrido." />;
  const route = state.data;
  if (!route) return <StateMessage message="Este recorrido no existe." />;

  const facts = [
    route.duration_min != null ? formatDuration(route.duration_min) : null,
    route.distance_m != null ? formatDistance(route.distance_m) : null,
    `${route.places.length} paradas`,
  ].filter(Boolean);

  return (
    <Screen>
      <Stack.Screen options={{ title: route.name }} />

      <Text style={styles.title}>{route.name}</Text>
      <Text style={styles.facts}>{facts.join('   ')}</Text>
      {route.description ? <Text style={styles.body}>{route.description}</Text> : null}

      <View>
        <Text style={styles.section}>Paradas</Text>
        {route.places.map((place, index) => (
          <PlaceListItem
            key={place.id}
            place={place}
            position={index + 1}
            onPress={() => router.push(`/lugar/${place.id}`)}
          />
        ))}
      </View>

      <Button label="Descargar recorrido" variant="secondary" onPress={() => {}} />
      <Button
        label="Comenzar tour"
        onPress={() => router.push({ pathname: '/tour', params: { route: route.slug } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  facts: { fontSize: fontSize.body, color: colors.accent, fontWeight: '600' },
  body: { fontSize: fontSize.body, lineHeight: 24, color: colors.text },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: space.s },
});
