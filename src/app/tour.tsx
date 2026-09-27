import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { colors, fontSize } from '@/theme';

// Mapa + ubicación + siguiente parada + pasaporte (fases 2 a 5).
export default function TourScreen() {
  return (
    <Screen>
      <Text style={styles.muted}>Aquí irá el mapa con tu ubicación y las paradas.</Text>
      <Button label="Abrir parada de prueba" variant="secondary" onPress={() => router.push('/lugar/prueba-1')} />
      <Button label="Terminar recorrido" onPress={() => router.push('/completado')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: fontSize.body, color: colors.textMuted },
});
