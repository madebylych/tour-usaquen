import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { colors, fontSize } from '@/theme';

// Detalle de la ruta + descarga offline (fase 7).
export default function RouteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <Screen>
      <Text style={styles.title}>Ruta: {slug}</Text>
      <Text style={styles.muted}>Aquí irán la duración, la distancia y la lista de paradas.</Text>
      <Button label="Descargar recorrido" variant="secondary" onPress={() => {}} />
      <Button label="Comenzar tour" onPress={() => router.push('/tour')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  muted: { fontSize: fontSize.body, color: colors.textMuted },
});
